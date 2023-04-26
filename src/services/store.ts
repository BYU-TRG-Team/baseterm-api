import { EventEmitter } from "events";
import { UUID } from "@typings";
import { FileServiceSession } from "@typings/sessions";

export class GlobalStore {
  private store: { 
    [key: UUID] : FileServiceSession | undefined
  };
  private eventEmitter: EventEmitter;

  constructor(
    eventEmitter: EventEmitter
  ) {
    this.store = {};
    this.eventEmitter = eventEmitter;
  }

  retrieve(sessionId: UUID) {
    return this.store[sessionId];
  }

  set(sessionId: UUID, value: FileServiceSession) {
    this.store[sessionId] = value;
    this.eventEmitter.emit(sessionId);
  }

  delete(sessionId: UUID) {
    delete this.store[sessionId];
  }
}

export default GlobalStore;