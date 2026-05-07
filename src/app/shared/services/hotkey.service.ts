import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class HotkeyService {
  private readonly shortcuts = new Map<string, { callback: () => void; description: string }>();

  register(key: string, description: string, callback: () => void): () => void {
    this.shortcuts.set(key.toLowerCase(), { callback, description });
    return () => this.shortcuts.delete(key.toLowerCase());
  }

  getShortcuts(): Array<{ key: string; description: string }> {
    return Array.from(this.shortcuts.entries()).map(([key, { description }]) => ({ key, description }));
  }

  openShortcuts(): void {
    this.shortcuts.get("?")?.callback();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }
    const shortcut = this.shortcuts.get(event.key.toLowerCase());
    if (shortcut) {
      event.preventDefault();
      shortcut.callback();
    }
  }
}
