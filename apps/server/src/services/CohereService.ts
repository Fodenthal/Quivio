import { CohereClient } from 'cohere-ai';
import { WeaviateClient } from 'weaviate-client';

/**
 * Service for retrieving contextual information from Cohere's Wiki-Weaviate
 * to enhance trivia question generation with grounded facts
 */
export class CohereService {
  private cohereClient: CohereClient;
  private weaviateClient: WeaviateClient | null = null;

  constructor() {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ COHERE_API_KEY not set - CohereService will be disabled');
      this.cohereClient = null as any;
      return;
    }

    this.cohereClient = new CohereClient({
      token: apiKey,
    });

    // Initialize Weaviate client for Wiki search
    const weaviateUrl = process.env.WEAVIATE_URL;
    const weaviateApiKey = process.env.WEAVIATE_API_KEY;
    
    if (weaviateUrl && weaviateApiKey) {
      this.weaviateClient = new WeaviateClient({
        scheme: 'https',
        host: weaviateUrl.replace('https://', ''),
        apiKey: weaviateApiKey,
      });
    } else {
      console.warn('⚠️ WEAVIATE_URL or WEAVIATE_API_KEY not set - Wiki search disabled');
    }
  }

  /**
   * Get relevant Wikipedia context for a topic using Cohere's Wiki-Weaviate
   * @param topic - The topic to search for context
   * @returns Promise<string | null> - Context paragraphs or null if not found
   */
  async getWikiContext(topic: string): Promise<string | null> {
    if (!this.cohereClient || !this.weaviateClient) {
      console.log('🔍 CohereService disabled - skipping Wiki context retrieval');
      return null;
    }

    try {
      console.log(`🔍 Retrieving Wiki context for topic: "${topic}"`);
      
      // Step 1: Generate embedding for the topic
      const embedResponse = await this.cohereClient.embed({
        texts: [topic],
        model: 'embed-english-v3.0',
        inputType: 'search_document',
      });

      if (!embedResponse.embeddings || embedResponse.embeddings.length === 0) {
        console.warn(`⚠️ Failed to generate embedding for topic: "${topic}"`);
        return null;
      }

      const embedding = embedResponse.embeddings[0];

      // Step 2: Search Wiki-Weaviate for similar articles
      const searchResponse = await this.weaviateClient.graphql
        .get()
        .withClassName('Article')
        .withNearVector({
          vector: embedding,
        })
        .withLimit(3)
        .withAdditional(['distance'])
        .do();

      if (!searchResponse.data?.Get?.Article || searchResponse.data.Get.Article.length === 0) {
        console.log(`📚 No Wiki articles found for topic: "${topic}"`);
        return null;
      }

      // Step 3: Extract and format context from articles
      const articles = searchResponse.data.Get.Article;
      const contextParagraphs: string[] = [];

      for (const article of articles) {
        if (article.content && typeof article.content === 'string') {
          // Take first 200 characters of each article as context
          const excerpt = article.content.substring(0, 200).trim();
          if (excerpt) {
            contextParagraphs.push(excerpt);
          }
        }
      }

      if (contextParagraphs.length === 0) {
        console.log(`📚 No content extracted from Wiki articles for topic: "${topic}"`);
        return null;
      }

      const context = contextParagraphs.join('\n\n');
      console.log(`✅ Retrieved ${contextParagraphs.length} Wiki context paragraphs for "${topic}" (${context.length} chars)`);
      
      return context;

    } catch (error) {
      console.error(`❌ Error retrieving Wiki context for "${topic}":`, error);
      return null;
    }
  }

  /**
   * Check if the service is properly configured and available
   * @returns boolean - True if service is available
   */
  isAvailable(): boolean {
    return !!(this.cohereClient && this.weaviateClient);
  }

  /**
   * Get service status for health checks
   * @returns object with service status information
   */
  getStatus(): { available: boolean; configured: boolean; error?: string } {
    if (!process.env.COHERE_API_KEY) {
      return { available: false, configured: false, error: 'COHERE_API_KEY not set' };
    }

    if (!process.env.WEAVIATE_URL || !process.env.WEAVIATE_API_KEY) {
      return { available: false, configured: false, error: 'Weaviate configuration missing' };
    }

    return { available: this.isAvailable(), configured: true };
  }
} 