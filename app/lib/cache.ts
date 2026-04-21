interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache<T> {
  private store = new Map<string, Entry<T>>();

  constructor(private readonly ttlMs: number, private readonly maxSize = 500) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  async wrap(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const value = await loader();
    this.set(key, value);
    return value;
  }
}

declare global {
  var __blogToolCaches: Record<string, TTLCache<unknown>> | undefined;
}

function registry(): Record<string, TTLCache<unknown>> {
  if (!globalThis.__blogToolCaches) {
    globalThis.__blogToolCaches = {};
  }
  return globalThis.__blogToolCaches;
}

export function getCache<T>(name: string, ttlMs: number, maxSize = 500): TTLCache<T> {
  const reg = registry();
  if (!reg[name]) {
    reg[name] = new TTLCache<T>(ttlMs, maxSize);
  }
  return reg[name] as TTLCache<T>;
}
