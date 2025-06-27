# PopReplay MVP Development Roadmap

## Project Overview
Real-time multiplayer trivia game inspired by JKLM's PopSauce with AI-powered prompt generation.

## Current Status
- ✅ Monorepo setup with pnpm workspace
- ✅ Colyseus server foundation
- ✅ Next.js client foundation
- ✅ Basic room system structure
- ❌ Core game logic implementation
- ❌ Game UI/UX
- ❌ Real-time gameplay features

---

## Phase 1: Core Game Engine (Server)
**Priority: HIGH** | **Estimated Time: 2-3 days**

### 1.1 Create TriviaRoom class extending Colyseus Room
- [ ] Create `apps/server/src/rooms/TriviaRoom.ts`
- [ ] Extend Colyseus Room with game-specific logic
- [ ] Implement basic room lifecycle methods

### 1.2 Design game state schema (TriviaRoomState)
- [ ] Create `apps/server/src/rooms/schema/TriviaRoomState.ts`
- [ ] Define player state schema
- [ ] Define round state schema
- [ ] Define game progression state

### 1.3 Implement player management (join/leave/ready)
- [ ] Add player join/leave handling
- [ ] Implement player ready state system
- [ ] Add player disconnection handling
- [ ] Create player reconnection logic

### 1.4 Add round system with prompts and timers
- [ ] Implement round progression logic
- [ ] Add prompt display system
- [ ] Create round timer functionality
- [ ] Handle round transitions

### 1.5 Create guess validation and scoring logic
- [ ] Implement guess submission handling
- [ ] Add answer validation (case-insensitive, fuzzy matching)
- [ ] Create scoring system based on speed
- [ ] Handle first-correct-answer wins

### 1.6 Implement win condition checking
- [ ] Add target score tracking
- [ ] Implement winner determination
- [ ] Handle game end state
- [ ] Add game restart functionality

### 1.7 Add basic chat message handling
- [ ] Implement chat message broadcasting
- [ ] Add message rate limiting
- [ ] Handle chat state synchronization

---

## Phase 2: Game State & Types
**Priority: HIGH** | **Estimated Time: 1-2 days**

### 2.1 Define shared types in packages/shared
- [ ] Create `packages/shared/types.ts`
- [ ] Define player interface
- [ ] Define game state interfaces
- [ ] Define round state interfaces

### 2.2 Create player schema with score and status
- [ ] Define PlayerState schema
- [ ] Add score tracking properties
- [ ] Add player status enum (ready, playing, spectating)
- [ ] Add player metadata (name, avatar, etc.)

### 2.3 Define round and game state interfaces
- [ ] Create RoundState interface
- [ ] Define GameState interface
- [ ] Add prompt and answer interfaces
- [ ] Define timer state interface

### 2.4 Add message types for client-server communication
- [ ] Define message type constants
- [ ] Create message payload interfaces
- [ ] Add validation schemas for messages
- [ ] Document message flow

### 2.5 Create prompt and answer data structures
- [ ] Define Prompt interface
- [ ] Create Answer interface
- [ ] Add difficulty and category enums
- [ ] Define prompt metadata structure

---

## Phase 3: Client-Side Game Interface
**Priority: HIGH** | **Estimated Time: 3-4 days**

### 3.1 Replace Next.js template with game UI
- [ ] Create game layout components
- [ ] Design responsive game interface
- [ ] Add game-specific styling
- [ ] Implement dark/light theme support

### 3.2 Create Colyseus client connection manager
- [ ] Implement connection management
- [ ] Add reconnection logic
- [ ] Handle connection errors
- [ ] Add connection status indicators

### 3.3 Build game lobby/room selection interface
- [ ] Create room list component
- [ ] Add room creation form
- [ ] Implement room joining logic
- [ ] Add room filtering and search

### 3.4 Implement real-time game view with prompt display
- [ ] Create prompt display component
- [ ] Add round timer visualization
- [ ] Implement real-time state updates
- [ ] Add round transition animations

### 3.5 Add guess input with instant feedback
- [ ] Create guess input component
- [ ] Add instant feedback system
- [ ] Implement input validation
- [ ] Add keyboard shortcuts

### 3.6 Create scoreboard and round progression display
- [ ] Build player scoreboard component
- [ ] Add round progress indicator
- [ ] Implement leaderboard display
- [ ] Add score animations

### 3.7 Add basic chat interface
- [ ] Create chat component
- [ ] Add message input and display
- [ ] Implement emoji support
- [ ] Add chat moderation features

---

## Phase 4: Prompt System (MVP)
**Priority: MEDIUM** | **Estimated Time: 2-3 days**

### 4.1 Create static prompt database (JSON/CSV)
- [ ] Design prompt data structure
- [ ] Create initial prompt dataset
- [ ] Add prompt categories (geography, history, pop culture)
- [ ] Implement prompt loading system

### 4.2 Implement basic prompt loading and selection
- [ ] Add prompt selection algorithm
- [ ] Implement category filtering
- [ ] Add difficulty-based selection
- [ ] Create prompt rotation system

### 4.3 Add simple answer validation (case-insensitive, fuzzy matching)
- [ ] Implement case-insensitive matching
- [ ] Add fuzzy string matching
- [ ] Handle multiple correct answers
- [ ] Add answer normalization

### 4.4 Create prompt categories and difficulty levels
- [ ] Define difficulty levels (Easy, Medium, Hard)
- [ ] Create category system
- [ ] Add prompt metadata
- [ ] Implement category-based scoring

### 4.5 Add round timer and auto-progression
- [ ] Implement round timer
- [ ] Add auto-progression on timeout
- [ ] Create timer visualization
- [ ] Handle timer state management

---

## Phase 5: Room Management & Polish
**Priority: MEDIUM** | **Estimated Time: 2-3 days**

### 5.1 Implement public/private room creation
- [ ] Add room privacy settings
- [ ] Implement room visibility logic
- [ ] Create room discovery system
- [ ] Add room capacity management

### 5.2 Add room codes and invite links
- [ ] Generate unique room codes
- [ ] Create shareable invite links
- [ ] Implement room joining via code/link
- [ ] Add invite link validation

### 5.3 Create room settings (target score, round time)
- [ ] Add room configuration options
- [ ] Implement settings persistence
- [ ] Create settings UI
- [ ] Add default settings

### 5.4 Add spectator mode for full rooms
- [ ] Implement spectator state
- [ ] Add spectator UI
- [ ] Handle spectator interactions
- [ ] Create spectator-to-player promotion

### 5.5 Implement basic error handling and reconnection
- [ ] Add error boundary components
- [ ] Implement graceful error handling
- [ ] Add user-friendly error messages
- [ ] Create error reporting system

### 5.6 Add loading states and game transitions
- [ ] Create loading components
- [ ] Add transition animations
- [ ] Implement skeleton screens
- [ ] Add progress indicators

---

## Phase 6: Testing & Deployment
**Priority: MEDIUM** | **Estimated Time: 2-3 days**

### 6.1 Write unit tests for game logic
- [ ] Test room state management
- [ ] Test scoring algorithms
- [ ] Test answer validation
- [ ] Test round progression

### 6.2 Add integration tests for room flow
- [ ] Test player join/leave flow
- [ ] Test game completion flow
- [ ] Test error scenarios
- [ ] Test reconnection logic

### 6.3 Test with multiple concurrent players
- [ ] Load test with multiple players
- [ ] Test room capacity limits
- [ ] Verify real-time synchronization
- [ ] Test performance under load

### 6.4 Set up production deployment pipeline
- [ ] Configure production build
- [ ] Set up CI/CD pipeline
- [ ] Add environment configuration
- [ ] Implement deployment monitoring

### 6.5 Add monitoring and basic analytics
- [ ] Add performance monitoring
- [ ] Implement error tracking
- [ ] Add user analytics
- [ ] Create monitoring dashboard

---

## Phase 7: Advanced Features (Post-MVP)
**Priority: LOW** | **Estimated Time: 4-6 weeks**

### 7.1 Implement AI-powered prompt generation
- [ ] Integrate OpenAI API
- [ ] Create prompt generation service
- [ ] Add prompt quality validation
- [ ] Implement prompt caching

### 7.2 Add image-based prompts
- [ ] Create image prompt system
- [ ] Add image processing
- [ ] Implement image validation
- [ ] Add image optimization

### 7.3 Create custom prompt builder
- [ ] Build prompt creation interface
- [ ] Add prompt validation tools
- [ ] Implement prompt sharing
- [ ] Create prompt marketplace

### 7.4 Add leaderboards and achievements
- [ ] Create global leaderboards
- [ ] Add achievement system
- [ ] Implement statistics tracking
- [ ] Add social features

### 7.5 Implement advanced chat features
- [ ] Add rich text support
- [ ] Implement file sharing
- [ ] Add voice chat
- [ ] Create chat moderation tools

---

## Development Guidelines

### Code Quality
- Use TypeScript for all new code
- Follow existing code style and patterns
- Add JSDoc comments for complex functions
- Write unit tests for critical game logic

### Git Workflow
- Create feature branches for each task
- Use descriptive commit messages
- Update this roadmap as tasks are completed
- Tag releases for major milestones

### Performance Considerations
- Optimize for low latency (<100ms)
- Minimize bundle size
- Use efficient state management
- Implement proper error boundaries

### Security
- Validate all user inputs
- Implement rate limiting
- Sanitize chat messages
- Use secure WebSocket connections

---

## Success Metrics
- [ ] Game is playable end-to-end
- [ ] Supports 4+ concurrent players
- [ ] Latency < 100ms for NA/EU
- [ ] 99%+ uptime
- [ ] Positive user feedback

---

*Last Updated: [Current Date]*
*Next Review: [Weekly]* 