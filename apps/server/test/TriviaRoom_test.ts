import assert from "assert";
import { ColyseusTestServer, boot } from "@colyseus/testing";

// import your "app.config.ts" file here.
import appConfig from "../src/app.config";
import { TriviaRoomState } from "../src/rooms/schema/TriviaRoomState";

// Helper function to wait for state changes
const waitForState = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

describe("testing TriviaRoom", () => {
  let colyseus: ColyseusTestServer;

  before(async () => colyseus = await boot(appConfig));
  after(async () => colyseus.shutdown());

  beforeEach(async () => await colyseus.cleanup());

  it("should create a trivia room and allow player to join", async () => {
    // Create a trivia room
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {
      targetScore: 5,
      roundTime: 30000,
      maxPlayers: 4
    });

    // Connect first client
    const client1 = await colyseus.connectTo(room, {
      playerName: "TestPlayer1"
    });

    // Wait for state sync
    await waitForState(200);

    // Verify player was added
    assert.strictEqual(client1.sessionId, room.clients[0].sessionId);
    assert.strictEqual(room.state.players.size, 1);
    
    // Verify player data
    const player = room.state.players.get(client1.sessionId);
    assert.ok(player, "Player should exist in state");
    if (player) {
      assert.strictEqual(player.name, "TestPlayer1");
      assert.strictEqual(player.score, 0);
      assert.strictEqual(player.ready, false);
      assert.strictEqual(player.isHost, true); // First player should be host
    }
  });

  it("should allow multiple players to join", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    // Wait for state sync
    await waitForState(200);
    
    assert.strictEqual(room.state.players.size, 2);
    assert.strictEqual(room.state.hostId, client1.sessionId);
    assert.strictEqual(room.state.canStart, true); // Should be able to start with 2+ players
  });

  it("should handle player ready state", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await waitForState(200);
    
    // Set player ready
    await client1.send("player_ready", { ready: true });
    await waitForState(200);
    
    const player = room.state.players.get(client1.sessionId);
    assert.ok(player, "Player should exist");
    if (player) {
      assert.strictEqual(player.ready, true);
    }
  });

  it("should handle guess submission", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await waitForState(200);
    
    // Set both players ready
    await client1.send("player_ready", { ready: true });
    await waitForState(100);
    await client2.send("player_ready", { ready: true });
    await waitForState(200);
    
    // Start the game
    await client1.send("start_game", {});
    await waitForState(500);
    
    // Submit a guess
    await client1.send("submit_guess", { guess: "Paris" });
    await waitForState(300);
    
    // Should have recorded the guess
    assert.strictEqual(room.state.roundGuesses.size, 1, "Should have recorded one guess");
    
    // Should have awarded points for correct answer
    const player = room.state.players.get(client1.sessionId);
    assert.ok(player, "Player should exist");
    if (player) {
      assert.ok(player.score > 0, "Player should have received points for correct answer");
    }
  });

  it("should handle chat messages", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    
    await waitForState(200);
    
    // Send chat message
    await client1.send("chat", { text: "Hello everyone!" });
    await waitForState(200);
    
    // Should have recorded the chat message
    assert.strictEqual(room.state.chatMessages.size, 1);
    
    const message = Array.from(room.state.chatMessages.values())[0];
    assert.strictEqual(message.text, "Hello everyone!");
    assert.strictEqual(message.playerId, client1.sessionId);
  });

  // NEW TESTS FOR ROBUSTNESS

  it("should handle host transfer when host leaves", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await waitForState(200);
    
    // Verify initial host
    assert.strictEqual(room.state.hostId, client1.sessionId);
    
    // Disconnect host
    await client1.leave();
    await waitForState(200);
    
    // Verify host transfer
    assert.strictEqual(room.state.hostId, client2.sessionId);
    assert.strictEqual(room.state.players.size, 1);
  });

  it("should handle game pause when not enough players", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await waitForState(200);
    
    // Start game
    await client1.send("player_ready", { ready: true });
    await client2.send("player_ready", { ready: true });
    await client1.send("start_game", {});
    await waitForState(500);
    
    // Verify game started
    assert.ok(room.state.gameStarted);
    
    // Remove one player
    await client2.leave();
    await waitForState(200);
    
    // Verify game paused
    assert.ok(room.state.gamePaused);
  });

  it("should handle multiple guesses in same round", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await waitForState(200);
    
    // Start game
    await client1.send("player_ready", { ready: true });
    await client2.send("player_ready", { ready: true });
    await client1.send("start_game", {});
    await waitForState(500);
    
    // Submit multiple guesses
    await client1.send("submit_guess", { guess: "Wrong Answer" });
    await waitForState(100);
    await client2.send("submit_guess", { guess: "Paris" });
    await waitForState(300);
    
    // Should have recorded both guesses
    assert.strictEqual(room.state.roundGuesses.size, 2);
    
    // Only second player should have points
    const player1 = room.state.players.get(client1.sessionId);
    const player2 = room.state.players.get(client2.sessionId);
    assert.strictEqual(player1?.score, 0, "Wrong guess should not award points");
    assert.ok(player2?.score > 0, "Correct guess should award points");
  });

  it("should handle round timeout", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {
      roundTime: 1000 // 1 second round
    });
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await waitForState(200);
    
    // Start game
    await client1.send("player_ready", { ready: true });
    await client2.send("player_ready", { ready: true });
    await client1.send("start_game", {});
    await waitForState(500);
    
    // Wait for round to timeout
    await waitForState(1500);
    
    // Round should have ended
    assert.ok(room.state.roundEnded);
    assert.strictEqual(room.state.roundTimeRemaining, 0);
  });

  it("should handle game win condition", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {
      targetScore: 1 // Low target for testing
    });
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await waitForState(200);
    
    // Start game
    await client1.send("player_ready", { ready: true });
    await client2.send("player_ready", { ready: true });
    await client1.send("start_game", {});
    await waitForState(500);
    
    // Submit correct guess to win
    await client1.send("submit_guess", { guess: "Paris" });
    await waitForState(500);
    
    // Game should have ended
    assert.ok(room.state.gameEnded);
    assert.strictEqual(room.state.winnerId, client1.sessionId);
    assert.ok(!room.state.gameStarted, "Game should be stopped after win");
  });

  it("should handle invalid messages gracefully", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    
    await waitForState(200);
    
    // Send invalid message types
    await client1.send("invalid_message", {});
    await client1.send("player_ready", { invalid: "data" });
    await client1.send("submit_guess", {});
    
    await waitForState(200);
    
    // Room should still be functional
    assert.strictEqual(room.state.players.size, 1);
    assert.ok(room.state.hostId === client1.sessionId);
  });

  it("should handle room settings updates", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    
    await waitForState(200);
    
    // Update settings
    await client1.send("update_settings", { 
      targetScore: 15,
      roundTime: 45000,
      maxPlayers: 6
    });
    await waitForState(200);
    
    // Settings should be updated
    assert.strictEqual(room.state.targetScore, 15);
    assert.strictEqual(room.state.roundTime, 45000);
    assert.strictEqual(room.state.maxPlayers, 6);
  });

  it("should handle chat message sanitization", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    
    await waitForState(200);
    
    // Send message with HTML
    await client1.send("chat", { text: "<script>alert('xss')</script>Hello!" });
    await waitForState(200);
    
    // Message should be sanitized
    const message = Array.from(room.state.chatMessages.values())[0];
    assert.strictEqual(message.text, "Hello!");
    assert.notStrictEqual(message.text, "<script>alert('xss')</script>Hello!");
  });
}); 