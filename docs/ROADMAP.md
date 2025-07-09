# PopReplay MVP Development Roadmap

## Project Overview
Real-time multiplayer trivia game inspired by JKLM's PopSauce with AI-powered prompt generation.

## 🎯 JKLM Emulation Goals
**Core Mission**: Match JKLM's smooth, low-latency, snappy gameplay experience

### Key JKLM Features to Emulate:
- ⚡ **Ultra-low latency** - Instant feedback on all actions
- 🎮 **Snappy round flow** - Rounds continue until timer expires OR everyone answers
- 🟢 **Instant player highlighting** - Green checkmarks appear immediately when players answer correctly
- 📊 **Live scoreboard** - Real-time score updates visible to all players
- 🎉 **Celebration moments** - Proper winner announcements and game-end experiences
- 🔄 **Smooth transitions** - Seamless flow between game states
- 👥 **Live player status** - Clear indication of who's answered, who's thinking

---

## Current Status
- ✅ Monorepo setup with pnpm workspace (COMPLETE)
- ✅ Colyseus server foundation (COMPLETE & ROBUST)
- ✅ Next.js client foundation (COMPLETE)
- ✅ Basic room system structure (COMPLETE)
- ✅ Core game logic implementation (COMPLETE)
- ✅ Game State & Types (COMPLETE) 
- ✅ Client-side testing infrastructure (COMPLETE)
- ✅ Prompt System with 40+ static prompts (COMPLETE)
- ✅ Phase 3A - Connection Foundation (COMPLETE)
- ✅ Phase 3B - Lobby Interface (COMPLETE)
- ✅ Phase 3C - Basic Game View (COMPLETE)
- 🏗️ **CURRENT: Phase 3D - JKLM Emulation Features**
- ❌ Real-time gameplay features
- ❌ Low-latency optimizations
- ❌ Enhanced UI/UX polish

---

## Phase 1: Core Game Engine (Server) ✅ COMPLETE
**Priority: HIGH** | **Status: COMPLETE**

### 1.1 Create TriviaRoom class extending Colyseus Room ✅
- [x] Create `apps/server/src/rooms/TriviaRoom.ts`
- [x] Extend Colyseus Room with game-specific logic
- [x] Implement basic room lifecycle methods

### 1.2 Design game state schema (TriviaRoomState) ✅
- [x] Create `apps/server/src/rooms/schema/TriviaRoomState.ts`
- [x] Define player state schema
- [x] Define round state schema
- [x] Define game progression state

### 1.3 Implement player management (join/leave/ready) ✅
- [x] Add player join/leave handling
- [x] Implement player ready state system
- [x] Add player disconnection handling
- [x] Create player reconnection logic

### 1.4 Add round system with prompts and timers ✅
- [x] Implement round progression logic
- [x] Add prompt display system
- [x] Create round timer functionality
- [x] Handle round transitions

### 1.5 Create guess validation and scoring logic ✅
- [x] Implement guess submission handling
- [x] Add answer validation (case-insensitive, fuzzy matching)
- [x] Create scoring system based on speed
- [x] Handle first-correct-answer wins

### 1.6 Implement win condition checking ✅
- [x] Add target score tracking
- [x] Implement winner determination
- [x] Handle game end state
- [x] Add game restart functionality

### 1.7 Add basic chat message handling ✅
- [x] Implement chat message broadcasting
- [x] Add message rate limiting
- [x] Handle chat state synchronization

---

## Phase 2: Game State & Types ✅ COMPLETE
**Priority: HIGH** | **Status: COMPLETE**

### 2.1 Define shared types in packages/shared ✅
- [x] Create `packages/shared/types.ts`
- [x] Define player interface
- [x] Define game state interfaces
- [x] Define round state interfaces

### 2.2 Create player schema with score and status ✅
- [x] Define PlayerState schema
- [x] Add score tracking properties
- [x] Add player status enum (ready, playing, spectating)
- [x] Add player metadata (name, avatar, etc.)

### 2.3 Define round and game state interfaces ✅
- [x] Create RoundState interface
- [x] Define GameState interface
- [x] Add prompt and answer interfaces
- [x] Define timer state interface

### 2.4 Add message types for client-server communication ✅
- [x] Define message type constants
- [x] Create message payload interfaces
- [x] Add validation schemas for messages
- [x] Document message flow

### 2.5 Create prompt and answer data structures ✅
- [x] Define Prompt interface
- [x] Create Answer interface
- [x] Add difficulty and category enums
- [x] Define prompt metadata structure

---

## Phase 3: Client-Side Game Interface ✅ MOSTLY COMPLETE
**Priority: HIGH**

### Phase 3A: Connection Foundation ✅ COMPLETE
**Goal: Basic Colyseus connection and simple game layout**

#### 3A.1 Create Colyseus client connection manager ✅
- [x] Create `src/lib/gameClient.ts` with connection logic
- [x] Implement basic connection to trivia room
- [x] Add connection status state management
- [x] Handle connection errors gracefully

#### 3A.2 Basic game layout foundation ✅
- [x] Replace home page with simple game layout
- [x] Create `GameLayout` component with basic structure
- [x] Add connection status indicator
- [x] Test connection + basic UI integration

### Phase 3B: Lobby Interface ✅ COMPLETE
**Goal: Players can join rooms and see each other**

#### 3B.1 Build minimal lobby interface ✅
- [x] Create `GameLobby` component
- [x] Show current players in room
- [x] Display player ready states
- [x] Add "Ready" toggle button for players

#### 3B.2 Room joining functionality ✅
- [x] Add simple room creation (fixed room name for now)
- [x] Implement room joining logic
- [x] Show host controls (start game button)
- [x] Test multi-player joining flow

### Phase 3C: Basic Game View ✅ COMPLETE
**Goal: Core gameplay - see prompts, submit guesses**

#### 3C.1 Game state display ✅
- [x] Create `GameView` component
- [x] Display current prompt text and category
- [x] Show basic round information
- [x] Add game state indicators

#### 3C.2 Guess input system ✅
- [x] Create guess input component
- [x] Handle guess submission to server
- [x] Show basic feedback (correct/incorrect)
- [x] Add enter key submission

---

## 🚨 Phase 3D: JKLM Emulation Features
**Priority: CRITICAL** | **Goal: Match JKLM's snappy, low-latency gameplay**

### 3D.1 Fix Core Round Logic 🔥 IMMEDIATE
**Critical architectural changes to match JKLM behavior**

- [ ] **Fix round continuation logic** - Rounds should continue until timer expires OR all players have answered
- [ ] Remove 2-second delay after correct answer (causes perceived lag)
- [ ] Implement "all players answered" detection for early round completion
- [ ] Optimize state update batching to reduce network roundtrips
- [ ] Add server-side performance monitoring for round transitions

### 3D.2 JKLM-Style Player List Component 🟢 IMMEDIATE  
**Real-time guess display and correct answer highlighting like JKLM**

- [ ] Create player list component showing all players with avatars and scores
- [ ] Implement live incorrect guess display under each player name (server-validated)
- [ ] Show only the most recent incorrect guess (replacing previous guesses)
- [ ] Add player box highlighting when they guess correctly (opaque + white glossy effect, no guess text)
- [ ] Order players by score (high to low) with smooth reordering animations
- [ ] Persist incorrect guesses until round ends (no auto-clearing)
- [ ] Add smooth animations for guess updates and score-based reordering
- [ ] Handle guess clearing/reset between rounds

### 3D.3 Integrated Player List Scoreboard 📊 IMMEDIATE
**Score display within the player list component (JKLM-style)**

- [ ] Display player scores directly in the player list component
- [ ] Add smooth score update animations (+points effects)
- [ ] Highlight score changes when players earn points
- [ ] Maintain score visibility alongside guess display and highlighting

### 3D.4 Enhanced Game Flow & Transitions ⚡ HIGH PRIORITY
**Smooth, responsive state transitions**

- [ ] Implement smooth round-to-round transitions
- [ ] Add countdown timers for round starts
- [ ] Create proper loading states between game phases
- [ ] Implement optimistic UI updates for reduced perceived latency
- [ ] Add smooth animations for all state changes

### 3D.5 Winner Screen & Game Completion 🎉 HIGH PRIORITY
**Proper celebration and game-end experience**

- [ ] Create enhanced winner announcement screen
- [ ] Show final leaderboard with all player scores
- [ ] Add celebration animations and confetti effects
- [ ] Implement "Play Again" functionality
- [ ] Add smooth return to lobby flow
- [ ] Show game statistics (rounds played, fastest answers, etc.)

---

## Phase 3E: Advanced Real-time Features
**Priority: HIGH** | **Goal: Complete JKLM-style interactivity**

### 3E.1 Player List Component Technical Implementation
**Server-side support for JKLM-style real-time guess display**

- [ ] Add server-side guess tracking per player (incorrect guesses only)
- [ ] Implement guess broadcasting to all clients in real-time
- [ ] Add correct answer sequence tracking for player reordering
- [ ] Create guess state cleanup between rounds
- [ ] Optimize network efficiency for frequent guess updates
- [ ] Add guess validation and sanitization before broadcasting

### 3E.2 Advanced Player Interaction
- [ ] Implement spectator mode for full rooms
- [ ] Add player emoji reactions during rounds
- [ ] Show connection quality indicators per player
- [ ] Add player typing indicators (optional enhancement)

### 3E.3 Enhanced Chat & Social Features
- [ ] Create in-game chat component
- [ ] Add emoji reactions and quick responses
- [ ] Implement chat during gameplay (non-disruptive)
- [ ] Add player muting/blocking options

### 3E.4 Performance Optimizations
- [ ] Implement client-side prediction for inputs
- [ ] Add state compression for large player counts
- [ ] Optimize network payload sizes
- [ ] Add connection quality monitoring and adaptation

---

## Phase 4: Prompt System Enhancement
**Priority: MEDIUM** | **Estimated Time: 2-3 days**

### 4.1 Static prompt database improvements ✅ MOSTLY COMPLETE
- [x] Design prompt data structure
- [x] Create initial prompt dataset (40+ prompts)
- [x] Add prompt categories (geography, history, pop culture, science, sports)
- [x] Implement prompt loading system

### 4.2 Enhanced prompt selection
- [ ] Add difficulty-based progression within games
- [ ] Implement category balancing across rounds
- [ ] Add prompt variation tracking to avoid repetition
- [ ] Create prompt rating system for quality control

### 4.3 Advanced answer validation
- [ ] Improve fuzzy string matching algorithm
- [ ] Add support for multiple correct answers per prompt
- [ ] Implement answer synonym detection
- [ ] Add spell-check suggestions for close answers

---

## Phase 5: Room Management & Polish
**Priority: MEDIUM** | **Estimated Time: 2-3 days**

### 5.1 Enhanced room creation
- [ ] Add room privacy settings (public/private)
- [ ] Implement room codes and invite links
- [ ] Create room discovery system
- [ ] Add custom room settings (target score, round time)

### 5.2 Room management features
- [ ] Add host controls (kick players, pause game)
- [ ] Implement spectator mode for full rooms
- [ ] Add room capacity management
- [ ] Create waiting room queue system

### 5.3 Error handling & reconnection
- [ ] Implement graceful disconnection handling
- [ ] Add automatic reconnection with state recovery
- [ ] Create user-friendly error messages
- [ ] Add network quality indicators

---

## Phase 6: UI/UX Polish & Accessibility
**Priority: MEDIUM** | **Estimated Time: 3-4 days**

### 6.1 Visual polish
- [ ] Implement smooth animations throughout
- [ ] Add sound effects for key actions
- [ ] Create responsive design for mobile devices
- [ ] Add dark mode support

### 6.2 Accessibility improvements
- [ ] Add keyboard navigation support
- [ ] Implement screen reader compatibility
- [ ] Add colorblind-friendly design
- [ ] Create high contrast mode

### 6.3 Performance optimizations
- [ ] Implement lazy loading for components
- [ ] Add image optimization for prompts
- [ ] Optimize bundle size and loading times
- [ ] Add performance monitoring

---

## Phase 7: Testing & Deployment
**Priority: MEDIUM** | **Estimated Time: 2-3 days**

### 7.1 Production deployment
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment
- [ ] Add environment-specific configurations
- [ ] Implement deployment monitoring

### 7.2 Monitoring & analytics
- [ ] Add performance monitoring
- [ ] Implement error tracking
- [ ] Add user analytics
- [ ] Create operational dashboard

---

## Phase 8: Advanced Features (Post-MVP)
**Priority: LOW** | **Estimated Time: 4-6 weeks**

### 8.1 AI-powered features
- [ ] Integrate OpenAI API for prompt generation
- [ ] Add dynamic difficulty adjustment
- [ ] Implement personalized prompt recommendations
- [ ] Create AI-powered answer validation

### 8.2 Advanced prompt types
- [ ] Add image-based prompts
- [ ] Implement audio/music prompts
- [ ] Create visual puzzle prompts
- [ ] Add multi-step question formats

### 8.3 Social features
- [ ] Add player profiles and statistics
- [ ] Implement friend systems
- [ ] Add elo/level