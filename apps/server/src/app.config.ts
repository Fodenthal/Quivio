import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import cors from "cors"; // Add this import

/**
 * Import your Room files
 */
import { TriviaRoom } from "./rooms/TriviaRoom";
import { GamePinRegistry } from "./services/GamePinRegistry";
import { QuestionDatabase } from "./services/QuestionDatabase";
import { DatabaseFactory } from "./services/DatabaseFactory";

const isDevelopment = process.env.NODE_ENV === "development";

export default config({

    initializeGameServer: (gameServer) => {
        // Reset database factory to ensure correct database is used
        DatabaseFactory.resetInstance();
        
        /**
         * Define your room handlers:
         */
        gameServer.define('trivia_room', TriviaRoom);

        // Development-specific configurations
        if (isDevelopment) {
            console.log("🔥 Development mode enabled - Hot reloading active");
            console.log("🎮 Playground available at: http://localhost:2567");
            console.log("📊 Monitor available at: http://localhost:2567/monitor");
        }
    },

    initializeExpress: (app) => {
        // Add CORS middleware at the very beginning
        app.use(cors());
        
        /**
         * Bind your custom express routes here:
         * Read more: https://expressjs.com/en/starter/basic-routing.html
         */
        app.get("/hello_world", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        /**
         * Game Pin Lookup API
         * GET /api/rooms/lookup/:gamePin - Look up room ID by game pin
         */
        app.get("/api/rooms/lookup/:gamePin", (req, res) => {
            const { gamePin } = req.params;
            
            // Validate game pin format (5 alphanumeric characters)
            if (!gamePin || !/^[A-Z0-9]{5}$/.test(gamePin)) {
                return res.status(400).json({
                    error: "Invalid game pin format. Must be 5 alphanumeric characters.",
                    code: "INVALID_PIN_FORMAT"
                });
            }

            try {
                const registry = GamePinRegistry.getInstance();
                const roomId = registry.lookupRoom(gamePin);

                if (roomId) {
                    console.log(`🔍 API lookup successful: pin ${gamePin} → room ${roomId}`);
                    res.json({
                        roomId: roomId,
                        gamePin: gamePin,
                        success: true
                    });
                } else {
                    console.log(`🔍 API lookup failed: pin ${gamePin} not found`);
                    res.status(404).json({
                        error: "Room not found",
                        gamePin: gamePin,
                        code: "ROOM_NOT_FOUND"
                    });
                }
            } catch (error) {
                console.error(`❌ API lookup error for pin ${gamePin}:`, error);
                res.status(500).json({
                    error: "Internal server error",
                    code: "INTERNAL_ERROR"
                });
            }
        });

        /**
         * Room Registry Stats API (for debugging)
         * GET /api/rooms/stats - Get current registry statistics
         */
        app.get("/api/rooms/stats", (req, res) => {
            try {
                const registry = GamePinRegistry.getInstance();
                const stats = registry.getStats();
                res.json({
                    ...stats,
                    success: true
                });
            } catch (error) {
                console.error("❌ API stats error:", error);
                res.status(500).json({
                    error: "Internal server error",
                    code: "INTERNAL_ERROR"
                });
            }
        });

        /**
         * Active Rooms API
         * GET /api/rooms/active - Get list of available public rooms with metadata
         */
        app.get("/api/rooms/active", (req, res) => {
            try {
                const registry = GamePinRegistry.getInstance();
                const activeRooms = registry.listAvailableRooms();
                
                console.log(`🔍 Active rooms API called: returning ${activeRooms.length} rooms`);
                
                res.json({
                    rooms: activeRooms,
                    totalRooms: activeRooms.length,
                    success: true,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error("❌ Active rooms API error:", error);
                res.status(500).json({
                    error: "Internal server error",
                    code: "INTERNAL_ERROR",
                    success: false
                });
            }
        });

        /**
         * Question Database Debug API (Development only)
         * These endpoints allow you to inspect the cached questions
         */
        if (isDevelopment) {
            // Database stats and topic overview
            app.get('/debug/questions/stats', async (req, res) => {
                try {
                    const db = DatabaseFactory.getInstance();
                    const stats = await db.getStats();
                    const topics = await db.getAvailableTopics();
                    
                    res.json({
                        success: true,
                        stats,
                        topics
                    });
                } catch (error) {
                    res.status(500).json({
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            });

            // Get all questions (limited)
            app.get('/debug/questions/all', async (req, res) => {
                try {
                    const db = DatabaseFactory.getInstance();
                    const limit = parseInt(req.query.limit as string) || 100;
                    const questions = await db.getAllQuestions(limit);
                    
                    res.json({
                        success: true,
                        count: questions.length,
                        questions
                    });
                } catch (error) {
                    res.status(500).json({
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            });

            // Search questions by text
            app.get('/debug/questions/search', async (req, res) => {
                try {
                    const db = DatabaseFactory.getInstance();
                    const searchTerm = req.query.q as string;
                    const limit = parseInt(req.query.limit as string) || 50;
                    
                    if (!searchTerm) {
                        return res.status(400).json({
                            success: false,
                            error: 'Search term (q) is required'
                        });
                    }
                    
                    const questions = await db.searchQuestions(searchTerm, limit);
                    
                    res.json({
                        success: true,
                        searchTerm,
                        count: questions.length,
                        questions
                    });
                } catch (error) {
                    res.status(500).json({
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            });

            // Get questions by topic and difficulty
            app.get('/debug/questions/topic/:topic/difficulty/:difficulty', async (req, res) => {
                try {
                    const db = DatabaseFactory.getInstance();
                    const { topic, difficulty } = req.params;
                    const limit = parseInt(req.query.limit as string) || 20;
                    
                    const questions = await db.getQuestions(topic, parseInt(difficulty), limit);
                    
                    res.json({
                        success: true,
                        topic,
                        difficulty: parseInt(difficulty),
                        count: questions.length,
                        questions
                    });
                } catch (error) {
                    res.status(500).json({
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            });

            console.log("📊 Question database debug endpoints enabled:");
            console.log("   • GET /debug/questions/stats - Database statistics");
            console.log("   • GET /debug/questions/all?limit=100 - All questions");
            console.log("   • GET /debug/questions/search?q=term&limit=50 - Search questions");
            console.log("   • GET /debug/questions/topic/:topic/difficulty/:difficulty - Questions by topic/difficulty");
        }

        /**
         * Use @colyseus/playground
         * (It is not recommended to expose this route in a production environment)
         */
        if (process.env.NODE_ENV !== "production") {
            app.use("/", playground());
        }

        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
         */
        app.use("/monitor", monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
        if (isDevelopment) {
            console.log("🚀 Starting Colyseus server in development mode...");
        }
    }
});
