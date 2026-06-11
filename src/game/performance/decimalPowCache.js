import Decimal from 'break_eternity.js';

const CACHE_MARKER = Symbol.for('limitIdle.decimalPowCache');

const normalizeKeyPart = (value) => {
  if (value instanceof Decimal) return value.toString();
  return new Decimal(value).toString();
};

const makeKey = (base, exponent) => `${normalizeKeyPart(base)}^${normalizeKeyPart(exponent)}`;

const createLruCache = (maxEntries) => {
  const cache = new Map();

  return {
    get(key) {
      if (!cache.has(key)) return undefined;
      const value = cache.get(key);
      cache.delete(key);
      cache.set(key, value);
      return value;
    },
    set(key, value) {
      if (cache.has(key)) cache.delete(key);
      cache.set(key, value);
      if (cache.size > maxEntries) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
        return true;
      }
      return false;
    },
    clear() {
      cache.clear();
    },
    get size() {
      return cache.size;
    }
  };
};

export const installDecimalPowCache = ({ maxEntries = 4096, enabled = true } = {}) => {
  if (!enabled) {
    return {
      installed: false,
      reason: 'disabled'
    };
  }

  if (Decimal[CACHE_MARKER]) {
    return Decimal[CACHE_MARKER];
  }

  const originalStaticPow = Decimal.pow.bind(Decimal);
  const originalPrototypePow = Decimal.prototype.pow;
  const cache = createLruCache(maxEntries);
  const stats = {
    installed: true,
    maxEntries,
    hits: 0,
    misses: 0,
    evictions: 0,
    errors: 0,
    get size() {
      return cache.size;
    },
    clear() {
      cache.clear();
      this.hits = 0;
      this.misses = 0;
      this.evictions = 0;
      this.errors = 0;
    }
  };

  const getOrCompute = (base, exponent, compute) => {
    let key;
    try {
      key = makeKey(base, exponent);
      const cached = cache.get(key);
      if (cached !== undefined) {
        stats.hits += 1;
        return cached;
      }
    } catch (_err) {
      stats.errors += 1;
      return compute();
    }

    const result = compute();
    stats.misses += 1;
    if (cache.set(key, result)) stats.evictions += 1;
    return result;
  };

  try {
    Decimal.pow = (base, exponent) => getOrCompute(base, exponent, () => originalStaticPow(base, exponent));
    Decimal.prototype.pow = function cachedPow(exponent) {
      return getOrCompute(this, exponent, () => originalPrototypePow.call(this, exponent));
    };
  } catch (err) {
    return {
      installed: false,
      reason: 'patch-failed',
      error: err
    };
  }

  Decimal[CACHE_MARKER] = stats;

  if (typeof globalThis !== 'undefined') {
    globalThis.limitIdlePerf = globalThis.limitIdlePerf || {};
    globalThis.limitIdlePerf.decimalPowCache = stats;
  }

  return stats;
};

export const getDecimalPowCacheStats = () => Decimal[CACHE_MARKER] || null;
