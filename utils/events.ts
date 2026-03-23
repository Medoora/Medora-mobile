type EventListener = (...args: any[]) => void;

class SimpleEventEmitter {
  private events: Map<string, EventListener[]> = new Map();

  on(event: string, listener: EventListener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  off(event: string, listener: EventListener) {
    if (!this.events.has(event)) return;
    const listeners = this.events.get(event)!;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  emit(event: string, ...args: any[]) {
    if (!this.events.has(event)) return;
    this.events.get(event)!.forEach(listener => {
      listener(...args);
    });
  }
}

export const fileEvents = new SimpleEventEmitter();