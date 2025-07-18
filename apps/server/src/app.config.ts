import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";

/**
 * Import your Room files
 */
import { TriviaRoom } from "./rooms/TriviaRoom";
import { GamePinRegistry } from "./services/GamePinRegistry";

const isDevelopment = process.env.NODE_ENV === "development";

export default config({

    initializeGameServer: (gameServer) => {
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
