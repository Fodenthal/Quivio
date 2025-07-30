# Quivio Commons + Cohere MVP Implementation Plan

## **Executive Summary**

This document outlines a revised implementation plan for enhancing Quivio's trivia game with grounded AI responses and image-based questions, specifically designed to work within the existing codebase architecture.

---

## **1. Current Architecture Analysis**

### **✅ Existing Assets**

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| **Colyseus Server** | ✅ Active | `apps/server/src/rooms/TriviaRoom.ts` | Game state management, question buffering, real-time gameplay |
| **GeminiService** | ✅ Active | `apps/server/src/services/GeminiService.ts` | Already has RAG integration (currently inactive) |
| **Question Database** | ✅ Active | `apps/server/src/services/QuestionDatabase.ts` | SQLite/Supabase hybrid with caching |
| **Game Pin System** | ✅ Active | `apps/server/src/services/GamePinRegistry.ts` | Complete room registration and lookup |
| **Frontend** | ✅ Active | `apps/web/src/` | Next.js with real-time game state management |
| **RAG Service** | 💤 Inactive | `apps/rag-service/` | Python microservice coded but not deployed |

### **🔍 Key Findings**

1. **RAG Service Already Exists**: The `rag-service` Python microservice is fully coded but inactive
2. **GeminiService Has RAG Integration**: Already implements timeout-based RAG context fetching via `axios`
3. **No Image Support**: Current system is text-only questions
4. **Question Flow**: Database → Buffer → Gemini API → Store → Display
5. **Environment Ready**: Server already has `RAG_SERVICE_URL` configuration

---

## **2. Core Problem & Solution**

### **The Problem**
- **Gemini prompts are ungrounded** → risk of hallucination
- **No image-based trivia** despite strong user demand
- **Constraint**: zero new infrastructure (no Redis, pgvector, Python microservices)

### **The Solution**
- **Text Grounding**: Replace inactive RAG service with Cohere's public Wiki-Weaviate
- **Image Questions**: Wikimedia Commons (CC-licensed) with Unsplash fallback
- **Implementation**: Everything in Node.js to avoid additional processes

---

## **3. Revised Target Architecture**

```mermaid
graph TD
    T[Topic] -->|embed(text)| CAPI[Cohere API]
    CAPI -->|nearText → Wiki| TXT[Context paragraphs]
    
    T -->|MediaSearch REST| COM[Commons Image?]
    COM -->|if miss| UAPI[Unsplash via Cohere Weaviate]
    
    TXT --> G[GeminiService.buildPrompt()]
    COM & UAPI --> Q[ImageQuestionResolver]
    
    G --> QF[Question Generation]
    Q --> QF
    QF --> DB[(Question Database)]
    DB --> DISP[Game Display]
```

*• **Text grounding**: Cohere's public Wiki-Weaviate (no infra needed)*  
*• **Images**: Commons first (CC-BY/SA, PD) → Unsplash fallback (modern images)*

---

## **4. Phased Implementation Plan**

| Phase | Deliverable | Tasks | ETA |
|-------|-------------|-------|-----|
| **0 – SDK Bootstrap** | Cohere connectivity verified | `npm i cohere-ai weaviate-client`<br>`COHERE_API_KEY` → `.env.local` | 0.25 d |
| **1 – Text Context** | Grounded Gemini questions | • `CohereService.getWikiContext()`<br>• Replace RAG service calls in `GeminiService`<br>• Enhanced prompt building | 0.5 d |
| **2 – Commons Image MVP** | Licence-safe image questions | • `ImageService.fetchCommonsImage()`<br>• Extend `GeneratedQuestion` interface<br>• `<ImageQuestion/>` React component | 1 d |
| **3 – Unsplash Fallback** | Modern imagery | • `ImageService.getUnsplashFallback()`<br>• Fallback logic: Commons → Unsplash → Text | 0.5 d |
| **4 – UX Polish** | Seamless demo | • Loading states, attribution display<br>• Error handling, unit tests | 0.5 d |

---

## **5. Detailed User Flows**

### **Text Question Flow**
```
1. User enters topic "Marvel Cinematic Universe"
2. TriviaRoom.generateAndAddToBuffer() called
3. CohereService.getWikiContext("Marvel Cinematic Universe")
   → Cohere embed → Wiki-Weaviate search → Context paragraphs
4. GeminiService.buildContextualPrompt(topic, context)
5. Gemini API generates grounded question
6. Question displayed in GameView
```

### **Image Question Flow**
```
1. User enters topic "Famous Landmarks"
2. Question generation determines question type (text vs image)
3. If image question:
   a. ImageService.fetchCommonsImage("Famous Landmarks")
   b. If found: Use Commons image with attribution
   c. If not found: ImageService.getUnsplashFallback()
   d. If no image: Fallback to text question
4. Question + image displayed in ImageQuestion component
```

---

## **6. Implementation Details**

### **Environment Configuration**
```bash
# Add to apps/server/.env
COHERE_API_KEY=your-cohere-key
WEAVIATE_URL=https://cohere-demo.weaviate.network
WEAVIATE_API_KEY=your-weaviate-key
UNSPLASH_ACCESS_KEY=your-unsplash-key
```

### **New Service Classes**

#### **CohereService.ts**
```typescript
export class CohereService {
  async getWikiContext(topic: string): Promise<string | null> {
    // Cohere embed → Wiki-Weaviate nearText search
    // Return context paragraphs or null
  }
}
```

#### **ImageService.ts**
```typescript
export class ImageService {
  async fetchCommonsImage(topic: string): Promise<ImageResult | null> {
    // Wikimedia Commons MediaSearch API
  }
  
  async getUnsplashFallback(topic: string): Promise<ImageResult | null> {
    // Cohere Unsplash Weaviate
  }
}
```

### **Enhanced Data Structures**

#### **Extended GeneratedQuestion Interface**
```typescript
interface GeneratedQuestion {
  question: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  category: string;
  difficulty: number;
  // NEW FIELDS:
  questionType: 'text' | 'image';
  imageUrl?: string;
  imageAttribution?: string;
  imageLicense?: string;
}
```

#### **ImageResult Interface**
```typescript
interface ImageResult {
  url: string;
  title: string;
  author: string;
  license: string;
  source: 'commons' | 'unsplash';
  thumbnailUrl?: string;
}
```

### **Modified GeminiService**
```typescript
// Enhance existing generateQuestion method
async generateQuestion(request: QuestionRequest): Promise<GeneratedQuestion> {
  // Get Cohere context instead of RAG service
  const context = await this.cohereService.getWikiContext(request.topic);
  const prompt = this.buildContextualPrompt(request, context);
  
  // Determine question type (text vs image)
  const questionType = this.determineQuestionType(request.topic);
  
  // Generate question with type-specific logic
  if (questionType === 'image') {
    return this.generateImageQuestion(request, prompt);
  } else {
    return this.generateTextQuestion(request, prompt);
  }
}
```

---

## **7. File Structure Changes**

### **New Files**
```
apps/server/src/services/
├── CohereService.ts          # Cohere API integration
├── ImageService.ts           # Image fetching logic
└── types/
    └── image.ts              # Image-related interfaces

apps/web/src/app/components/
├── ImageQuestion.tsx         # Image question display
└── ImageAttribution.tsx      # Attribution overlay
```

### **Modified Files**
```
apps/server/src/services/
├── GeminiService.ts          # Add Cohere context, image support
└── QuestionDatabase.ts       # Extend schema for image questions

apps/server/src/rooms/
└── TriviaRoom.ts            # Handle image question types

apps/web/src/app/components/
└── GameView.tsx             # Integrate ImageQuestion component
```

---

## **8. Error Handling & Fallbacks**

### **Text Generation Fallbacks**
1. **Cohere API fails** → Use basic prompt (current behavior)
2. **Wiki context empty** → Use basic prompt
3. **Gemini API fails** → Use cached questions from database

### **Image Generation Fallbacks**
1. **Commons API fails** → Try Unsplash
2. **Unsplash fails** → Generate text-only question
3. **Image load fails** → Show placeholder + text question
4. **No suitable images** → Fallback to text question

### **Rate Limiting**
- Implement request queuing for external APIs
- Cache successful responses for 1 hour
- Exponential backoff for failed requests

---

## **9. Testing Strategy**

### **Unit Tests**
```typescript
// apps/server/test/CohereService_test.ts
describe('CohereService', () => {
  it('should retrieve wiki context for valid topics');
  it('should handle API failures gracefully');
  it('should return null for empty results');
});

// apps/server/test/ImageService_test.ts
describe('ImageService', () => {
  it('should fetch Commons images successfully');
  it('should fallback to Unsplash when Commons fails');
  it('should handle licensing requirements');
});
```

### **Integration Tests**
```typescript
// apps/server/test/TriviaRoom_test.ts
describe('Image Questions', () => {
  it('should generate image questions for appropriate topics');
  it('should display image questions correctly');
  it('should handle image loading failures');
});
```

---

## **10. Deployment Considerations**

### **Environment Variables**
- Add Cohere API key to production environment
- Add Unsplash API key for fallback images
- Configure Weaviate connection (public demo available)

### **Performance Monitoring**
- Track Cohere API response times
- Monitor image loading success rates
- Log fallback usage patterns

### **Cost Optimization**
- Cache Wiki context responses
- Implement image result caching
- Monitor API usage and costs

---

## **11. Success Metrics**

### **Technical Metrics**
- **Context Retrieval Success Rate**: >80% of topics get relevant Wiki context
- **Image Question Generation**: 30-50% of questions include images
- **Fallback Effectiveness**: <5% of image requests fail completely
- **API Response Times**: <2s for context, <3s for images

### **User Experience Metrics**
- **Question Quality**: Improved accuracy through grounded context
- **Engagement**: Higher completion rates for image questions
- **Satisfaction**: Positive feedback on visual question variety

---

## **12. Future Enhancements**

### **Phase 5: Advanced Features**
- **Multi-modal questions**: Text + image combinations
- **Dynamic difficulty**: Adjust based on image complexity
- **User-generated content**: Allow custom image uploads
- **Advanced caching**: Redis for high-traffic scenarios

### **Phase 6: Content Expansion**
- **Video questions**: Short clips for dynamic content
- **Audio questions**: Sound-based trivia
- **Interactive elements**: Clickable image regions

---

## **Summary**

This revised plan leverages the existing codebase architecture while delivering grounded AI responses and image-based trivia questions. The implementation is incremental, risk-managed, and maintains the constraint of zero new infrastructure while significantly enhancing the user experience.

*Total Implementation Time: ~2.75 days*  
*Risk Level: Low (uses existing patterns)*  
*Value Delivery: High (immediate user experience improvement)*
