// web/services/cache/lru.ts
/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

interface LRUNode<T> {
  key: string;
  value: T;
  expiresAt: number;
  prev: LRUNode<T> | null;
  next: LRUNode<T> | null;
}

export interface LRUOptions {
  capacity: number;
  ttlMs: number;
  namespace: string;
  maxPrunePerSet?: number;
}

/* ------------------------------------------------------------------ */
/* LRU Cache                                                          */
/* ------------------------------------------------------------------ */

export class LRUCache<T> {
  private readonly capacity: number;
  private readonly ttlMs: number;
  private readonly namespace: string;
  private readonly maxPrunePerSet: number;

  private readonly map = new Map<string, LRUNode<T>>();
  private head: LRUNode<T> | null = null;
  private tail: LRUNode<T> | null = null;

  constructor({
    capacity,
    ttlMs,
    namespace,
    maxPrunePerSet = 2,
  }: LRUOptions) {
    this.capacity = capacity;
    this.ttlMs = ttlMs;
    this.namespace = namespace;
    this.maxPrunePerSet = maxPrunePerSet;
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                         */
  /* ------------------------------------------------------------------ */

  get(key: string): T | null {
    const namespacedKey = this.ns(key);
    const node = this.map.get(namespacedKey);
    if (!node) return null;

    if (this.isExpired(node)) {
      this.remove(node);
      return null;
    }

    this.moveToFront(node);
    return node.value;
  }

  set(key: string, value: T): void {
    const namespacedKey = this.ns(key);

    this.pruneExpiredIncremental();

    const existing = this.map.get(namespacedKey);
    if (existing) {
      existing.value = value;
      existing.expiresAt = Date.now() + this.ttlMs;
      this.moveToFront(existing);
      return;
    }

    const node: LRUNode<T> = {
      key: namespacedKey,
      value,
      expiresAt: Date.now() + this.ttlMs,
      prev: null,
      next: null,
    };

    this.map.set(namespacedKey, node);
    this.addToFront(node);

    if (this.map.size > this.capacity) {
      this.evictLRU();
    }
  }

  invalidate(key: string): void {
    const namespacedKey = this.ns(key);
    const node = this.map.get(namespacedKey);
    if (node) this.remove(node);
  }

  invalidatePrefix(prefix: string): void {
    const namespacedPrefix = this.ns(prefix);
    for (const [key, node] of this.map) {
      if (key.startsWith(namespacedPrefix)) {
        this.remove(node);
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* Internal Helpers                                                   */
  /* ------------------------------------------------------------------ */

  private ns(key: string): string {
    return `${this.namespace}:${key}`;
  }

  private isExpired(node: LRUNode<T>): boolean {
    return node.expiresAt <= Date.now();
  }

  private pruneExpiredIncremental(): void {
    let pruned = 0;
    let cursor = this.tail;

    while (cursor && pruned < this.maxPrunePerSet) {
      const prev = cursor.prev;
      if (this.isExpired(cursor)) {
        this.remove(cursor);
        pruned++;
      }
      cursor = prev;
    }
  }

  private addToFront(node: LRUNode<T>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) this.head.prev = node;
    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private moveToFront(node: LRUNode<T>): void {
    if (node === this.head) return;
    this.remove(node);
    this.addToFront(node);
  }

  private remove(node: LRUNode<T>): void {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;

    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;

    this.map.delete(node.key);
  }

  private evictLRU(): void {
    if (!this.tail) return;
    this.remove(this.tail);
  }
}
