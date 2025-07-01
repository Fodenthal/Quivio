import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";

/**
 * Import your Room files
 */
import { TriviaRoom } from "./rooms/TriviaRoom";

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
