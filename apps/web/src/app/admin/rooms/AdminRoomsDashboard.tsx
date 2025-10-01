"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminRoomSnapshot } from "@shared/index";
import { GameStatus } from "@shared/index";

interface AdminRoomsResponse {
  success: boolean;
  rooms: AdminRoomSnapshot[];
  serverTime?: number;
  totalRooms?: number;
  error?: string;
}

const REFRESH_INTERVAL_MS = 10000;

const statusLabels: Record<GameStatus, string> = {
  [GameStatus.WAITING]: "Waiting",
  [GameStatus.IN_PROGRESS]: "In Progress",
  [GameStatus.GAME_ENDED]: "Finished",
};

const statusColors: Record<GameStatus, string> = {
  [GameStatus.WAITING]: "bg-blue-500/20 text-blue-300",
  [GameStatus.IN_PROGRESS]: "bg-green-500/20 text-green-300",
  [GameStatus.GAME_ENDED]: "bg-slate-500/30 text-slate-300",
};

const difficultyLabels: Record<number, string> = {
  1: "Very Easy",
  2: "Easy",
  3: "Medium",
  4: "Hard",
  5: "Very Hard",
};

const statusPriority: Record<GameStatus, number> = {
  [GameStatus.IN_PROGRESS]: 0,
  [GameStatus.WAITING]: 1,
  [GameStatus.GAME_ENDED]: 2,
};

function formatRelativeTime(timestamp?: number | null): string {
  if (!timestamp) return "Unknown";
  const diffMs = Date.now() - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatDateTime(timestamp?: number | null): string {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleString();
}

export default function AdminRoomsDashboard() {
  const router = useRouter();
  const [rooms, setRooms] = useState<AdminRoomSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [closingRoomId, setClosingRoomId] = useState<string | null>(null);

  const fetchRooms = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await fetch("/api/admin/rooms");
      if (response.status === 401) {
        setRooms([]);
        setLoading(false);
        setRefreshing(false);
        router.replace("/admin/login");
        return;
      }
      const payload = (await response.json().catch(() => ({}))) as AdminRoomsResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || `Request failed with status ${response.status}`);
      }

      setRooms(Array.isArray(payload.rooms) ? payload.rooms : []);
      setLastUpdated(payload.serverTime ?? Date.now());
      setError(null);
    } catch (err) {
      console.error("Failed to fetch admin rooms:", err);
      setError(err instanceof Error ? err.message : "Unknown error while loading rooms");
      setRooms([]);
    } finally {
      if (!options.silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [router]);

  const handleManualRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchRooms({ silent: true });
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchRooms]);

  const totalPlayers = useMemo(
    () => rooms.reduce((sum, room) => sum + (room.details?.players.length ?? 0), 0),
    [rooms]
  );

  const inProgressCount = useMemo(
    () =>
      rooms.reduce((sum, room) => {
        const status = room.details?.state.gameStatus;
        return status === GameStatus.IN_PROGRESS ? sum + 1 : sum;
      }, 0),
    [rooms]
  );

  const waitingCount = useMemo(
    () =>
      rooms.reduce((sum, room) => {
        const status = room.details?.state.gameStatus;
        return status === GameStatus.WAITING ? sum + 1 : sum;
      }, 0),
    [rooms]
  );

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      const aStatus = a.details?.state.gameStatus;
      const bStatus = b.details?.state.gameStatus;
      const aPriority = typeof aStatus !== "undefined" ? statusPriority[aStatus] ?? 99 : 99;
      const bPriority = typeof bStatus !== "undefined" ? statusPriority[bStatus] ?? 99 : 99;
      if (aPriority !== bPriority) return aPriority - bPriority;

      const aCreated = a.details?.createdAt ?? 0;
      const bCreated = b.details?.createdAt ?? 0;
      return bCreated - aCreated;
    });
  }, [rooms]);

  const handleCloseRoom = useCallback(
    async (roomId: string) => {
      const confirmClose = window.confirm(
        "Closing this room will disconnect all players immediately. Continue?"
      );
      if (!confirmClose) return;

      const reasonInput = window.prompt("Optional: add a reason for closing this room", "");
      const reason = reasonInput && reasonInput.trim().length > 0 ? reasonInput.trim() : undefined;

      setClosingRoomId(roomId);
      try {
        const url = reason ? `/api/admin/rooms/${roomId}?reason=${encodeURIComponent(reason)}` : `/api/admin/rooms/${roomId}`;
        const response = await fetch(url, { method: "DELETE" });
        const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: string };
        if (!response.ok || payload.success === false) {
          throw new Error(payload.error || `Failed to close room (status ${response.status})`);
        }
        if (expandedRoomId === roomId) {
          setExpandedRoomId(null);
        }
        await fetchRooms({ silent: true });
      } catch (err) {
        console.error("Failed to close room:", err);
        setError(err instanceof Error ? err.message : "Failed to close room");
      } finally {
        setClosingRoomId(null);
      }
    },
    [expandedRoomId, fetchRooms]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Failed to sign out:", error);
    } finally {
      router.replace("/admin/login");
    }
  }, [router]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Game Rooms Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor active trivia rooms, track engagement, and take administrative actions in real time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={loading || refreshing}
            className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`rounded-md border px-3 py-2 text-sm ${
              autoRefresh
                ? "border-green-500 text-green-300 hover:bg-green-500/10"
                : "border-slate-600 text-slate-300 hover:bg-slate-700/40"
            }`}
          >
            {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">Active Rooms</p>
          <p className="mt-2 text-2xl font-semibold text-white">{rooms.length}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">Connected Players</p>
          <p className="mt-2 text-2xl font-semibold text-white">{totalPlayers}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">Rooms In Progress</p>
          <p className="mt-2 text-2xl font-semibold text-white">{inProgressCount}</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">Rooms Waiting</p>
          <p className="mt-2 text-2xl font-semibold text-white">{waitingCount}</p>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-right text-xs text-slate-500">
          Last updated {formatRelativeTime(lastUpdated)} ({formatDateTime(lastUpdated)})
        </p>
      )}

      {loading ? (
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-16 text-center text-slate-400">
          Loading rooms…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-700/50 bg-rose-900/20 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-16 text-center text-slate-400">
          No active rooms found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900/40">
          <div className="divide-y divide-slate-800">
            {sortedRooms.map((room) => {
              const details = room.details;
              const status = details?.state.gameStatus;
              const statusLabel = status ? statusLabels[status] ?? status : "Unknown";
              const statusColor = status ? statusColors[status] ?? "bg-slate-700 text-slate-200" : "bg-slate-700 text-slate-200";
              const playerCount = details?.players.length ?? 0;
              const connectedClients = details?.connectedClients ?? room.clients ?? 0;
              const createdAt = details?.createdAt ?? null;
              const difficulty = details?.state.currentDifficulty ?? null;

              return (
                <div key={room.roomId} className="p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-white">{details?.roomName ?? "Unnamed Room"}</h2>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>Room ID: {room.roomId}</span>
                        {details?.gamePin && <span>Game Pin: {details.gamePin}</span>}
                        {room.processId && <span>Process: {room.processId}</span>}
                        <span>Created: {formatRelativeTime(createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                      <div className="rounded-md border border-slate-700 px-3 py-1">
                        {playerCount} players · {connectedClients}/{details?.maxClients ?? room.maxClients} slots
                      </div>
                      {difficulty && (
                        <div className="rounded-md border border-slate-700 px-3 py-1">
                          Difficulty: {difficultyLabels[difficulty] ?? difficulty}
                        </div>
                      )}
                      <button
                        type="button"
                        className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-700/60"
                        onClick={() =>
                          setExpandedRoomId((current) => (current === room.roomId ? null : room.roomId))
                        }
                      >
                        {expandedRoomId === room.roomId ? "Hide Details" : "View Details"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCloseRoom(room.roomId)}
                        disabled={closingRoomId === room.roomId}
                        className="rounded-md border border-rose-600 px-3 py-1 text-sm text-rose-200 hover:bg-rose-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {closingRoomId === room.roomId ? "Closing…" : "Close Room"}
                      </button>
                    </div>
                  </div>

                  {expandedRoomId === room.roomId && (
                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
                      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 lg:col-span-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Players</h3>
                        {details?.players.length ? (
                          <ul className="mt-3 space-y-2 text-sm">
                            {details.players.map((player) => (
                              <li
                                key={player.id}
                                className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2"
                              >
                                <div>
                                  <p className="font-medium text-white">{player.name}</p>
                                  <p className="text-xs text-slate-400">
                                    Joined {formatRelativeTime(player.joinedAt)} · Score {player.score}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-300">
                                  {player.isHost && <span className="text-amber-300">Host</span>}
                                  {player.ready && <span className="text-green-300">Ready</span>}
                                  <span className={player.connected ? "text-green-300" : "text-slate-500"}>
                                    {player.connected ? "Online" : "Offline"}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-slate-400">No players connected.</p>
                        )}
                      </div>

                      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Game State</h3>
                        <dl className="mt-3 space-y-2 text-sm text-slate-300">
                          <div className="flex justify-between">
                            <dt>Round</dt>
                            <dd>{details?.state.currentRound ?? "—"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Topic</dt>
                            <dd>{details?.state.currentTopic || "—"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Target Score</dt>
                            <dd>{details?.targetScore ?? "—"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Round Time</dt>
                            <dd>{details?.roundTime ? `${Math.round(details.roundTime / 1000)}s` : "—"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Last Round Start</dt>
                            <dd>{formatRelativeTime(details?.state.roundStartTime)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Restart Countdown</dt>
                            <dd>{details?.state.restartCountdown ?? "—"}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Question Buffer</h3>
                        <dl className="mt-3 space-y-2 text-sm text-slate-300">
                          <div className="flex justify-between">
                            <dt>Pending</dt>
                            <dd>{details?.questionBuffer.pendingQuestions ?? "—"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Capacity</dt>
                            <dd>{details?.questionBuffer.bufferCapacity ?? "—"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Tracked Topics</dt>
                            <dd>{details?.questionBuffer.topicsTracked ?? "—"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Total Questions</dt>
                            <dd>{details?.questionBuffer.totalQuestions ?? "—"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Total Queries</dt>
                            <dd>{details?.questionBuffer.totalQueries ?? "—"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Raw Responses</dt>
                            <dd>{details?.questionBuffer.totalRawResponses ?? "—"}</dd>
                          </div>
                        </dl>
                      </div>

                      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 lg:col-span-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Current Prompt</h3>
                        {details?.currentPrompt ? (
                          <div className="mt-3 space-y-2 text-sm text-slate-300">
                            <p className="text-slate-100">{details.currentPrompt.text || "No prompt loaded"}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                              <span>ID: {details.currentPrompt.id}</span>
                              <span>Topic: {details.currentPrompt.topic || "—"}</span>
                              <span>Acceptable Answers: {details.currentPrompt.acceptableAnswers}</span>
                              <span>Difficulty Level: {details.currentPrompt.difficultyLevel || "—"}</span>
                              <span>Image: {details.currentPrompt.hasImage ? "Yes" : "No"}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-slate-400">No prompt data available.</p>
                        )}
                      </div>

                      <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Recent Guesses</h3>
                        {details?.roundGuesses.length ? (
                          <ul className="mt-3 space-y-2 text-sm">
                            {details.roundGuesses.map((guess) => (
                              <li
                                key={`${guess.playerId}-${guess.timestamp}`}
                                className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2"
                              >
                                <div>
                                  <p className="text-slate-200">{guess.guess || "—"}</p>
                                  <p className="text-xs text-slate-400">
                                    Player: {guess.playerId} · {formatRelativeTime(guess.timestamp)}
                                  </p>
                                </div>
                                <span className={guess.isCorrect ? "text-green-400" : "text-slate-500"}>
                                  {guess.isCorrect ? "Correct" : "Incorrect"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-slate-400">No guesses recorded this round.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
