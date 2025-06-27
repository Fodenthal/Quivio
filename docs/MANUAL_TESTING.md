# Manual Testing Guide for PopReplay

## Prerequisites
- Server running on `http://localhost:2567`
- Multiple browser tabs/windows ready

## Test Scenarios

### 1. Basic Room Creation
- [ ] Open `http://localhost:2567` in browser
- [ ] Verify "trivia_room" appears in room list
- [ ] Click "Join" to create a new room
- [ ] Verify room state displays correctly
- [ ] Check that you're assigned as host

### 2. Multiplayer Joining
- [ ] Open second browser tab to same URL
- [ ] Join the same room (should see existing room)
- [ ] Verify both players appear in room state
- [ ] Check that first player remains host

### 3. Player Ready States
- [ ] Set both players to "ready" using playground
- [ ] Verify "canStart" becomes true
- [ ] Try starting game with only one player ready (should fail)
- [ ] Start game with both players ready

### 4. Game Flow
- [ ] Verify round starts with prompt "What is the capital of France?"
- [ ] Submit correct answer "Paris"
- [ ] Verify points are awarded
- [ ] Verify round ends and correct answer is shown
- [ ] Verify next round starts automatically

### 5. Chat System
- [ ] Send chat messages from different players
- [ ] Verify messages appear in chat history
- [ ] Test with special characters and long messages
- [ ] Verify message timestamps

### 6. Host Transfer
- [ ] Have host leave the room
- [ ] Verify second player becomes new host
- [ ] Verify game continues normally

### 7. Disconnection Handling
- [ ] Close browser tab during active game
- [ ] Verify other players see disconnection
- [ ] Verify game pauses if not enough players
- [ ] Rejoin and verify state is maintained

### 8. Edge Cases
- [ ] Submit multiple guesses quickly
- [ ] Submit empty or invalid guesses
- [ ] Try to start game multiple times
- [ ] Send very long chat messages
- [ ] Test with 4+ players (max capacity)

### 9. Performance Testing
- [ ] Open 4 browser tabs and join same room
- [ ] Submit guesses simultaneously
- [ ] Send chat messages rapidly
- [ ] Verify no lag or state inconsistencies

### 10. Error Recovery
- [ ] Refresh browser during game
- [ ] Reconnect and verify state sync
- [ ] Test with slow network (dev tools)
- [ ] Verify graceful error handling

## Expected Behaviors

### ✅ Should Work
- Multiple players can join same room
- Game starts only when 2+ players are ready
- Correct guesses award points
- Chat messages are delivered to all players
- Host transfer works automatically
- Game pauses when not enough players

### ❌ Should Not Work
- Starting game with <2 players
- Non-host starting game
- Submitting guesses before game starts
- Invalid message formats
- XSS in chat messages

## Performance Benchmarks
- Room creation: <1 second
- Player join: <500ms
- Message delivery: <100ms
- State sync: <200ms
- Game start: <1 second

## Report Issues
If any test fails, note:
1. Test scenario
2. Expected vs actual behavior
3. Browser/OS details
4. Console errors
5. Network conditions 