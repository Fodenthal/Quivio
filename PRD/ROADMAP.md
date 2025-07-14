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

- [x] **Fix round continuation logic** - Rounds should continue until timer expires OR all players have answered
- [x] Remove 2-second delay after correct answer (causes perceived lag)
- [x] Implement "all players answered" detection for early round completion

### 3D.2 JKLM-Style Player List Component ✅ COMPLETE  
**Real-time guess display and correct answer highlighting like JKLM**

**Step 1: Basic Foundation ✅ COMPLETE**
- [x] Create player list component showing all players with avatars and scores
- [x] Order players by score (high to low) with tie-breaking logic
- [x] Add player box highlighting when they guess correctly (purple glossy effect)
- [x] Integrate into GameView with two-column layout (widened to 384px)
- [x] Remove "You" tags across entire repository for cleaner UI
- [x] Add comprehensive unit tests for PlayerList component

**Step 2: Server-side Guess Tracking 🔥 NEXT**
- [x] Add server-side state to track each player's most recent incorrect guess
- [x] Modify TriviaRoom guess validation to distinguish correct vs incorrect guesses
- [x] Store and manage per-player guess state in room schema
- [x] Add guess state cleanup between rounds

**Step 3: Real-time Guess Broadcasting**
- [x] Implement guess broadcasting to all clients when guesses are incorrect
- [x] Add new message type for guess updates
- [x] Optimize network efficiency for frequent guess updates
- [x] Add guess validation and sanitization before broadcasting

**Step 4: Live Guess Display on Client ✅ COMPLETE**
- [x] Show real-time incorrect guesses under each player name
- [x] Display only the most recent incorrect guess (replacing previous guesses)
- [x] Add smooth transitions for guess text updates
- [x] Handle guess clearing/reset between rounds

**Step 5: Persistence & Edge Cases ✅ COMPLETE**
- [x] Optimize rendering performance for frequent updates
- [x] Persist incorrect guesses until round ends (no auto-clearing)
- [x] Handle player disconnection/reconnection with guess state
- [x] Add error handling for malformed or invalid guesses
- [x] Ensure guess state consistency across all clients


### 3D.3 Enhanced Game Flow & Transitions ⚠️ PARTIAL (MVP Sufficient)
**Smooth, responsive state transitions**

- [x] Implement basic round-to-round transitions (3s delay + loading message)
- [ ] Create proper loading states between game phases (POLISH - can defer)
- [ ] Implement optimistic UI updates for reduced perceived latency (POLISH - can defer)
- [ ] Add smooth animations for all state changes (POLISH - can defer)
- [x] Optimize state update batching to reduce network roundtrips (server-side implemented)
- [x] Add server-side performance monitoring for round transitions

### 3D.5 Winner Screen & Game Completion 🎉 HIGH PRIORITY
**Proper celebration and game-end experience inspired by JKLM design**

**Step 1: JKLM-Style Winner Screen UI ✅ COMPLETE**
- [x] Create `WinnerScreen` component with sleek gradient background (matching JKLM aesthetic)
- [x] Display winner's avatar with gold medal overlay (reuse existing avatar generation logic)
- [x] Show winner's name in large white text
- [x] Add "won the game!" message below name (matching JKLM's "won the last round!" format)
- [x] Implement full-screen overlay that covers the entire game area

**Step 2: JKLM-Style Auto-Restart System 🔥 IN PROGRESS**
**Design**: After game ends → 15s countdown → clear player list → players click "Join Game" → auto-start when timer expires

- [x] **Server-Side**: Add restart countdown timer and participating players tracking
- [x] **Server-Side**: Implement "join next game" message handler
- [x] **Server-Side**: Add auto-restart logic when countdown expires
- [x] **Client-Side**: Add 15-second countdown display to WinnerScreen
- [x] **Client-Side**: Add "Join Game" button with state management
- [x] **Client-Side**: Display participating players list in real-time
- [x] **Integration**: Test complete auto-restart flow with multiple players

---

## Phase 3E: Advanced Real-time Features
**Priority: HIGH** | **Goal: Complete JKLM-style interactivity**

### 3E.1 Enhanced Chat & Social Features 🎯 HIGH PRIORITY
**Real-time chat system with modern UI inspired by JKLM/Discord chat design**

**Step 1: Layout Restructuring for Three-Column Design ⚡ IMMEDIATE**
- [ ] **Redesign GameView layout** - Convert from 2-column to 3-column layout (game content | player list | chat)
- [ ] **Optimize PlayerList width** - Compress player list from 384px (w-96) to ~280px (w-72) for space efficiency
- [ ] **Add responsive breakpoints** - Ensure chat collapses/hides on mobile, shows drawer/overlay on tablet
- [ ] **Update GameLobby layout** - Add chat to lobby interface for pre-game social interaction
- [ ] **Maintain layout consistency** - Ensure smooth transitions between lobby and game views

**Step 2: Chat Component Foundation 🔧 CRITICAL**
- [ ] **Create ChatMessage interface** - Define message structure (id, playerId, playerName, content, timestamp, type)
- [ ] **Build ChatWindow component** - Scrollable message container with smooth auto-scroll to bottom
- [ ] **Add ChatInput component** - Text input with send button, enter key support, and character limits
- [ ] **Create ChatMessage component** - Individual message display with player avatars and timestamps
- [ ] **Implement message types** - Support system messages (player join/leave, game events) vs player messages

**Step 3: Real-time Message Integration 📡 CORE**
- [ ] **Extend gameClient messaging** - Add `sendChatMessage(content)` method to GameClient class
- [ ] **Add chat state management** - Include chat messages in GameState and handle real-time updates
- [ ] **Implement message broadcasting** - Leverage existing server-side chat infrastructure from Phase 1.7
- [ ] **Add message persistence** - Store recent chat history (last 50 messages) in room state
- [ ] **Handle message ordering** - Ensure consistent message ordering across all clients

**Step 4: Chat UI/UX Polish 🎨 ENHANCEMENT**
- [ ] **JKLM-style visual design** - Dark theme with subtle borders, modern typography
- [ ] **Player avatar integration** - Show player avatars next to messages (reuse existing avatar system)
- [ ] **Message grouping** - Group consecutive messages from same player with timestamp consolidation
- [ ] **Scroll behavior optimization** - Auto-scroll to bottom for new messages, preserve scroll position when reading history
- [ ] **Message animations** - Smooth fade-in animations for new messages

**Step 5: Advanced Chat Features 🚀 POLISH**
- [ ] **System message integration** - Show game events player joins as chat messages
- [ ] **Message rate limiting UI** - Prevent spam
- [ ] **Chat notifications** - Subtle indicators for new messages when chat is scrolled up

**Step 6: Performance & Edge Cases 🔧 STABILITY**
- [ ] **Message cleanup** - Automatically remove old messages to prevent memory bloat
- [ ] **Disconnection handling** - Graceful handling of message sending failures
- [ ] **Profanity filtering** - Basic client-side filtering for inappropriate content
- [ ] **Accessibility support** - Screen reader support and keyboard navigation
- [ ] **Mobile optimization** - Responsive design with touch-friendly interactions

### 3E.2 Performance Optimizations
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

### 4.2 Advanced answer validation
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
- [ ] Find software for opertional dashboards

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