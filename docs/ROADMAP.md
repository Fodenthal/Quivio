# PopReplay MVP Development Roadmap

## Project Overview
Real-time multiplayer trivia game inspired by JKLM's PopSauce with AI-powered prompt generation.

## Current Status
- ✅ Monorepo setup with pnpm workspace
- ✅ Colyseus server foundation (COMPLETE & ROBUST)
- ✅ Next.js client foundation
- ✅ Basic room system structure
- ✅ Core game logic implementation (COMPLETE)
- ✅ Game State & Types (COMPLETE) 
- ✅ Client-side testing infrastructure (COMPLETE)
- ✅ Prompt System with 40+ static prompts (COMPLETE)
- ✅ Phase 3A - Connection Foundation (COMPLETE)
- 🏗️ **CURRENT: Ready for Phase 3B - Lobby Interface**
- ❌ Game UI/UX
- ❌ Real-time gameplay features

---

## Phase 1: Core Game Engine (Server)
**Priority: HIGH** | **Estimated Time: 2-3 days**

### 1.1 Create TriviaRoom class extending Colyseus Room
- [] Create `apps/server/src/rooms/TriviaRoom.ts`
- [] Extend Colyseus Room with game-specific logic
- [] Implement basic room lifecycle methods

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
**Priority: HIGH**

### Phase 3A: Connection Foundation
**Goal: Basic Colyseus connection and simple game layout**

#### 3A.1 Create Colyseus client connection manager
- [x] Create `src/lib/gameClient.ts` with connection logic
- [x] Implement basic connection to trivia room
- [x] Add connection status state management
- [x] Handle connection errors gracefully

#### 3A.2 Basic game layout foundation
- [x] Replace home page with simple game layout
- [x] Create `GameLayout` component with basic structure
- [x] Add connection status indicator
- [x] Test connection + basic UI integration

### Phase 3B: Lobby Interface
**Goal: Players can join rooms and see each other**

#### 3B.1 Build minimal lobby interface
- [ ] Create `GameLobby` component
- [ ] Show current players in room
- [ ] Display player ready states
- [ ] Add "Ready" toggle button for players

#### 3B.2 Room joining functionality
- [ ] Add simple room creation (fixed room name for now)
- [ ] Implement room joining logic
- [ ] Show host controls (start game button)
- [ ] Test multi-player joining flow

### Phase 3C: Basic Game View
**Goal: Core gameplay - see prompts, submit guesses**

#### 3C.1 Game state display
- [ ] Create `GameView` component
- [ ] Display current prompt text and category
- [ ] Show basic round information
- [ ] Add game state indicators (waiting, playing, ended)

#### 3C.2 Guess input system
- [ ] Create guess input component
- [ ] Handle guess submission to server
- [ ] Show basic feedback (correct/incorrect)
- [ ] Add enter key submission

### Phase 3D: Real-time Features
**Goal: Live updates and interactive gameplay**

#### 3D.1 Real-time state synchronization
- [ ] Implement real-time state updates from server
- [ ] Update UI when game state changes
- [ ] Handle round transitions
- [ ] Show other players' guesses (basic)

#### 3D.2 Timer and round progression
- [ ] Add round timer display
- [ ] Implement visual countdown
- [ ] Handle round end transitions
- [ ] Show correct answer reveal

### Phase 3E: Scoreboard & Polish
**Goal: Complete game experience with scores**

#### 3E.1 Player scoreboard
- [ ] Create scoreboard component
- [ ] Display player scores in real-time
- [ ] Show round-by-round score updates
- [ ] Highlight current leader

#### 3E.2 Game completion
- [ ] Handle game end state
- [ ] Show winner announcement
- [ ] Add "Play Again" functionality
- [ ] Return to lobby after game

### Phase 3F: Chat & Enhancement
**Goal: Social features and user experience polish**

#### 3F.1 Basic chat system
- [ ] Create chat component
- [ ] Implement message sending/receiving
- [ ] Display chat alongside game
- [ ] Add basic message styling

#### 3F.2 UX improvements
- [ ] Add loading states
- [ ] Improve responsive design
- [ ] Add basic animations/transitions
- [ ] Handle error states gracefully
- [ ] Add keyboard shortcuts (Enter to submit, etc.)

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

*Last Updated: [Current Date]*
*Next Review: [Weekly]* 