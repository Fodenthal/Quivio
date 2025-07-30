import { CohereClient } from 'cohere-ai';

/**
 * Service for retrieving contextual information from Cohere's Wiki-Weaviate
 * to enhance trivia question generation with grounded facts
 */
export class CohereService {
  private cohereClient: CohereClient | null = null;
  private weaviateClient: any = null;

  constructor() {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ COHERE_API_KEY not set - CohereService will be disabled');
      return;
    }

    this.cohereClient = new CohereClient({
      token: apiKey,
    });

    // Initialize Weaviate client for Wiki search (optional for now)
    try {
      // We'll implement this in a later step when we have proper Weaviate setup
      console.log('🔍 Weaviate integration will be implemented in Phase 2');
    } catch (error) {
      console.warn('⚠️ Weaviate client initialization failed:', error);
    }
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

    if (!topic || topic.trim() === '') {
      console.log('🔍 Empty topic provided - skipping Wiki context retrieval');
      return null;
    }

    try {
      console.log(`🔍 Retrieving Wiki context for topic: "${topic}"`);
      
      // For now, return a placeholder context until Weaviate is properly integrated
      // This will be replaced with actual Wiki-Weaviate search in Phase 2
      const placeholderContext = `Context about ${topic}: This topic relates to various aspects and historical information. For now, this is placeholder context until Weaviate integration is fully configured.`;
      
      console.log(`✅ Retrieved placeholder context for "${topic}" (${placeholderContext.length} chars)`);
      console.log(`📝 Note: Weaviate integration pending - using placeholder context`);
      
      return placeholderContext;

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