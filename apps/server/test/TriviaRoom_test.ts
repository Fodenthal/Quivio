import assert from "assert";
import { ColyseusTestServer, boot } from "@colyseus/testing";

// import your "app.config.ts" file here.
import appConfig from "../src/app.config";
import { TriviaRoomState } from "../src/rooms/schema/TriviaRoomState";

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
    await room.waitForNextPatch();

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
    
    await room.waitForNextPatch();
    
    assert.strictEqual(room.state.players.size, 2);
    assert.strictEqual(room.state.hostId, client1.sessionId);
    assert.strictEqual(room.state.canStart, true); // Should be able to start with 2+ players
  });

  it("should handle player ready state", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await room.waitForNextPatch();
    
    // Set player ready
    await client1.send("player_ready", { ready: true });
    await room.waitForNextPatch();
    
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
    
    // Start the game
    await client1.send("player_ready", { ready: true });
    await client2.send("player_ready", { ready: true });
    await client1.send("start_game", {});
    
    await room.waitForNextPatch();
    
    // Submit a guess
    await client1.send("submit_guess", { guess: "Paris" });
    await room.waitForNextPatch();
    
    // Should have recorded the guess
    assert.strictEqual(room.state.roundGuesses.size, 1);
    
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
    
    await room.waitForNextPatch();
    
    // Send chat message
    await client1.send("chat", { text: "Hello everyone!" });
    await room.waitForNextPatch();
    
    // Should have recorded the chat message
    assert.strictEqual(room.state.chatMessages.size, 1);
    
    const message = Array.from(room.state.chatMessages.values())[0];
    assert.strictEqual(message.text, "Hello everyone!");
    assert.strictEqual(message.playerId, client1.sessionId);
  });
}); 