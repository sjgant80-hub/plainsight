# Plainsight — deniable words, honest limits

**Live: https://sjgant80-hub.github.io/plainsight/**

For someone whose messages are watched. It hides a short message inside ordinary words,
reversible only with a shared key — so a monitor sees mundane chatter, and a **wrong key
reveals a different, equally-plausible message** (deniability: which reading is "real" cannot
be proven). A deniability primitive and a rights lifeline.

## ⚠ The wall (stated first, always)

**No software protects a phone that is already infected.** Device-level spyware (Pegasus and
its kind) reads the screen, keystrokes and microphone *before* any encoding runs. Nothing here
defeats a compromised device. For anything life-critical: use a separate trusted device and
audited tools — **Signal**, **Tor**, the **Access Now Digital Security Helpline**. Plainsight
buys a little cover for a short message's *text*; a determined analyst can still flag hidden
messages. It buys time, never safety. Selling it as a shield would be a lethal lie, so we don't.

## What it is (and isn't)

- **Is:** a deniable code — `conceal(secret, key)` → mundane words; `reveal(carrier, key)` back;
  a wrong key yields a different plausible reading. Pure client-side: no network, no storage,
  nothing leaves the device. Plus the person's rights (UDHR, public-domain) stated plainly.
- **Isn't:** encryption, anonymity, or protection against a watched/owned device.

## Proof

`kernel.mjs` — pure, total. Mutation gate **CLEAN: 20/20, zero survivors, zero exemptions**
(round-trip, mundane-carrier, wrong-key-deniability, and the keyed shuffle pinned exactly).
Kernel-backed page (CI-diffed). Built with sididy (the estate's rights-corpus agent) on the
threat model and the rights layer. Tested locally, playing to completion, before push.

MIT.
