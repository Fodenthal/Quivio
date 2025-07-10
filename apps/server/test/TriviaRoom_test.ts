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
    
    // Wait for prompt to load and get the correct answer
    await waitForState(200);
    const promptText = room.state.currentPrompt.text;
    let correctAnswer = "Paris"; // fallback
    
    if (promptText.includes("capital of France")) correctAnswer = "Paris";
    else if (promptText.includes("Emperor of Rome")) correctAnswer = "Augustus";
    else if (promptText.includes("largest desert")) correctAnswer = "Sahara";
    else if (promptText.includes("national sport of Japan")) correctAnswer = "Sumo";
    else if (promptText.includes("Berlin Wall")) correctAnswer = "1989";
    else if (promptText.includes("Simpsons")) correctAnswer = "Springfield";
    else if (promptText.includes("largest country")) correctAnswer = "Russia";
    else if (promptText.includes("chemical formula for water")) correctAnswer = "H2O";
    else if (promptText.includes("capital of Japan")) correctAnswer = "Tokyo";
    else if (promptText.includes("chemical symbol for gold")) correctAnswer = "Au";
    else if (promptText.includes("highest mountain")) correctAnswer = "Mount Everest";
    else if (promptText.includes("longest river")) correctAnswer = "Nile";
    else if (promptText.includes("capital of Australia")) correctAnswer = "Canberra";
    else if (promptText.includes("capital of Brazil")) correctAnswer = "Brasília";
    else if (promptText.includes("World War II")) correctAnswer = "1945";
    else if (promptText.includes("first President")) correctAnswer = "George Washington";
    else if (promptText.includes("Columbus discover")) correctAnswer = "1492";
    else if (promptText.includes("Alexandria")) correctAnswer = "Lighthouse";
    else if (promptText.includes("Titanic sink")) correctAnswer = "1912";
    else if (promptText.includes("main character in the movie 'Titanic'")) correctAnswer = "Jack";
    else if (promptText.includes("Iron Man")) correctAnswer = "Robert Downey Jr";
    else if (promptText.includes("first iPhone")) correctAnswer = "2007";
    else if (promptText.includes("lead singer of Queen")) correctAnswer = "Freddie Mercury";
    else if (promptText.includes("Breaking Bad")) correctAnswer = "Walter White";
    else if (promptText.includes("Harry Potter")) correctAnswer = "Hogwarts";
    else if (promptText.includes("Office' (US version)")) correctAnswer = "Greg Daniels";
    else if (promptText.includes("hardest natural substance")) correctAnswer = "Diamond";
    else if (promptText.includes("largest planet")) correctAnswer = "Jupiter";
    else if (promptText.includes("atomic number of carbon")) correctAnswer = "6";
    else if (promptText.includes("speed of light")) correctAnswer = "186282";
    else if (promptText.includes("force that keeps planets")) correctAnswer = "Gravity";
    else if (promptText.includes("largest organ")) correctAnswer = "Skin";
    else if (promptText.includes("FIFA World Cups")) correctAnswer = "Brazil";
    else if (promptText.includes("basketball court")) correctAnswer = "10";
    else if (promptText.includes("Super Bowl")) correctAnswer = "Vince Lombardi Trophy";
    else if (promptText.includes("first modern Olympic")) correctAnswer = "1896";
    else if (promptText.includes("most popular sport")) correctAnswer = "Soccer";
    else if (promptText.includes("Grand Slam tennis")) correctAnswer = "4";
    else if (promptText.includes("New York Yankees")) correctAnswer = "The Bronx Bombers";
    
    // Submit a guess with the correct answer
    await client1.send("submit_guess", { guess: correctAnswer });
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

  // FIXED TESTS

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
    await waitForState(200);
    await client1.send("start_game", {});
    await waitForState(300);
    
    // Verify game is active
    assert.strictEqual(room.state.gameStarted, true);
    assert.strictEqual(room.state.gamePaused, false);
    
    // Player leaves, should pause game
    await client2.leave();
    await waitForState(200);
    
    assert.strictEqual(room.state.gamePaused, true);
    assert.strictEqual(room.state.gameStarted, true); // Still started, just paused
  });

  it("should resume game when enough players rejoin", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await waitForState(200);
    
    // Start game
    await client1.send("player_ready", { ready: true });
    await client2.send("player_ready", { ready: true });
    await waitForState(200);
    await client1.send("start_game", {});
    await waitForState(300);
    
    // Player leaves, causing pause
    await client2.leave();
    await waitForState(200);
    assert.strictEqual(room.state.gamePaused, true);
    
    // New player joins, should resume game
    const client3 = await colyseus.connectTo(room, { playerName: "Player3" });
    await waitForState(200);
    
    assert.strictEqual(room.state.gamePaused, false);
    assert.strictEqual(room.state.gameStarted, true);
    assert.strictEqual(room.state.players.size, 2);
  });

  it("should handle edge case: player rejoining paused game", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await waitForState(300);
    
    // Verify initial state
    assert.strictEqual(room.state.players.size, 2);
    assert.strictEqual(room.state.hostId, client1.sessionId);
    
    // Start game
    await client1.send("player_ready", { ready: true });
    await waitForState(100);
    await client2.send("player_ready", { ready: true });
    await waitForState(100);
    
    // Verify can start
    assert.ok(room.state.canStart, "Should be able to start with 2+ ready players");
    
    await client1.send("start_game", {});
    await waitForState(800); // Wait longer for game to start
    
    // Verify game started
    assert.ok(room.state.gameStarted, "Game should have started");
    assert.ok(room.state.currentRound > 0, "Should be in an active round");
    
    // Remove one player
    await client2.leave();
    await waitForState(600); // Wait longer for state update
    
    // Verify game paused
    assert.ok(room.state.gamePaused, "Game should be paused when not enough players");
    assert.strictEqual(room.state.players.size, 1, "Should have 1 player left");
  });

  it("should handle multiple guesses in same round", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await waitForState(300);
    
    // Start game
    await client1.send("player_ready", { ready: true });
    await waitForState(100);
    await client2.send("player_ready", { ready: true });
    await waitForState(100);
    await client1.send("start_game", {});
    await waitForState(800); // Wait for game to start
    
    // Verify game is running
    assert.ok(room.state.gameStarted, "Game should be started");
    assert.ok(room.state.currentRound > 0, "Should be in an active round");
    
    // Wait for prompt to load and get the correct answer
    await waitForState(200);
    const promptText = room.state.currentPrompt.text;
    let correctAnswer = "Paris"; // fallback
    
    if (promptText.includes("capital of France")) correctAnswer = "Paris";
    else if (promptText.includes("Emperor of Rome")) correctAnswer = "Augustus";
    else if (promptText.includes("largest desert")) correctAnswer = "Sahara";
    else if (promptText.includes("national sport of Japan")) correctAnswer = "Sumo";
    else if (promptText.includes("Berlin Wall")) correctAnswer = "1989";
    else if (promptText.includes("Simpsons")) correctAnswer = "Springfield";
    else if (promptText.includes("largest country")) correctAnswer = "Russia";
    else if (promptText.includes("chemical formula for water")) correctAnswer = "H2O";
    else if (promptText.includes("capital of Japan")) correctAnswer = "Tokyo";
    else if (promptText.includes("chemical symbol for gold")) correctAnswer = "Au";
    else if (promptText.includes("highest mountain")) correctAnswer = "Mount Everest";
    else if (promptText.includes("longest river")) correctAnswer = "Nile";
    else if (promptText.includes("capital of Australia")) correctAnswer = "Canberra";
    else if (promptText.includes("capital of Brazil")) correctAnswer = "Brasília";
    else if (promptText.includes("World War II")) correctAnswer = "1945";
    else if (promptText.includes("first President")) correctAnswer = "George Washington";
    else if (promptText.includes("Columbus discover")) correctAnswer = "1492";
    else if (promptText.includes("Alexandria")) correctAnswer = "Lighthouse";
    else if (promptText.includes("Titanic sink")) correctAnswer = "1912";
    else if (promptText.includes("main character in the movie 'Titanic'")) correctAnswer = "Jack";
    else if (promptText.includes("Iron Man")) correctAnswer = "Robert Downey Jr";
    else if (promptText.includes("first iPhone")) correctAnswer = "2007";
    else if (promptText.includes("lead singer of Queen")) correctAnswer = "Freddie Mercury";
    else if (promptText.includes("Breaking Bad")) correctAnswer = "Walter White";
    else if (promptText.includes("Harry Potter")) correctAnswer = "Hogwarts";
    else if (promptText.includes("Office' (US version)")) correctAnswer = "Greg Daniels";
    else if (promptText.includes("hardest natural substance")) correctAnswer = "Diamond";
    else if (promptText.includes("largest planet")) correctAnswer = "Jupiter";
    else if (promptText.includes("atomic number of carbon")) correctAnswer = "6";
    else if (promptText.includes("speed of light")) correctAnswer = "186282";
    else if (promptText.includes("force that keeps planets")) correctAnswer = "Gravity";
    else if (promptText.includes("largest organ")) correctAnswer = "Skin";
    else if (promptText.includes("FIFA World Cups")) correctAnswer = "Brazil";
    else if (promptText.includes("basketball court")) correctAnswer = "10";
    else if (promptText.includes("Super Bowl")) correctAnswer = "Vince Lombardi Trophy";
    else if (promptText.includes("first modern Olympic")) correctAnswer = "1896";
    else if (promptText.includes("most popular sport")) correctAnswer = "Soccer";
    else if (promptText.includes("Grand Slam tennis")) correctAnswer = "4";
    else if (promptText.includes("New York Yankees")) correctAnswer = "The Bronx Bombers";
    
    // Submit multiple guesses
    await client1.send("submit_guess", { guess: "Wrong Answer" });
    await waitForState(200);
    await client2.send("submit_guess", { guess: correctAnswer });
    await waitForState(600); // Wait longer for processing
    
    // Should have recorded incorrect guess separately from round guesses
    assert.strictEqual(room.state.roundGuesses.size, 1, "Should have recorded only the correct guess in roundGuesses");
    assert.strictEqual(room.state.playerIncorrectGuesses.size, 1, "Should have recorded the incorrect guess separately");
    
    // Check that the incorrect guess is tracked for player1
    const incorrectGuess = room.state.playerIncorrectGuesses.get(client1.sessionId);
    assert.ok(incorrectGuess, "Player1 should have an incorrect guess recorded");
    assert.strictEqual(incorrectGuess?.guess, "Wrong Answer", "Incorrect guess should match what was submitted");
    
    // Check that the correct guess is tracked for player2
    const correctGuessRecord = room.state.roundGuesses.get(client2.sessionId);
    assert.ok(correctGuessRecord, "Player2 should have a correct guess recorded");
    assert.strictEqual(correctGuessRecord?.isCorrect, true, "Recorded guess should be marked as correct");
    
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
    
    await waitForState(300);
    
    // Start game
    await client1.send("player_ready", { ready: true });
    await waitForState(100);
    await client2.send("player_ready", { ready: true });
    await waitForState(100);
    await client1.send("start_game", {});
    await waitForState(800); // Wait for game to start
    
    // Verify game is running
    assert.ok(room.state.gameStarted, "Game should be started");
    assert.ok(room.state.currentRound > 0, "Should be in an active round");
    
    // Wait for round to timeout (1000ms round + some buffer)
    await waitForState(1200); // Wait just past round time
    
    // Round should have ended and timer should be 0
    assert.ok(room.state.roundEnded, "Round should have ended due to timeout");
    assert.strictEqual(room.state.roundTimeRemaining, 0, "Round time should be 0");
  });

  it("should handle game win condition", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {
      targetScore: 1 // Low target for testing
    });
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await waitForState(300);
    
    // Start game
    await client1.send("player_ready", { ready: true });
    await waitForState(100);
    await client2.send("player_ready", { ready: true });
    await waitForState(100);
    await client1.send("start_game", {});
    await waitForState(800); // Wait for game to start
    
    // Verify game is running
    assert.ok(room.state.gameStarted, "Game should be started");
    assert.ok(room.state.currentRound > 0, "Should be in an active round");
    
    // Wait for prompt to load and get the correct answer
    await waitForState(200);
    const promptText = room.state.currentPrompt.text;
    let correctAnswer = "Paris"; // fallback
    
    if (promptText.includes("capital of France")) correctAnswer = "Paris";
    else if (promptText.includes("Emperor of Rome")) correctAnswer = "Augustus";
    else if (promptText.includes("largest desert")) correctAnswer = "Sahara";
    else if (promptText.includes("national sport of Japan")) correctAnswer = "Sumo";
    else if (promptText.includes("Berlin Wall")) correctAnswer = "1989";
    else if (promptText.includes("Simpsons")) correctAnswer = "Springfield";
    else if (promptText.includes("largest country")) correctAnswer = "Russia";
    else if (promptText.includes("chemical formula for water")) correctAnswer = "H2O";
    else if (promptText.includes("capital of Japan")) correctAnswer = "Tokyo";
    else if (promptText.includes("chemical symbol for gold")) correctAnswer = "Au";
    else if (promptText.includes("highest mountain")) correctAnswer = "Mount Everest";
    else if (promptText.includes("longest river")) correctAnswer = "Nile";
    else if (promptText.includes("capital of Australia")) correctAnswer = "Canberra";
    else if (promptText.includes("capital of Brazil")) correctAnswer = "Brasília";
    else if (promptText.includes("World War II")) correctAnswer = "1945";
    else if (promptText.includes("first President")) correctAnswer = "George Washington";
    else if (promptText.includes("Columbus discover")) correctAnswer = "1492";
    else if (promptText.includes("Alexandria")) correctAnswer = "Lighthouse";
    else if (promptText.includes("Titanic sink")) correctAnswer = "1912";
    else if (promptText.includes("main character in the movie 'Titanic'")) correctAnswer = "Jack";
    else if (promptText.includes("Iron Man")) correctAnswer = "Robert Downey Jr";
    else if (promptText.includes("first iPhone")) correctAnswer = "2007";
    else if (promptText.includes("lead singer of Queen")) correctAnswer = "Freddie Mercury";
    else if (promptText.includes("Breaking Bad")) correctAnswer = "Walter White";
    else if (promptText.includes("Harry Potter")) correctAnswer = "Hogwarts";
    else if (promptText.includes("Office' (US version)")) correctAnswer = "Greg Daniels";
    else if (promptText.includes("hardest natural substance")) correctAnswer = "Diamond";
    else if (promptText.includes("largest planet")) correctAnswer = "Jupiter";
    else if (promptText.includes("atomic number of carbon")) correctAnswer = "6";
    else if (promptText.includes("speed of light")) correctAnswer = "186282";
    else if (promptText.includes("force that keeps planets")) correctAnswer = "Gravity";
    else if (promptText.includes("largest organ")) correctAnswer = "Skin";
    else if (promptText.includes("FIFA World Cups")) correctAnswer = "Brazil";
    else if (promptText.includes("basketball court")) correctAnswer = "10";
    else if (promptText.includes("Super Bowl")) correctAnswer = "Vince Lombardi Trophy";
    else if (promptText.includes("first modern Olympic")) correctAnswer = "1896";
    else if (promptText.includes("most popular sport")) correctAnswer = "Soccer";
    else if (promptText.includes("Grand Slam tennis")) correctAnswer = "4";
    else if (promptText.includes("New York Yankees")) correctAnswer = "The Bronx Bombers";
    
    // Submit correct guess to win
    await client1.send("submit_guess", { guess: correctAnswer });
    await waitForState(1000); // Wait longer for game end processing
    
    // Game should have ended
    assert.ok(room.state.gameEnded, "Game should have ended");
    assert.strictEqual(room.state.winnerId, client1.sessionId, "Player 1 should be winner");
    assert.ok(!room.state.gameStarted, "Game should be stopped after win");
  });

  it("should handle invalid messages gracefully", async () => {
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    
    await waitForState(500); // Wait longer for initial connection
    
    // Verify player joined initially
    assert.strictEqual(room.state.players.size, 1, "Player should have joined initially");
    assert.strictEqual(room.state.hostId, client1.sessionId, "Host should be set initially");
    
    // Send malformed versions of valid message types - these should be ignored gracefully
    try {
      // Test malformed player_ready message
      await client1.send("player_ready", { invalid: "data" });
      await waitForState(100);
      
      // Check still connected after malformed player_ready
      assert.strictEqual(room.state.players.size, 1, "Player should still be connected after malformed player_ready");
      
      // Test malformed submit_guess message  
      await client1.send("submit_guess", { notGuess: "invalid" });
      await waitForState(100);
      
      // Check still connected after malformed submit_guess
      assert.strictEqual(room.state.players.size, 1, "Player should still be connected after malformed submit_guess");
      
      // Test malformed chat message
      await client1.send("chat", { notText: "invalid" });
      await waitForState(100);
      
      // Check still connected after malformed chat
      assert.strictEqual(room.state.players.size, 1, "Player should still be connected after malformed chat");
      
    } catch (error) {
      console.log("Error sending invalid messages:", error);
    }
    
    await waitForState(300); // Wait for message processing
    
    // Room should still be functional
    assert.strictEqual(room.state.players.size, 1, "Player should still be in room");
    assert.strictEqual(room.state.hostId, client1.sessionId, "Host should still be set");
    
    // Send a valid message to ensure client is still responsive
    await client1.send("player_ready", { ready: true });
    await waitForState(200);
    
    const player = room.state.players.get(client1.sessionId);
    assert.ok(player, "Player should still exist");
    if (player) {
      assert.strictEqual(player.ready, true, "Player should be ready after valid message");
    }
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
    assert.strictEqual(message.text, "Hello!", "HTML should be removed");
    assert.notStrictEqual(message.text, "<script>alert('xss')</script>Hello!", "Original message should not match");
  });

  it("should allow multiple rounds with fixed scoring system", async () => {
    // Test that the game continues for multiple rounds instead of ending after round 1
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {
      targetScore: 100 // High enough to require multiple rounds
    });
    const client1 = await colyseus.connectTo(room, { playerName: "Player1" });
    const client2 = await colyseus.connectTo(room, { playerName: "Player2" });
    
    await waitForState(300);
    
    // Start the game
    await client1.send("player_ready", { ready: true });
    await client2.send("player_ready", { ready: true });
    await waitForState(100);
    await client1.send("start_game", {});
    await waitForState(500);
    
    // Verify game started
    assert.ok(room.state.gameStarted, "Game should be started");
    assert.strictEqual(room.state.currentRound, 1, "Should be in round 1");
    
    // Get the correct answer for round 1
    await waitForState(200);
    const promptText = room.state.currentPrompt.text;
    let round1Answer = "Paris"; // fallback
    
    // Map prompt text to correct answer (same as in other tests)
    if (promptText.includes("capital of France")) round1Answer = "Paris";
    else if (promptText.includes("Emperor of Rome")) round1Answer = "Augustus";
    else if (promptText.includes("largest desert")) round1Answer = "Sahara";
    else if (promptText.includes("national sport of Japan")) round1Answer = "Sumo";
    else if (promptText.includes("Berlin Wall")) round1Answer = "1989";
    else if (promptText.includes("Simpsons")) round1Answer = "Springfield";
    else if (promptText.includes("largest country")) round1Answer = "Russia";
    else if (promptText.includes("chemical formula for water")) round1Answer = "H2O";
    else if (promptText.includes("capital of Japan")) round1Answer = "Tokyo";
    else if (promptText.includes("chemical symbol for gold")) round1Answer = "Au";
    else if (promptText.includes("highest mountain")) round1Answer = "Mount Everest";
    else if (promptText.includes("longest river")) round1Answer = "Nile";
    else if (promptText.includes("capital of Australia")) round1Answer = "Canberra";
    else if (promptText.includes("capital of Brazil")) round1Answer = "Brasília";
    else if (promptText.includes("World War II")) round1Answer = "1945";
    else if (promptText.includes("first President")) round1Answer = "George Washington";
    else if (promptText.includes("Columbus discover")) round1Answer = "1492";
    else if (promptText.includes("Alexandria")) round1Answer = "Lighthouse";
    else if (promptText.includes("Titanic sink")) round1Answer = "1912";
    else if (promptText.includes("main character in the movie 'Titanic'")) round1Answer = "Jack";
    else if (promptText.includes("Iron Man")) round1Answer = "Robert Downey Jr";
    else if (promptText.includes("first iPhone")) round1Answer = "2007";
    else if (promptText.includes("lead singer of Queen")) round1Answer = "Freddie Mercury";
    else if (promptText.includes("Breaking Bad")) round1Answer = "Walter White";
    else if (promptText.includes("Harry Potter")) round1Answer = "Hogwarts";
    else if (promptText.includes("Office' (US version)")) round1Answer = "Greg Daniels";
    else if (promptText.includes("hardest natural substance")) round1Answer = "Diamond";
    else if (promptText.includes("largest planet")) round1Answer = "Jupiter";
    else if (promptText.includes("atomic number of carbon")) round1Answer = "6";
    else if (promptText.includes("speed of light")) round1Answer = "186282";
    else if (promptText.includes("force that keeps planets")) round1Answer = "Gravity";
    else if (promptText.includes("largest organ")) round1Answer = "Skin";
    else if (promptText.includes("FIFA World Cups")) round1Answer = "Brazil";
    else if (promptText.includes("basketball court")) round1Answer = "10";
    else if (promptText.includes("Super Bowl")) round1Answer = "Vince Lombardi Trophy";
    else if (promptText.includes("first modern Olympic")) round1Answer = "1896";
    else if (promptText.includes("most popular sport")) round1Answer = "Soccer";
    else if (promptText.includes("Grand Slam tennis")) round1Answer = "4";
    else if (promptText.includes("New York Yankees")) round1Answer = "The Bronx Bombers";
    
    // JKLM-style: Both players submit correct answers so round ends early
    await client1.send("submit_guess", { guess: round1Answer });
    await waitForState(100);
    await client2.send("submit_guess", { guess: round1Answer });
    await waitForState(4000); // Wait for transition delay (3s) + buffer
    
    // Game should NOT have ended - should progress to round 2
    assert.ok(!room.state.gameEnded, "Game should not have ended after round 1");
    assert.ok(room.state.gameStarted, "Game should still be running");
    assert.strictEqual(room.state.currentRound, 2, "Should have progressed to round 2");
    
    // Both players should have reasonable scores (10-20 points each)
    const player1 = room.state.players.get(client1.sessionId);
    const player2 = room.state.players.get(client2.sessionId);
    assert.ok(player1, "Player 1 should exist");
    assert.ok(player2, "Player 2 should exist");
    assert.ok(player1.score >= 10, "Player 1 should have at least 10 points for correct answer");
    assert.ok(player1.score <= 20, "Player 1 should not have excessive points (max 20 with full time bonus)");
    assert.ok(player2.score >= 10, "Player 2 should have at least 10 points for correct answer");
    assert.ok(player2.score <= 20, "Player 2 should not have excessive points (max 20 with full time bonus)");
    assert.ok(player1.score < 100 && player2.score < 100, "Neither player should have reached target score in one round");
    
    // Verify round 2 has a new prompt
    assert.ok(room.state.currentPrompt.text, "Round 2 should have a prompt");
    assert.ok(room.state.roundStartTime > 0, "Round 2 should have started");
    assert.ok(!room.state.roundEnded, "Round 2 should be active");
  });
}); 