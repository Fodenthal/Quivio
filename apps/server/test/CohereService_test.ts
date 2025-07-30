import { expect } from 'chai';
import { CohereService } from '../src/services/CohereService';

describe('CohereService', () => {
  let cohereService: CohereService;

  beforeEach(() => {
    cohereService = new CohereService();
  });

  describe('constructor', () => {
    it('should initialize with proper configuration', () => {
      const status = cohereService.getStatus();
      expect(status).to.have.property('available');
      expect(status).to.have.property('configured');
    });

    it('should handle missing API keys gracefully', () => {
      // This test will pass even without API keys since we handle missing config gracefully
      const status = cohereService.getStatus();
      expect(status).to.have.property('configured');
    });
  });

  describe('isAvailable', () => {
    it('should return boolean indicating service availability', () => {
      const available = cohereService.isAvailable();
      expect(typeof available).to.equal('boolean');
    });
  });

  describe('getWikiContext', () => {
    it('should return null when service is not available', async () => {
      // Mock the service to be unavailable
      const mockService = new CohereService();
      // @ts-ignore - accessing private property for testing
      mockService.cohereClient = null;
      
      const result = await mockService.getWikiContext('test topic');
      expect(result).to.be.null;
    });

    it('should handle empty topic gracefully', async () => {
      const result = await cohereService.getWikiContext('');
      expect(result).to.be.a('string');
      expect(result).to.include('Context about');
    });

    it('should handle null topic gracefully', async () => {
      const result = await cohereService.getWikiContext(null as any);
      expect(result).to.be.null;
    });
  });

  describe('getStatus', () => {
    it('should return status object with required properties', () => {
      const status = cohereService.getStatus();
      expect(status).to.have.property('available');
      expect(status).to.have.property('configured');
      expect(typeof status.available).to.equal('boolean');
      expect(typeof status.configured).to.equal('boolean');
    });
  });
}); 