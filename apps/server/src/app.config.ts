import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import cors from "cors"; // Add this import
import { matchMaker, type IRoomCache } from "@colyseus/core";
import type { Request, Response } from "express";

/**
 * Import your Room files
 */
import { TriviaRoom } from "./rooms/TriviaRoom";
import { GamePinRegistry } from "./services/GamePinRegistry";
import { QuestionDatabase } from "./services/QuestionDatabase";
import { DatabaseFactory } from "./services/DatabaseFactory";
import type { AdminRoomDetails, AdminRoomSnapshot } from "@shared/index";

const isDevelopment = process.env.NODE_ENV === "development";

const ADMIN_SECRET_HEADER = "x-admin-secret";

function normalizeToString(value: unknown): string | undefined {
    if (typeof value === "string") {
        return value;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            if (typeof item === "string") {
                return item;
            }
        }
    }
    return undefined;
}

function readAdminSecret(req: Request): string | undefined {
    const headerSecret = normalizeToString(req.headers[ADMIN_SECRET_HEADER]);
    if (headerSecret) {
        return headerSecret;
    }

    const authHeader = req.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }

    const querySecret = normalizeToString(req.query.secret);
    if (querySecret) {
        return querySecret;
    }

    return undefined;
}

function ensureAdminAuthorized(req: Request, res: Response): boolean {
    const configuredSecret = process.env.ADMIN_DASHBOARD_SECRET;
    if (!configuredSecret) {
        res.status(500).json({
            success: false,
            error: "ADMIN_DASHBOARD_SECRET environment variable is not configured",
        });
        return false;
    }

    const providedSecret = readAdminSecret(req);
    if (!providedSecret || providedSecret !== configuredSecret) {
        res.status(401).json({
            success: false,
            error: "Unauthorized",
        });
        return false;
    }

    return true;
}

async function fetchAdminRoomDetails(roomId: string): Promise<AdminRoomDetails | null> {
    const localRoom = matchMaker.getLocalRoomById(roomId) as TriviaRoom | undefined;

    if (localRoom && typeof localRoom.getAdminState === "function") {
        try {
            return localRoom.getAdminState();
        } catch (error) {
            console.error(`❌ Failed to gather local admin state for room ${roomId}:`, error);
        }
    }

    try {
        return await matchMaker.remoteRoomCall<AdminRoomDetails>(roomId, "getAdminState");
    } catch (error) {
        console.error(`❌ Failed to gather remote admin state for room ${roomId}:`, error);
        return null;
    }
}

async function buildAdminRoomSnapshot(roomCache: IRoomCache): Promise<AdminRoomSnapshot> {
    const details = await fetchAdminRoomDetails(roomCache.roomId);
    return {
        roomId: roomCache.roomId,
        processId: roomCache.processId ?? null,
        locked: roomCache.locked ?? false,
        clients: typeof roomCache.clients === "number" ? roomCache.clients : 0,
        maxClients: typeof roomCache.maxClients === "number" ? roomCache.maxClients : 0,
        metadata: roomCache.metadata ?? null,
        details,
    };
}

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
         * Admin: List all rooms with detailed metadata
         */
        app.get("/api/admin/rooms", async (req, res) => {
            if (!ensureAdminAuthorized(req, res)) {
                return;
            }

            try {
                const snapshots: IRoomCache[] = await matchMaker.query({ name: "trivia_room" });
                const rooms: AdminRoomSnapshot[] = await Promise.all(
                    snapshots.map((room): Promise<AdminRoomSnapshot> => buildAdminRoomSnapshot(room))
                );

                res.json({
                    success: true,
                    totalRooms: rooms.length,
                    serverTime: Date.now(),
                    rooms,
                });
            } catch (error) {
                console.error("❌ Admin rooms listing failed:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to retrieve admin room listing",
                });
            }
        });

        /**
         * Admin: Fetch a single room snapshot
         */
        app.get("/api/admin/rooms/:roomId", async (req, res) => {
            if (!ensureAdminAuthorized(req, res)) {
                return;
            }

            const { roomId } = req.params;

            try {
                let roomCache: IRoomCache | undefined;
                try {
                    roomCache = await matchMaker.getRoomById(roomId);
                } catch {
                    roomCache = undefined;
                }
                if (!roomCache) {
                    return res.status(404).json({
                        success: false,
                        error: "Room not found",
                    });
                }

                const snapshot = await buildAdminRoomSnapshot(roomCache);
                res.json({
                    success: true,
                    room: snapshot,
                });
            } catch (error) {
                console.error(`❌ Admin room lookup failed for ${roomId}:`, error);
                res.status(500).json({
                    success: false,
                    error: "Failed to fetch room",
                });
            }
        });

        /**
         * Admin: Forcefully close a room
         */
        app.delete("/api/admin/rooms/:roomId", async (req, res) => {
            if (!ensureAdminAuthorized(req, res)) {
                return;
            }

            const { roomId } = req.params;
            const reason = normalizeToString(req.query.reason);

            try {
                let roomCache: IRoomCache | undefined;
                try {
                    roomCache = await matchMaker.getRoomById(roomId);
                } catch {
                    roomCache = undefined;
                }
                if (!roomCache) {
                    return res.status(404).json({
                        success: false,
                        error: "Room not found",
                    });
                }

                const localRoom = matchMaker.getLocalRoomById(roomId) as TriviaRoom | undefined;

                if (localRoom && typeof localRoom.adminShutdown === "function") {
                    await localRoom.adminShutdown(reason);
                } else {
                    await matchMaker.remoteRoomCall(roomId, "adminShutdown", [reason]);
                }

                res.json({
                    success: true,
                    roomId,
                    reason: reason ?? null,
                });
            } catch (error) {
                console.error(`❌ Admin shutdown failed for room ${roomId}:`, error);
                const message = error instanceof Error ? error.message : String(error);
                const status = message.includes("not found") ? 404 : 500;
                res.status(status).json({
                    success: false,
                    error: status === 404 ? "Room not found" : "Failed to close room",
                });
            }
        });

        /**
         * Popular Topics API
         * GET /api/topics/popular?limit=50 - Get list of popular topics ranked
         */
        app.get('/api/topics/popular', async (req, res) => {
            try {
                const db = DatabaseFactory.getInstance();
                const limit = Math.max(1, Math.min(200, parseInt((req.query.limit as string) || '50')));
                // @ts-ignore - method is present on both implementations
                const topics = await (db as any).getPopularTopics(limit);

                res.json({
                    success: true,
                    count: topics.length,
                    topics,
                    timestamp: Date.now(),
                });
            } catch (error) {
                console.error('❌ Popular topics API error:', error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
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

            // Search by multiple tags (OR/AND) via RPC
            app.get('/debug/questions/by-tags', async (req, res) => {
                try {
                    const { tags = '', require_all = 'false', include_descendants = 'false', limit = '20' } = req.query as Record<string, string>;
                    const tagList = String(tags)
                        .split(',')
                        .map(t => t.trim())
                        .filter(Boolean);
                    const requireAll = String(require_all).toLowerCase() === 'true';
                    const includeDescendants = String(include_descendants).toLowerCase() === 'true';
                    const limitNum = Math.max(1, parseInt(String(limit)) || 20);

                    // Use Supabase directly for the RPC
                    const supa = require('./services/SupabaseQuestionDatabase');
                    const db = supa.SupabaseQuestionDatabase.getInstance();
                    const results = await db.searchQuestionsByTags(tagList, {
                        requireAll,
                        includeDescendants,
                        limit: limitNum,
                    });

                    res.json({
                        success: true,
                        params: { tags: tagList, requireAll, includeDescendants, limit: limitNum },
                        count: results.length,
                        questions: results,
                    });
                } catch (error) {
                    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
                }
            });

            // Attach tags to a question by id (server-side RPC)
            app.post('/debug/questions/attach-tags', async (req, res) => {
                try {
                    const { questionId, tags } = req.body || {};
                    if (!questionId || !Array.isArray(tags)) {
                        return res.status(400).json({ success: false, error: 'questionId and tags[] are required' });
                    }
                    const supa = require('./services/SupabaseQuestionDatabase');
                    const db = supa.SupabaseQuestionDatabase.getInstance();
                    const result = await db.attachTagsToQuestion(Number(questionId), tags);
                    res.json({ success: true, attached: result || [] });
                } catch (error) {
                    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
                }
            });

            console.log("📊 Question database debug endpoints enabled:");
            console.log("   • GET /debug/questions/stats - Database statistics");
            console.log("   • GET /debug/questions/all?limit=100 - All questions");
            console.log("   • GET /debug/questions/search?q=term&limit=50 - Search questions");
            console.log("   • GET /debug/questions/topic/:topic/difficulty/:difficulty - Questions by topic/difficulty");
            console.log("   • GET /debug/questions/by-tags?tags=one,two&require_all=false&limit=20 - Questions by tags");
            console.log("   • POST /debug/questions/attach-tags { questionId, tags: [] } - Attach tags to question");
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
