import type { ClientEvents } from 'discord.js';

/** Interfaces a handler for a discord event. */
export interface IDiscordEventHandler<Event extends keyof ClientEvents> {
  /** The event to handle. Must be unique. */
  event: Event;

  /** Determines if the event should be handled once or continuously. */
  once?: boolean;

  /** Bound to be called when the event is fired. */
  handle: (...args: ClientEvents[Event]) => Promise<void> | void;
}

export function isDiscordEventHandler(obj: unknown): obj is IDiscordEventHandler<keyof ClientEvents> {
  return (
    obj !== null && typeof obj === 'object' && 'event' in obj && 'handle' in obj && typeof obj.handle === 'function'
  );
}
