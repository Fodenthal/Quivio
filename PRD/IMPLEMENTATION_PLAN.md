# Implementation Plan: Question DB Schema & Decision Logic

## Overview

This document outlines the detailed implementation plan for the two core missing components in Phase 1 of Quiv.io:

1. **Question DB Schema** - PostgreSQL database structure for storing questions, topics, and metadata
2. **Decision Logic v1** - The intelligent question sourcing system that implements the `[Request -> Cache -> DB -> Generate]` flow

## Phase 1: Foundation & Core Infrastructure

### 1.1 Question Database Schema Design

#### Step 1.1.1: Core Schema Definition

**Tables to Create:**
```sql
-- Topics table for normalized topic management
topics (
  id: uuid PRIMARY KEY,
  name: varchar(255) UNIQUE NOT NULL,
  canonical_name: varchar(255) NOT NULL,
  aliases: text[], -- for topic normalization
  category: varchar(100),
  difficulty_level: enum('easy', 'medium', 'hard'),
  created_at: timestamp,
  updated_at: timestamp
)

-- Questions table
questions (
  id: uuid PRIMARY KEY,
  topic_id: uuid REFERENCES topics(id),
  question_text: text NOT NULL,
  question_type: enum('multiple_choice', 'true_false') DEFAULT 'multiple_choice',
  difficulty: enum('easy', 'medium', 'hard'),
  source: enum('database', 'generated', 'user_submitted'),
  quality_score: decimal(3,2), -- 0.00 to 5.00
  times_asked: integer DEFAULT 0,
  correct_rate: decimal(5,4), -- percentage as decimal
  created_at: timestamp,
  updated_at: timestamp
)

-- Answer options for multiple choice questions
answer_options (
  id: uuid PRIMARY KEY,
  question_id: uuid REFERENCES questions(id) ON DELETE CASCADE,
  option_text: text NOT NULL,
  is_correct: boolean NOT NULL,
  option_order: integer NOT NULL
)

-- Topic normalization cache for performance
topic_aliases (
  id: uuid PRIMARY KEY,
  raw_input: varchar(500),
  normalized_topic_id: uuid REFERENCES topics(id),
  confidence_score: decimal(3,2),
  created_at: timestamp
)
```

**Deliverables:**
- SQL migration scripts
- Database indexes for performance
- Basic CRUD operations using Prisma/TypeORM

#### Step 1.1.2: Seed Database with Initial Content

**Tasks:**
- Create seed script with 100-200 high-quality questions across 10-15 popular topics
- Implement data validation rules
- Create database backup/restore procedures

### 1.2 Caching Layer Setup

#### Step 1.2.1: Redis Integration

**Implementation:**
- Set up Redis connection in the server
- Define cache key structure: `questions:{normalized_topic}:{hash}`
- Implement cache TTL policies (default: 24 hours)
- Create cache invalidation strategies

**Cache Structure:**
```typescript
interface CachedQuestionSet {
  topic: string;
  questions: Question[];
  generated_at: timestamp;
  expires_at: timestamp;
  cache_hit_count: number;
}
```

## Phase 2: Topic Normalization & LLM Integration

### 2.1 Topic Normalization Engine

#### Step 2.1.1: Basic Normalization Logic

**Implementation Strategy:**
1. **String Preprocessing:**
   - Convert to lowercase
   - Remove special characters
   - Handle pluralization (cats -> cat)
   - Remove common stop words

2. **Similarity Matching:**
   - Implement fuzzy string matching using libraries like `fuse.js`
   - Create synonym mapping for common variations
   - Use edit distance algorithms for close matches

3. **Fallback to LLM:**
   - For unclear topics, use LLM to suggest canonical topic
   - Cache these mappings for future use

**Service Interface:**
```typescript
interface TopicNormalizationService {
  normalizeInput(rawInput: string): Promise<{
    canonicalTopic: string;
    confidence: number;
    suggestedAlternatives?: string[];
  }>;
}
```

### 2.2 LLM Integration for Question Generation

#### Step 2.2.1: Single Model Integration (MVP)

**Implementation:**
1. **Service Layer:**
   - Create `QuestionGenerationService`
   - Integrate with OpenAI GPT-4 or Google Gemini
   - Implement structured prompt engineering

2. **Prompt Design:**
```typescript
const QUESTION_GENERATION_PROMPT = `
Generate 10 high-quality trivia questions about: {topic}

Requirements:
- Questions should be factual and verifiable
- Include 4 multiple choice options (A, B, C, D)
- Mark the correct answer
- Vary difficulty levels
- Avoid questions that are too obscure or too obvious

Return as JSON array with this structure:
{
  "questions": [
    {
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "difficulty": "medium",
      "explanation": "optional explanation"
    }
  ]
}
`;
```

3. **Response Validation:**
   - JSON schema validation
   - Content filtering for inappropriate material
   - Duplicate detection within generated set

## Phase 3: Decision Logic Implementation

### 3.1 Core Decision Engine

#### Step 3.1.1: Request Flow Implementation
**Estimated Time:** 4-5 days

**Decision Flow Logic:**
```typescript
class QuestionSourcingService {
  async getQuestions(rawTopic: string, count: number = 10): Promise<Question[]> {
    // 1. Normalize topic
    const normalizedTopic = await this.topicNormalizer.normalize(rawTopic);
    
    // 2. Check cache
    const cached = await this.cacheService.get(normalizedTopic);
    if (cached && cached.questions.length >= count) {
      return this.selectQuestions(cached.questions, count);
    }
    
    // 3. Query database
    const dbQuestions = await this.questionRepository.findByTopic(
      normalizedTopic, 
      count * 2 // Get more than needed for variety
    );
    
    if (dbQuestions.length >= count) {
      const selected = this.selectQuestions(dbQuestions, count);
      await this.cacheService.set(normalizedTopic, selected);
      return selected;
    }
    
    // 4. Generate missing questions
    const needed = count - dbQuestions.length;
    const generated = await this.generateQuestions(normalizedTopic, needed);
    
    // 5. Combine and cache
    const combined = [...dbQuestions, ...generated];
    await this.cacheService.set(normalizedTopic, combined);
    
    return this.selectQuestions(combined, count);
  }
}
```

#### Step 3.1.2: Question Selection Algorithm
**Estimated Time:** 2 days

**Selection Criteria:**
- Quality score weighting
- Avoid recently asked questions for repeat players
- Randomization with deterministic seed for fairness

### 3.2 Integration with Game Engine

#### Step 3.2.1: Colyseus Room Integration
**Estimated Time:** 2-3 days

**Implementation:**
1. **TriviaRoom Enhancement:**
   - Integrate QuestionSourcingService
   - Handle question fetching during lobby phase
   - Implement question delivery timing

2. **Error Handling:**
   - Fallback strategies for LLM failures
   - Graceful degradation when DB is unavailable
   - User-friendly error messages

## Phase 4: Quality Assurance & Monitoring

### 4.1 Question Validation System

#### Step 4.1.1: Automated Validation
**Estimated Time:** 2-3 days

**Validation Checks:**
- LLM-based quality assessment
- Factual accuracy verification (when possible)
- Appropriate difficulty level
- Grammar and spelling check
- Content moderation

### 4.2 Analytics & Monitoring

#### Step 4.2.1: Performance Metrics
**Estimated Time:** 1-2 days

**Key Metrics to Track:**
- Cache hit rate by topic
- Question generation latency
- User satisfaction (implicit through game completion)
- Cost per question generated
- Database query performance

## Implementation Timeline

### Week 1-2: Database Foundation
- Database schema implementation
- Redis caching setup
- Basic CRUD operations
- Seed data creation

### Week 3-4: Topic Processing & LLM
- Topic normalization service
- LLM integration for question generation
- Prompt engineering and validation

### Week 5-6: Decision Logic
- Core decision engine implementation
- Integration with existing Colyseus rooms
- Error handling and fallback strategies

### Week 7: Testing & Polish
- Comprehensive testing
- Performance optimization
- Documentation
- Monitoring setup

## Risk Mitigation

### Technical Risks
1. **LLM Rate Limits:** Implement queue system and multiple API keys
2. **Database Performance:** Proper indexing and query optimization
3. **Cache Invalidation:** Clear cache invalidation strategies

### Quality Risks
1. **Generated Question Quality:** Multiple validation layers
2. **Topic Misclassification:** Human review process for edge cases
3. **Duplicate Content:** Deduplication algorithms

## Success Criteria

### MVP Success Metrics:
- ✅ 95%+ uptime for question sourcing
- ✅ <2 second response time for question retrieval
- ✅ 80%+ cache hit rate for popular topics
- ✅ Generate questions for 100+ unique topics
- ✅ Support 10+ concurrent game rooms

### Quality Metrics:
- ✅ Generated questions pass basic validation 90%+ of the time
- ✅ Users complete games (proxy for question quality) 75%+ of the time
- ✅ Zero inappropriate content reaches users

This implementation plan provides a clear roadmap for building the core question sourcing infrastructure needed for Quiv.io's MVP launch. 
