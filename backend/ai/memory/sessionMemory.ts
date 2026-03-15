import { AgentMessage } from "../types";

interface SessionRecord {
  messages: AgentMessage[];
  updatedAt: number;
}

const MAX_MESSAGES_PER_SESSION = 20;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export class SessionMemory {
  private store = new Map<string, SessionRecord>();

  get(sessionId: string): AgentMessage[] {
    return this.store.get(sessionId)?.messages ?? [];
  }

  append(sessionId: string, message: AgentMessage): void {
    const existing = this.store.get(sessionId);
    const messages = [...(existing?.messages ?? []), message].slice(-MAX_MESSAGES_PER_SESSION);

    this.store.set(sessionId, {
      messages,
      updatedAt: Date.now(),
    });
  }

  clear(sessionId: string): void {
    this.store.delete(sessionId);
  }

  /** Remove sessions that have been idle longer than TTL */
  prune(): number {
    const cutoff = Date.now() - SESSION_TTL_MS;
    let removed = 0;
    for (const [id, record] of this.store) {
      if (record.updatedAt < cutoff) {
        this.store.delete(id);
        removed++;
      }
    }
    return removed;
  }
}

export const sessionMemory = new SessionMemory();

// Auto-prune stale sessions every 5 minutes
setInterval(() => {
  const removed = sessionMemory.prune();
  if (removed > 0) console.log(`[ai/memory] Pruned ${removed} stale session(s)`);
}, 5 * 60 * 1000);
