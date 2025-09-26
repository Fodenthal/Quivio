import { describe, it, expect } from "vitest";
import { convertColyseusState, RawRoomState, MapSchemaLike } from "../../utils/gameStateConverter";
import { PlayerData } from "@shared/index";

describe("gameStateConverter", () => {
  describe("convertColyseusState", () => {
    it("returns null for invalid input", () => {
      expect(convertColyseusState(null)).toBe(null);
      expect(convertColyseusState(undefined)).toBe(null);
      expect(convertColyseusState("string")).toBe(null);
      expect(convertColyseusState(123)).toBe(null);
      // Arrays are objects in JavaScript, so they don't return null
      expect(convertColyseusState([])).not.toBe(null);
    });

    it("converts basic room state with default values", () => {
      const rawState: RawRoomState = {};
      const result = convertColyseusState(rawState);

      expect(result).toEqual({
        targetScore: 10,
        roundTime: 30000,
        maxPlayers: 8,
        isPrivate: false,
        gamePin: "",
        roomName: "Trivia Room",
        gameStatus: "waiting",
        gamePaused: false,
        canStart: false,
        currentRound: 0,
        hostId: "",
        winnerId: "",
        restartCountdown: 0,
        participatingPlayers: new Map(),
        roundStartTime: 0,
        // roundTimeRemaining: removed - clients calculate locally using event-driven timer system
        roundEnded: false,
        correctAnswer: "",
        topics: [],
        currentTopic: "",
        currentTopicIndex: 0,
        currentDifficulty: 3,
        players: new Map(),
        currentPrompt: {
          id: "",
          text: "",
          category: "",
          difficulty: "easy",
          answer: "",
          topic: "",
          difficultyLevel: 5,
          acceptableAnswers: [],
          image: undefined
        },
        roundGuesses: new Map(),
        playerIncorrectGuesses: new Map(),
        chatMessages: new Map(),
      });
    });

    it("converts room state with custom values", () => {
      const rawState: RawRoomState = {
        targetScore: 15,
        roundTime: 45000,
        maxPlayers: 6,
        isPrivate: true,
        gamePin: "ABC12",
        gameStatus: "in_progress",
        gamePaused: false,
        canStart: true,
        currentRound: 3,
        hostId: "host123",
        winnerId: "winner456",
        restartCountdown: 10,
        roundStartTime: 1234567890,
        // roundTimeRemaining: removed - clients calculate locally using event-driven timer system
        roundEnded: true,
        correctAnswer: "Paris",
        currentTopic: "Geography",
        currentDifficulty: 8,
        currentPrompt: {
          id: "prompt123",
          text: "What is the capital of France?",
          category: "Geography",
          difficulty: "hard",
          answer: "Paris",
          topic: "European Capitals",
          difficultyLevel: 8,
          acceptableAnswers: ["Paris", "paris"]
        }
      };

      const result = convertColyseusState(rawState);

      expect(result).toMatchObject({
        targetScore: 15,
        roundTime: 45000,
        maxPlayers: 6,
        isPrivate: true,
        gamePin: "ABC12",
        gameStatus: "in_progress",
        gamePaused: false,
        canStart: true,
        currentRound: 3,
        hostId: "host123",
        winnerId: "winner456",
        restartCountdown: 10,
        roundStartTime: 1234567890,
        // roundTimeRemaining: removed - clients calculate locally using event-driven timer system
        roundEnded: true,
        correctAnswer: "Paris",
        currentTopic: "Geography",
        currentDifficulty: 8,
        currentPrompt: {
          id: "prompt123",
          text: "What is the capital of France?",
          category: "Geography",
          difficulty: "hard",
          answer: "Paris",
          topic: "European Capitals",
          difficultyLevel: 8,
          acceptableAnswers: ["Paris", "paris"],
          image: undefined
        }
      });
    });

    describe("Players MapSchema Conversion", () => {
      it("converts players using MapSchema $items", () => {
        const mockMapSchema: MapSchemaLike = {
          $items: new Map([
            ["player1", {
              id: "player1",
              name: "Alice",
              score: 5,
              ready: true,
              isHost: true,
              joinedAt: 1234567890
            }],
            ["player2", {
              id: "player2",
              name: "Bob",
              score: 3,
              ready: false,
              isHost: false,
              joinedAt: 1234567891
            }]
          ]),
          $indexes: new Map(),
          deletedItems: {}
        };

        const rawState: RawRoomState = {
          players: mockMapSchema
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.players.size).toBe(2);
        expect(result?.players.get("player1")).toEqual({
          id: "player1",
          name: "Alice",
          score: 5,
          ready: true,
          isHost: true,
          joinedAt: 1234567890
        });
        expect(result?.players.get("player2")).toEqual({
          id: "player2",
          name: "Bob",
          score: 3,
          ready: false,
          isHost: false,
          joinedAt: 1234567891
        });
      });

      it("converts players using direct object properties (fallback)", () => {
        const mockPlayersObject = {
          player1: {
            id: "player1",
            name: "Charlie",
            score: 7,
            ready: true,
            isHost: false,
            joinedAt: 1234567892
          },
          player2: {
            id: "player2",
            name: "Diana",
            score: 2,
            ready: false,
            isHost: true,
            joinedAt: 1234567893
          },
          // These should be ignored
          $items: "should be ignored",
          $indexes: "should be ignored",
          deletedItems: "should be ignored"
        } as unknown as Record<string, PlayerData>;

        const rawState: RawRoomState = {
          players: mockPlayersObject
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.players.size).toBe(2);
        expect(result?.players.get("player1")).toEqual({
          id: "player1",
          name: "Charlie",
          score: 7,
          ready: true,
          isHost: false,
          joinedAt: 1234567892
        });
        expect(result?.players.get("player2")).toEqual({
          id: "player2",
          name: "Diana",
          score: 2,
          ready: false,
          isHost: true,
          joinedAt: 1234567893
        });
      });

      it("handles Map instance directly", () => {
        const playersMap = new Map<string, PlayerData>([
          ["player1", {
            id: "player1",
            name: "Eve",
            score: 10,
            ready: true,
            isHost: true,
            joinedAt: 1234567894
          }]
        ]);

        const rawState: RawRoomState = {
          players: playersMap as unknown as MapSchemaLike
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.players.size).toBe(1);
        expect(result?.players.get("player1")).toEqual({
          id: "player1",
          name: "Eve",
          score: 10,
          ready: true,
          isHost: true,
          joinedAt: 1234567894
        });
      });

      it("filters out invalid player entries", () => {
        const mockMapSchema: MapSchemaLike = {
          $items: new Map<string, unknown>([
            ["player1", {
              id: "player1",
              name: "Valid Player",
              score: 5,
              ready: true,
              isHost: true,
              joinedAt: 1234567890
            }],
            ["invalid1", null],
            ["invalid2", undefined],
            ["invalid3", "not an object"]
          ]),
          $indexes: new Map(),
          deletedItems: {}
        };

        const rawState: RawRoomState = {
          players: mockMapSchema
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.players.size).toBe(1);
        expect(result?.players.get("player1")?.name).toBe("Valid Player");
        expect(result?.players.has("invalid1")).toBe(false);
        expect(result?.players.has("invalid2")).toBe(false);
        expect(result?.players.has("invalid3")).toBe(false);
      });

      it("handles empty players gracefully", () => {
        const rawState: RawRoomState = {
          players: {
            $items: new Map(),
            $indexes: new Map(),
            deletedItems: {}
          }
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.players.size).toBe(0);
      });
    });

    describe("Other MapSchema Conversions", () => {
      it("converts roundGuesses MapSchema", () => {
        const mockGuesses: MapSchemaLike = {
          $items: new Map([
            ["player1", "Paris"],
            ["player2", "London"]
          ]),
          $indexes: new Map(),
          deletedItems: {}
        };

        const rawState: RawRoomState = {
          roundGuesses: mockGuesses
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.roundGuesses.size).toBe(2);
        expect(result?.roundGuesses.get("player1")).toBe("Paris");
        expect(result?.roundGuesses.get("player2")).toBe("London");
      });

      it("converts roundGuesses from plain object (fallback)", () => {
        const mockGuesses: Record<string, string> = {
          player1: "Tokyo",
          player2: "Berlin"
        };

        const rawState: RawRoomState = {
          roundGuesses: mockGuesses
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.roundGuesses.size).toBe(2);
        expect(result?.roundGuesses.get("player1")).toBe("Tokyo");
        expect(result?.roundGuesses.get("player2")).toBe("Berlin");
      });

      it("converts playerIncorrectGuesses MapSchema", () => {
        const mockIncorrectGuesses: MapSchemaLike = {
          $items: new Map([
            ["player1", ["Wrong1", "Wrong2"]],
            ["player2", ["Wrong3"]]
          ]),
          $indexes: new Map(),
          deletedItems: {}
        };

        const rawState: RawRoomState = {
          playerIncorrectGuesses: mockIncorrectGuesses
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.playerIncorrectGuesses.size).toBe(2);
        expect(result?.playerIncorrectGuesses.get("player1")).toEqual(["Wrong1", "Wrong2"]);
        expect(result?.playerIncorrectGuesses.get("player2")).toEqual(["Wrong3"]);
      });

      it("converts chatMessages MapSchema", () => {
        const mockMessages: MapSchemaLike = {
          $items: new Map([
            ["msg1", {
              id: "msg1",
              playerId: "player1",
              content: "Hello!",
              timestamp: 1234567890
            }],
            ["msg2", {
              id: "msg2",
              playerId: "player2",
              content: "Hi there!",
              timestamp: 1234567891
            }]
          ]),
          $indexes: new Map(),
          deletedItems: {}
        };

        const rawState: RawRoomState = {
          chatMessages: mockMessages
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.chatMessages.size).toBe(2);
        expect(result?.chatMessages.get("msg1")).toEqual({
          id: "msg1",
          playerId: "player1",
          content: "Hello!",
          timestamp: 1234567890
        });
        expect(result?.chatMessages.get("msg2")).toEqual({
          id: "msg2",
          playerId: "player2",
          content: "Hi there!",
          timestamp: 1234567891
        });
      });

      it("converts participatingPlayers MapSchema", () => {
        const mockParticipating: MapSchemaLike = {
          $items: new Map<string, unknown>([
            ["player1", true],
            ["player2", false],
            ["invalid", "not a boolean"] // Should be filtered out
          ]),
          $indexes: new Map(),
          deletedItems: {}
        };

        const rawState: RawRoomState = {
          participatingPlayers: mockParticipating
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.participatingPlayers.size).toBe(2);
        expect(result?.participatingPlayers.get("player1")).toBe(true);
        expect(result?.participatingPlayers.get("player2")).toBe(false);
        expect(result?.participatingPlayers.has("invalid")).toBe(false);
      });
    });

    describe("Prompt Conversion", () => {
      it("handles missing prompt properties with defaults", () => {
        const rawState: RawRoomState = {
          currentPrompt: {}
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.currentPrompt).toEqual({
          id: "",
          text: "",
          category: "",
          difficulty: "easy",
          answer: "",
          topic: "",
          difficultyLevel: 5,
          acceptableAnswers: [],
          image: undefined
        });
      });

      it("converts complete prompt data", () => {
        const rawState: RawRoomState = {
          currentPrompt: {
            id: "prompt123",
            text: "What year did World War II end?",
            category: "History",
            difficulty: "medium",
            answer: "1945",
            topic: "World War II",
            difficultyLevel: 6,
            acceptableAnswers: ["1945", "nineteen forty-five"]
          }
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.currentPrompt).toEqual({
          id: "prompt123",
          text: "What year did World War II end?",
          category: "History",
          difficulty: "medium",
          answer: "1945",
          topic: "World War II",
          difficultyLevel: 6,
          acceptableAnswers: ["1945", "nineteen forty-five"],
          image: undefined
        });
      });
    });

    describe("Edge Cases", () => {
      it("handles partially undefined MapSchema objects", () => {
        const rawState: RawRoomState = {
          players: {
            // Missing $items property
            $indexes: new Map(),
            deletedItems: {}
          },
          roundGuesses: {
            $items: undefined,
            $indexes: new Map(),
            deletedItems: {}
          }
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.players.size).toBe(0);
        // When $items is undefined, Object.entries() includes all properties of the object
        // so it will have entries for $indexes, deletedItems, etc.
        expect(result?.roundGuesses.size).toBe(3); // $items, $indexes, deletedItems
      });

      it("handles mixed valid and invalid data", () => {
        const rawState: RawRoomState = {
          targetScore: 20,
          gameStatus: "in_progress",
          // Invalid prompt
          currentPrompt: undefined,
          // Valid players
          players: {
            $items: new Map([
              ["player1", {
                id: "player1",
                name: "Test Player",
                score: 5,
                ready: true,
                isHost: true,
                joinedAt: 1234567890
              }]
            ])
          }
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.targetScore).toBe(20);
        expect(result?.gameStatus).toBe("in_progress");
        expect(result?.players.size).toBe(1);
        // Should use default prompt values
        expect(result?.currentPrompt.id).toBe("");
        expect(result?.currentPrompt.difficulty).toBe("easy");
      });

      it("preserves type safety for difficulty values", () => {
        const rawState: RawRoomState = {
          currentPrompt: {
            difficulty: "hard" as const
          }
        };

        const result = convertColyseusState(rawState);
        
        expect(result?.currentPrompt.difficulty).toBe("hard");
        
        // Test with invalid value - the implementation doesn't validate, just casts
        const rawStateInvalid: RawRoomState = {
          currentPrompt: {
            difficulty: "invalid"
          }
        };

        const resultInvalid = convertColyseusState(rawStateInvalid);
        expect(resultInvalid?.currentPrompt.difficulty).toBe("invalid");
      });
    });

    describe("Performance and Memory", () => {
      it("handles large player lists efficiently", () => {
        const largePlayerMap = new Map();
        for (let i = 0; i < 1000; i++) {
          largePlayerMap.set(`player${i}`, {
            id: `player${i}`,
            name: `Player ${i}`,
            score: i,
            ready: i % 2 === 0,
            isHost: i === 0,
            joinedAt: 1234567890 + i
          });
        }

        const rawState: RawRoomState = {
          players: {
            $items: largePlayerMap
          }
        };

        const start = performance.now();
        const result = convertColyseusState(rawState);
        const end = performance.now();
        
        expect(result?.players.size).toBe(1000);
        expect(end - start).toBeLessThan(100); // Should complete in under 100ms
      });

      it("creates new Map instances (doesn't share references)", () => {
        const originalMap = new Map([["player1", { id: "player1", name: "Test" }]]);
        
        const rawState: RawRoomState = {
          players: {
            $items: originalMap
          }
        };

        const result = convertColyseusState(rawState);
        
        // Modifying the original should not affect the result
        originalMap.set("player2", { id: "player2", name: "New" });
        
        expect(result?.players.size).toBe(1);
        expect(result?.players.has("player2")).toBe(false);
      });
    });
  });
}); 
