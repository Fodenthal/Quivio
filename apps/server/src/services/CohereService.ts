import { CohereClient } from 'cohere-ai';

/**
 * Service for retrieving contextual information from Cohere's Wiki-Weaviate
 * to enhance trivia question generation with grounded facts
 */
export class CohereService {
  private cohereClient: CohereClient | null = null;

  constructor() {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ COHERE_API_KEY not set - CohereService will be disabled');
      return;
    }

    this.cohereClient = new CohereClient({
      token: apiKey,
    });
  }

  /**
   * Get relevant Wikipedia context for a topic using Cohere's Wiki-Weaviate
   * @param topic - The topic to search for context
   * @returns Promise<string | null> - Context paragraphs or null if not found
   */
  async getWikiContext(topic: string): Promise<string | null> {
    if (!this.cohereClient) {
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

      // Handle the response properly based on the API structure
      let embeddings: number[][] = [];
      if (Array.isArray(embedResponse.embeddings)) {
        embeddings = embedResponse.embeddings;
      } else if (embedResponse.embeddings && typeof embedResponse.embeddings === 'object') {
        // Handle the case where embeddings might be in a different format
        const embedObj = embedResponse.embeddings as any;
        if (embedObj.float && Array.isArray(embedObj.float)) {
          embeddings = embedObj.float;
        }
      }

      if (!embeddings || embeddings.length === 0) {
        console.warn(`⚠️ Failed to generate embedding for topic: "${topic}"`);
        return null;
      }

      const embedding = embeddings[0];

      // For now, return a simple context based on the topic
      // TODO: Implement Weaviate search when we have proper configuration
      const mockContext = `Context about ${topic}: This topic relates to various aspects and historical information. For now, this is placeholder context until Weaviate integration is fully configured.`;
      
      console.log(`✅ Retrieved mock context for "${topic}" (${mockContext.length} chars)`);
      console.log(`📝 Note: Weaviate integration pending - using placeholder context`);
      
      return mockContext;

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
    return !!this.cohereClient;
  }

  /**
   * Get service status for health checks
   * @returns object with service status information
   */
  getStatus(): { available: boolean; configured: boolean; error?: string } {
    if (!process.env.COHERE_API_KEY) {
      return { available: false, configured: false, error: 'COHERE_API_KEY not set' };
    }

    return { available: this.isAvailable(), configured: true };
  }
} 