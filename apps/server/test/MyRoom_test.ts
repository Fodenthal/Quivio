import assert from "assert";
import { ColyseusTestServer, boot } from "@colyseus/testing";

// import your "app.config.ts" file here.
import appConfig from "../src/app.config";
import { TriviaRoomState } from "../src/rooms/schema/TriviaRoomState";

// Import GameStatus
import { GameStatus } from "@shared/index";

// Helper function to wait for state changes
const waitForState = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

describe("testing your Colyseus app", () => {
  let colyseus: ColyseusTestServer;

  before(async () => colyseus = await boot(appConfig));
  after(async () => colyseus.shutdown());

  beforeEach(async () => await colyseus.cleanup());

  it("connecting into a room", async () => {
    // `room` is the server-side Room instance reference.
    const room = await colyseus.createRoom<TriviaRoomState>("trivia_room", {});

    // `client1` is the client-side `Room` instance reference (same as JavaScript SDK)
    const client1 = await colyseus.connectTo(room);

    // make your assertions
    assert.strictEqual(client1.sessionId, room.clients[0].sessionId);

    // wait for state sync
    await waitForState(200);

    // Test with trivia room's actual state structure
    assert.strictEqual(room.state.players.size, 1, "Should have one player");
    assert.strictEqual(room.state.gameStatus, GameStatus.WAITING, "Game should not be started initially");
    assert.strictEqual(room.state.currentRound, 0, "Should be in round 0 initially");
  });
});
