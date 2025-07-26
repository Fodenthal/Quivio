"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStatus = exports.MSG = void 0;
exports.MSG = {
    CHAT: "chat",
    PLAYER_READY: "player_ready",
    SUBMIT_GUESS: "submit_guess",
    START_GAME: "start_game",
    UPDATE_SETTINGS: "update_settings",
    JOIN_NEXT_GAME: "join_next_game",
    SET_TOPIC: "set_topic",
    SET_TOPICS: "set_topics",
    SET_DIFFICULTY: "set_difficulty",
    UPDATE_PLAYER_NAME: "update_player_name"
};
var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING"] = "waiting";
    GameStatus["IN_PROGRESS"] = "in_progress";
    GameStatus["GAME_ENDED"] = "game_ended";
})(GameStatus || (exports.GameStatus = GameStatus = {}));
