import { Client, Room } from "colyseus.js";
import { TriviaRoomState } from "../src/rooms/schema/TriviaRoomState";

const client = new Client("ws://localhost:2567");

async function main() {
  try {
    console.log("Connecting to trivia room...");
    
    const room: Room<TriviaRoomState> = await client.joinOrCreate("trivia_room", {
      playerName: `LoadTestPlayer_${Math.random().toString(36).substr(2, 9)}`
    });

    console.log("Connected to room:", room.roomId);
    console.log("Session ID:", room.sessionId);

    // Alternative way to listen for state changes
    room.onStateChange((state) => {
      console.log("State updated:", state);
    });

    // Listen for messages
    room.onMessage("*", (type: string | number, message: any) => {
      console.log(`Received message ${type}:`, message);
    });

    // Set player ready
    setTimeout(() => {
      room.send("player_ready", { ready: true });
      console.log("Set player ready");
    }, 1000);

    // Submit a test guess after 5 seconds
    setTimeout(() => {
      room.send("submit_guess", { guess: "Paris" });
      console.log("Submitted guess: Paris");
    }, 5000);

    // Send a chat message
    setTimeout(() => {
      room.send("chat", { text: "Hello from load test!" });
      console.log("Sent chat message");
    }, 3000);

    // Keep connection alive for 10 seconds
    setTimeout(() => {
      console.log("Test completed, disconnecting...");
      room.leave();
      process.exit(0);
    }, 10000);

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main(); 