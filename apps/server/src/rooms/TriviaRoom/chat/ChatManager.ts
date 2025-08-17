import { TriviaRoomState } from "../../schema/TriviaRoomState";

/**
 * Handles chat sanitization and insertion into room state.
 */
export class ChatManager {
  constructor(private readonly state: TriviaRoomState) {}

  handleChatMessage(playerId: string, text: string): void {
    const sanitized = this.sanitize(text);
    if (sanitized) {
      this.state.addChatMessage(playerId, sanitized);
    }
  }

  private sanitize(text: string): string {
    return (text ?? "")
      .toString()
      .replace(/<script[^>]*>.*?<\/script>/gi, "")
      .replace(/<[^>]*>/g, "")
      .substring(0, 200)
      .trim();
  }
}


