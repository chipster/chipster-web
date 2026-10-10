import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class HotkeyService {
  private readonly shortcuts = new Map<string, { callback: () => void; description: string }>();
  // bumped on every change so that views can cache what they derive from the shortcuts
  private version = 0;

  register(key: string, description: string, callback: () => void): () => void {
    const lowerKey = key.toLowerCase();
    const entry = { callback, description };
    this.shortcuts.set(lowerKey, entry);
    this.version++;
    return () => {
      // a later registration of the same key may have replaced this entry, leave that one alone
      if (this.shortcuts.get(lowerKey) === entry) {
        this.shortcuts.delete(lowerKey);
        this.version++;
      }
    };
  }

  getVersion(): number {
    return this.version;
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
    // Ignore combinations with a command modifier so single-letter shortcuts
    // don't swallow native browser shortcuts like Cmd/Ctrl+L and Cmd/Ctrl+F.
    if (event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    const shortcut = this.shortcuts.get(event.key.toLowerCase());
    if (shortcut) {
      event.preventDefault();
      shortcut.callback();
    }
  }
}
