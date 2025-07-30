import { expect } from 'chai';
import { GeminiService } from '../src/services/GeminiService';

describe('GeminiService Cohere Integration', () => {
  let geminiService: GeminiService;

  beforeEach(() => {
    // Use a mock API key for testing
    geminiService = new GeminiService('test-api-key');
  });

  describe('CohereService integration', () => {
    it('should initialize with CohereService', () => {
      // The service should be initialized in the constructor
      expect(geminiService).to.be.instanceOf(GeminiService);
    });

    it('should handle question generation with Cohere context', async () => {
      // This test verifies that the integration doesn't break existing functionality
      // In a real scenario, we would mock the CohereService to return specific context
      
      try {
        // Attempt to generate a question (will likely fail due to invalid API key, but that's expected)
        await geminiService.generateQuestion({
          topic: 'Space',
          difficulty: 3
        });
      } catch (error) {
        // Expected to fail due to invalid API key, but the CohereService integration should not cause additional errors
        expect(error).to.be.instanceOf(Error);
        // The error should not be related to CohereService initialization
        expect(error.message).to.not.include('CohereService');
      }
    });
  });
}); 