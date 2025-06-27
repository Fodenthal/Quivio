import { Client, Room } from "colyseus.js";
import { TriviaRoomState } from "../src/rooms/schema/TriviaRoomState";

const client = new Client("ws://localhost:2567");

async function createMultipleClients(numClients: number) {
  const clients: Room<TriviaRoomState>[] = [];
  
  console.log(`Creating ${numClients} clients...`);
  
  for (let i = 0; i < numClients; i++) {
    try {
      const room: Room<TriviaRoomState> = await client.joinOrCreate("trivia_room", {
        playerName: `LoadTestPlayer_${i}`
      });
      
      clients.push(room);
      console.log(`Client ${i} connected to room: ${room.roomId}`);
      
      // Set ready after a short delay
      setTimeout(() => {
        room.send("player_ready", { ready: true });
      }, Math.random() * 2000);
      
    } catch (error) {
      console.error(`Failed to connect client ${i}:`, error);
    }
  }
  
  return clients;
}

async function simulateGameplay(clients: Room<TriviaRoomState>[]) {
  console.log("Simulating gameplay...");
  
  // Randomly send guesses and chat messages
  setInterval(() => {
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    if (randomClient) {
      const action = Math.random();
      
      if (action < 0.3) {
        // Send guess
        const guesses = ["Paris", "London", "Berlin", "Madrid", "Rome", "Wrong Answer"];
        const guess = guesses[Math.floor(Math.random() * guesses.length)];
        randomClient.send("submit_guess", { guess });
        console.log(`Client sent guess: ${guess}`);
      } else if (action < 0.6) {
        // Send chat
        const messages = ["Hello!", "Good game!", "Nice one!", "GG!", "Let's go!"];
        const message = messages[Math.floor(Math.random() * messages.length)];
        randomClient.send("chat", { text: message });
        console.log(`Client sent chat: ${message}`);
      }
    }
  }, 1000);
}

async function main() {
  try {
    console.log("Starting stress test...");
    
    // Create multiple clients
    const clients = await createMultipleClients(5);
    
    if (clients.length === 0) {
      console.error("No clients connected, exiting");
      process.exit(1);
    }
    
    // Wait for all clients to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Start game from first client
    if (clients[0]) {
      clients[0].send("start_game", {});
      console.log("Game started!");
    }
    
    // Simulate gameplay
    simulateGameplay(clients);
    
    // Monitor for 30 seconds
    setTimeout(() => {
      console.log("Stress test completed, disconnecting...");
      clients.forEach(client => client.leave());
      process.exit(0);
    }, 30000);
    
  } catch (error) {
    console.error("Stress test error:", error);
    process.exit(1);
  }
}

main(); 