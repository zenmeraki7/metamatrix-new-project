/* ------------------------------------------------------------------ */
/* LRU Cache                                                          */
/* ------------------------------------------------------------------ */

class LRUCache {
  constructor({
    capacity,
    ttlMs,
    namespace,
    maxPrunePerSet = 2,
  }) {
    this.capacity = capacity;
    this.ttlMs = ttlMs;
    this.namespace = namespace;
    this.maxPrunePerSet = maxPrunePerSet;

    this.map = new Map();
    this.head = null;
    this.tail = null;
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                         */
  /* ------------------------------------------------------------------ */

  get(key) {
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

  set(key, value) {
    const namespacedKey = this.ns(key);

    this.pruneExpiredIncremental();

    const existing = this.map.get(namespacedKey);
    if (existing) {
      existing.value = value;
      existing.expiresAt = Date.now() + this.ttlMs;
      this.moveToFront(existing);
      return;
    }

    const node = {
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

  invalidate(key) {
    const namespacedKey = this.ns(key);
    const node = this.map.get(namespacedKey);
    if (node) this.remove(node);
  }

  invalidatePrefix(prefix) {
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

  ns(key) {
    return `${this.namespace}:${key}`;
  }

  isExpired(node) {
    return node.expiresAt <= Date.now();
  }

  pruneExpiredIncremental() {
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

  addToFront(node) {
    node.next = this.head;
    node.prev = null;

    if (this.head) this.head.prev = node;
    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  moveToFront(node) {
    if (node === this.head) return;
    this.remove(node);
    this.addToFront(node);
  }

  remove(node) {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;

    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;

    this.map.delete(node.key);
  }

  evictLRU() {
    if (!this.tail) return;
    this.remove(this.tail);
  }
}

/* ------------------------------------------------------------------ */
/* Shared Instance (example export)                                    */
/* ------------------------------------------------------------------ */

export const productsCache = new LRUCache({
  capacity: 500,
  ttlMs: 30_000,
  namespace: "products",
});

export { LRUCache };
