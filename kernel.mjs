// plainsight — deniable cover encoding. Hide a short message in plain, mundane text.
//
// FOR SOMEONE WHOSE TRAFFIC IS WATCHED. It turns a short secret into innocuous everyday
// chatter (the "seed data" a monitor captures), reversible only with a key. Without the key
// the carrier is just plausible words; a WRONG key yields a different, equally-plausible
// message — so which reading is "real" cannot be proven. That last property is the point:
// deniability, not unbreakable secrecy.
//
// ⚑⚑ THE HARD WALL — READ THIS. This defends against capture and inspection of the MESSAGE
// TEXT in transit. It does NOTHING against a compromised device: spyware that owns the phone
// reads the screen, the keystrokes and the mic BEFORE any of this runs. No software defeats an
// owned device. For anything life-critical use audited tools (Signal, Tor, Tella) on a device
// you trust — this is a deniability primitive and a lifeline, never a shield. A determined
// statistical analyst can also flag stego; treat "looks mundane" as buying time, not safety.
//
// Pure and total; guards one-per-line. No network, no storage — it computes and returns.

// 16 mundane cover words — a carrier reads as ordinary chatter. Each encodes one 4-bit nibble.
export const COVER = Object.freeze(['the', 'and', 'today', 'weather', 'tea', 'market', 'fine', 'later', 'home', 'work', 'tired', 'soon', 'maybe', 'yes', 'okay', 'thanks']);

// Keyed order of the cover words (a deterministic shuffle from the key). The key permutes which
// word means which nibble, so the SAME carrier decodes differently under a different key — the
// source of deniability. FNV-seeded LCG, stable and total.
export function keyedOrder(key) {
  if (typeof key !== 'string') return { ok: false, why: 'key must be a string' };
  if (key.length === 0) return { ok: false, why: 'key must be non-empty' };
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  let s = h >>> 0;
  const order = COVER.slice();
  for (let i = order.length - 1; i >= 1; i--) {          // Fisher-Yates, keyed
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const t = order[i]; order[i] = order[j]; order[j] = t;
  }
  return { ok: true, order };
}

// secret string -> carrier (mundane words). Each UTF-16 byte becomes two cover words.
export function conceal(secret, key) {
  if (typeof secret !== 'string') return { ok: false, why: 'secret must be a string' };
  if (secret.length === 0) return { ok: false, why: 'secret must be non-empty' };
  const ko = keyedOrder(key);
  if (!ko.ok) return { ok: false, why: ko.why };
  const order = ko.order;
  const bytes = [];
  for (let i = 0; i < secret.length; i++) {
    const code = secret.charCodeAt(i);
    if (code > 255) return { ok: false, why: 'this carrier encodes byte-range (0-255) characters; character ' + i + ' is outside it' };
    bytes.push(code);
  }
  const words = [];
  for (const b of bytes) { words.push(order[(b >> 4) & 15]); words.push(order[b & 15]); }
  return { ok: true, carrier: words.join(' ') };
}

// carrier -> secret, under a key. A wrong key yields a different (plausible-or-garbled) result;
// it never throws. Words not in the cover set are refused (a real carrier is only cover words).
export function reveal(carrier, key) {
  if (typeof carrier !== 'string') return { ok: false, why: 'carrier must be a string' };
  const ko = keyedOrder(key);
  if (!ko.ok) return { ok: false, why: ko.why };
  const idx = new Map(ko.order.map((w, i) => [w, i]));
  const words = carrier.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return { ok: false, why: 'carrier is empty' };
  if (words.length % 2 !== 0) return { ok: false, why: 'a carrier has an even number of words (two per byte)' };
  for (const w of words) { if (!idx.has(w)) return { ok: false, why: 'carrier contains a non-cover word: "' + w + '"' }; }
  let out = '';
  for (let i = 0; i < words.length; i += 2) {
    const hi = idx.get(words[i]);
    const lo = idx.get(words[i + 1]);
    out += String.fromCharCode((hi << 4) | lo);
  }
  return { ok: true, secret: out };
}

// A carrier looks like ordinary chatter iff every token is a mundane cover word. This is the
// deniability check — NOT a safety guarantee (see the hard wall above).
export function looksMundane(carrier) {
  if (typeof carrier !== 'string') return { ok: false, why: 'carrier must be a string' };
  const words = carrier.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return { ok: true, mundane: false, why: 'empty' };
  const all = words.every((w) => COVER.includes(w));
  return { ok: true, mundane: all };
}
