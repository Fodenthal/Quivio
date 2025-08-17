import { GamePinRegistry } from "../../../services/GamePinRegistry";

/**
 * Generates unique game pins with collision handling using the registry.
 */
export class PinGenerator {
  generateUniqueGamePin(): string {
    const registry = GamePinRegistry.getInstance();
    const maxAttempts = 10;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const gamePin = this.generateGamePin();
      if (!registry.isPinInUse(gamePin)) {
        return gamePin;
      }
      console.warn(`⚠️ Game pin collision on attempt ${attempt}: ${gamePin} already in use`);
    }
    const fallbackPin = this.generateGamePin() + Date.now().toString().slice(-1);
    console.warn(`🚨 Using fallback pin after ${maxAttempts} collisions: ${fallbackPin}`);
    return fallbackPin.substring(0, 5);
  }

  private generateGamePin(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let gamePin = '';
    for (let i = 0; i < 5; i++) {
      gamePin += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return gamePin;
  }
}


