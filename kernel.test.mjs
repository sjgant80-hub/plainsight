import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COVER, keyedOrder, conceal, reveal, looksMundane } from './kernel.mjs';

test('COVER is 16 mundane words', () => {
  assert.equal(COVER.length, 16);
  assert.equal(COVER[0], 'the');
  assert.equal(COVER[15], 'thanks');
});

test('keyedOrder: a keyed permutation of the cover set, pinned exactly', () => {
  const r = keyedOrder('k');
  assert.equal(r.ok, true);
  // exact pin — kills the LCG/FNV constant mutations (a drifted shuffle is a different order)
  assert.deepEqual(r.order, ['tea', 'weather', 'today', 'market', 'tired', 'okay', 'fine', 'work', 'the', 'soon', 'home', 'maybe', 'thanks', 'later', 'yes', 'and']);
  // it IS a permutation (every cover word present exactly once)
  assert.equal(new Set(r.order).size, 16);
  for (const w of COVER) assert.equal(r.order.includes(w), true);
  // more exact pins across keys — the shuffle's final swap (i down to 1) is load-bearing;
  // these kill the loop-bound i >= 1 → i > 1 (skipping the last swap changes these orders)
  assert.deepEqual(keyedOrder('k2').order, ['today', 'and', 'the', 'home', 'soon', 'market', 'fine', 'thanks', 'okay', 'maybe', 'yes', 'weather', 'tired', 'work', 'tea', 'later']);
  assert.deepEqual(keyedOrder('alpha').order, ['weather', 'tired', 'and', 'home', 'today', 'later', 'yes', 'soon', 'maybe', 'tea', 'market', 'fine', 'work', 'thanks', 'the', 'okay']);
  // different keys → different orders (the source of deniability)
  assert.notDeepEqual(keyedOrder('k').order, keyedOrder('k2').order);
  // same key → same order (deterministic)
  assert.deepEqual(keyedOrder('same').order, keyedOrder('same').order);
});

test('keyedOrder: total', () => {
  assert.equal(keyedOrder(42).ok, false);
  assert.equal(keyedOrder('').ok, false);
});

test('conceal → reveal round-trips exactly', () => {
  for (const secret of ['A', 'meet at dawn', 'help', 'lat 41.0 lon 29.0', '12:30 north gate']) {
    const c = conceal(secret, 'my-key');
    assert.equal(c.ok, true);
    assert.equal(reveal(c.carrier, 'my-key').secret, secret);
  }
  // exact pinned carrier for 'A' under 'k' (charcode 65 = nibbles 4,1 → order[4],order[1])
  assert.equal(conceal('A', 'k').carrier, 'tired weather');
});

test('the carrier reads as mundane chatter (deniability)', () => {
  const c = conceal('meet at dawn tomorrow', 'key-alpha');
  assert.equal(looksMundane(c.carrier).mundane, true);       // every token is an ordinary word
  // two words per byte
  assert.equal(c.carrier.split(' ').length, 'meet at dawn tomorrow'.length * 2);
});

test('a WRONG key yields a different, non-throwing reading — nothing can be proven', () => {
  const c = conceal('rendezvous', 'true-key');
  const right = reveal(c.carrier, 'true-key');
  const wrong = reveal(c.carrier, 'decoy-key');
  assert.equal(right.secret, 'rendezvous');
  assert.equal(wrong.ok, true);              // never throws
  assert.notEqual(wrong.secret, 'rendezvous'); // and it's a DIFFERENT reading
});

test('conceal: total; refuses out-of-range chars and empty', () => {
  assert.equal(conceal(42, 'k').ok, false);
  assert.equal(conceal('', 'k').ok, false);
  assert.equal(conceal('ok', '').ok, false);            // empty key
  assert.equal(conceal('sn☃wman', 'k').ok, false); // ☃ is > 255 → refused (honest limit)
  assert.equal(conceal('ÿ', 'k').ok, true);        // 255 is in range (kills > 255 → >= 255)
});

test('reveal: total; refuses non-cover words and odd word counts', () => {
  assert.equal(reveal(42, 'k').ok, false);
  assert.equal(reveal('', 'k').ok, false);
  assert.equal(reveal('the', 'k').ok, false);           // odd word count (one word = half a byte)
  assert.equal(reveal('the banana', 'k').ok, false);    // 'banana' is not a cover word
  assert.equal(reveal('the and', 'k').ok, true);        // two cover words = one byte
  // an all-whitespace carrier trims to empty → refused as empty (kills the filter w.length > 0 → >= 0)
  assert.match(reveal('   ', 'k').why, /empty/);
});

test('looksMundane: cover-only is mundane, anything else is not', () => {
  assert.equal(looksMundane('the and today weather').mundane, true);
  assert.equal(looksMundane('the and MEETING weather').mundane, false);
  assert.equal(looksMundane('attack at dawn').mundane, false);
  assert.equal(looksMundane('').mundane, false);
  assert.equal(looksMundane('   ').why, 'empty');   // all-whitespace trims to empty (kills filter w.length > 0 → >= 0)
  assert.equal(looksMundane(42).ok, false);
});
