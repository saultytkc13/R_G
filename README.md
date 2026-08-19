# Fallowmire

A short, browser-based roguelike in the dark folk-horror tradition. You are a
lantern-bearer crossing a haunted marsh floor by floor: pick your path through
combat, mystery events, treasure caches and rest sites, and face **The Peat
King** at the far end.

- **Zero build step, zero backend, zero external art.** Open `index.html` and play.
- **Phaser 3** from a CDN is the only dependency (plain JavaScript, no npm).
- Combat and the node map are fully deterministic game code.
- **AI is optional and OFF by default.** When enabled, it only *writes* the
  mystery-event text (and only through a serverless proxy — never a client-side
  key). The game ships with 26 hand-written events, so it is 100% playable
  offline with no AI at all.

---

## How to run it locally (zero build step)

The simplest possible way:

1. Open `index.html` directly in a modern browser (double-click it).

That's it. No server, no install, no build.

If you prefer a local static server (useful because the browser treats
`file://` more strictly in rare cases):

```bash
# Python 3
python3 -m http.server 8000

# or Node (if you have it)
npx serve .
```

Then visit <http://localhost:8000>.

> Note: an internet connection is only needed to load Phaser from the CDN.
> The game code itself, including all event text and art, works offline once
> loaded. (If you want a fully offline copy, download `phaser.min.js`, put it
> next to `index.html`, and change the script tag to `src="phaser.min.js"`.)

---

## How to push it to GitHub and enable GitHub Pages

```bash
git init
git add .
git commit -m "Add Fallowmire"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Then enable Pages:

1. On GitHub, open your repository → **Settings** → **Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Choose branch `main` and folder **`/ (root)`** (the repo root contains
   `index.html`).
4. Click **Save**. In a minute or two your game is live at
   `https://YOUR_USERNAME.github.io/YOUR_REPO/`.

Everything is static files, so Pages serves it with no configuration beyond the
above.

---

## Project layout

```
.
├── index.html              # Entry point; loads Phaser CDN + all scripts in order
├── README.md               # This file
├── .gitignore
├── assets/
│   └── images/             # (Optional) real art drops in here — see prompts below
│       ├── backgrounds/
│       ├── events/
│       ├── enemies/
│       └── player/
└── src/
    ├── config.js           # All constants: sizes, colours, player stats, AI flag + endpoint
    ├── state.js            # Run state + the ONLY code that mutates hp/gold/floor
    ├── main.js             # Phaser game config + init
    ├── ai/
    │   └── aiClient.js     # Isolated AI integration (off by default, validates + falls back)
    ├── data/
    │   ├── events.js       # 26 hand-written fallback mystery events
    │   ├── enemies.js      # 5 enemies + scaled boss
    │   └── mapLayout.js    # Deterministic branching node-map generator
    ├── scenes/
    │   ├── BootScene.js    # Seeds RNG, generates placeholder art, starts the run
    │   ├── MapScene.js     # Node map + inline treasure/rest resolution
    │   ├── MysteryScene.js # Mystery events (AI may contribute content here)
    │   ├── CombatScene.js  # Turn-based combat
    │   └── GameOverScene.js# End-of-run summary + restart
    └── ui/
        ├── textures.js     # Code-generated placeholder art (no files needed)
        └── ui.js           # Panels, buttons, HUD, floating text, synth SFX
```

---

## How the AI integration works (and how to turn it on safely)

**By default AI is OFF.** The game uses only the 26 hand-written events in
`src/data/events.js` and never makes a network request.

To understand the design, open `src/ai/aiClient.js` — it is the **only** file
that would ever call an AI API. It follows four rules:

1. **Off by default** (`RG.Config.AI.enabled = false` in `src/config.js`).
2. When on, it builds a prompt that instructs the model to return **only** a
   JSON object in the *exact* shape of a fallback event
   (`{ title, text, choices: [{ label, effects: {hp,gold,maxHp}, result }] }`).
3. Every response is **strictly validated**: correct shape, 2–3 choices,
   effect numbers integers within `-10..+10`. Any failure (bad JSON, wrong
   shape, network error, timeout) **silently falls back** to a random
   hand-written event. The player never sees a broken state.
4. **AI never controls raw game state.** It can only propose content; the game
   code applies validated effects via `RG.State.applyEffects()`, which clamps
   everything into safe ranges. (This holds even if you later add AI-driven NPC
   dialogue — constrain any "NPC brain" output to a small set of valid
   actions/effects that game code executes, never free-form state changes.)

### Why you must NOT put a key in the browser

Everything under `src/` ships as static files. A real API key written there
would be public on GitHub Pages and could be stolen instantly. So the AI client
points at a **placeholder endpoint** and expects a **serverless proxy** to hold
the key:

```
browser  --POST-->  your proxy  --POST (Authorization: Bearer KEY)-->  AI provider
browser  <--JSON--  your proxy  <--JSON------------------------------  AI provider
```

### The request/response contract (what your proxy must implement)

`POST` JSON body sent to `RG.Config.AI.endpoint`:

```json
{
  "system": "<rules + exact JSON contract>",
  "user":   "<player context: HP, floor, recent titles, a hint>"
}
```

Your proxy should call the AI provider with those strings and return HTTP 200
with:

```json
{ "completion": "{\"title\":\"...\",\"text\":\"...\",\"choices\":[...]}" }
```

`completion` is the model's raw output **as a string**. (The client also
tolerates `text`, `content`, `message`, or an OpenAI-style `choices[]` array,
so most proxy shapes work.)

### Turning it on

1. Deploy a proxy (examples below) and note its URL.
2. In `src/config.js` set:
   ```js
   AI: {
     enabled: true,
     endpoint: 'https://YOUR-PROXY.example.com/api/event',
     timeoutMs: 6000,
   }
   ```
3. Reload. If anything goes wrong, the game silently falls back to the
   hand-written events — you'll only see a `console.warn` from `aiClient.js`.

---

## Deploying a serverless proxy (examples)

**Cloudflare Worker** (holds the key server-side):

```js
// workers/event.js  (paste into a Worker, set AI_PROVIDER_KEY as a secret)
export default {
  async fetch(request) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const body = await request.json();
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + OPENAI_API_KEY, // secret, never in the client
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: body.system },
          { role: 'user', content: body.user },
        ],
        temperature: 1.0,
      }),
    });
    const data = await upstream.json();
    const completion = data.choices[0].message.content;
    return new Response(JSON.stringify({ completion }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  },
}
```

The exact same pattern works on Vercel (`/api/event.ts`) or Netlify Functions
(`netlify/functions/event.js`) — read the POST body, call the provider with
your server-side secret, return `{ completion }`. Never log or return the key.

---

## Gameplay summary

- **5–7 floors**, each with 2–4 nodes: **combat** (red swords), **mystery**
  (violet question mark), **treasure** (gold), **rest** (green moon). The final
  floor is a single **boss** node.
- **Combat** is turn-based and deterministic: **Attack** deals your attack plus
  small variance and the enemy retaliates; **Defend** halves the next hit.
  Attack three times in a row to charge a **heavy blow**. Victory pays gold
  (plus a chance of max-HP), recovers a little HP, and the last hit is lethal
  or you win.
- **Mystery events** present a scene and 2–3 choices with small numeric effects
  (HP / gold / max HP, always within `-10..+10`).
- **Determinism**: set `RG.Config.SEED` to an integer in `src/config.js` to
  replay the exact same map/run (great for testing). Leave it `null` for a new
  run each time.

---

## Assumptions made

- The 3 enemy-slots-per-combat detail was simplified to **one enemy per combat
  node** (a small roster of 5 + a scaled boss). This keeps combat crisp and
  fully deterministic while still using the whole roster.
- A "treasure node" awards gold + a small HP top-up; a "rest node" heals 50% of
  missing HP. Both resolve instantly on the map with a banner (they didn't
  warrant their own scenes).
- The AI endpoint contract is provider-agnostic: the client sends
  `{ system, user }` and expects `{ completion }` back, so any proxy/backend
  (OpenAI-compatible, Anthropic, etc.) can be adapted without touching game
  code.

---

# Art / image-generation prompts

Every visual asset the game could use, with a shared style suffix so the images
read as one cohesive world. Drop the finished files at the exact paths below;
add the matching `this.load.image(...)` lines in `src/scenes/BootScene.js`
(the exact lines are already written in that file's header comment). The game
code references these keys already, so nothing else changes.

**Shared style suffix** (append to every prompt):

```
dark folk-horror storybook illustration, muted ink-and-watercolour palette of
deep indigo, moss green, bone white and candle-gold, soft rim light from a
single lantern, heavy fog, painterly, high detail, no text, no watermark
```

| Asset | Key (texture) | File path | Prompt |
|-------|---------------|-----------|--------|
| Player character | `player` | `assets/images/player/warden.png` | A lone lantern-bearer in a patched travelling cloak, hood up, holding a candle-lantern on a wooden staff, seen three-quarter view, walking toward the viewer. (style suffix) |
| Enemy — Thorn Stalker | `enemy-thorn` | `assets/images/enemies/thorn_stalker.png` | A thin marsh creature of twisted blackthorn branches and dead leaves, hunched and spindly, long clawed twig fingers, faint amber eyes. (style suffix) |
| Enemy — Willow Wight | `enemy-willow` | `assets/images/enemies/willow_wight.png` | A mournful pale spirit draped in weeping-willow fronds, drifting above the water, hollow dark eyes, trailing green mist. (style suffix) |
| Enemy — Moth Knight | `enemy-moth` | `assets/images/enemies/moth_knight.png` | A gaunt knight whose moth-winged cloak is patterned with staring eyes, pale chitin armour, a featureless helm, standing in the fog. (style suffix) |
| Enemy — Hedge Knight | `enemy-hedge` | `assets/images/enemies/hedge_knight.png` | A suit of old, rusted armour overgrown with hawthorn hedge and blackberries, small birds nesting in the pauldrons, motionless but watching. (style suffix) |
| Enemy — Dredge Child | `enemy-dredge` | `assets/images/enemies/dredge_child.png` | A small solemn figure in a burlap smock, skin pale as peat, standing ankle-deep in dark water, holding a heavy iron dredging hook. (style suffix) |
| Boss — The Peat King | `enemy-boss` | `assets/images/enemies/the_peat_king.png` | A vast bog-wraith crowned with reeds and gnarled roots, its body woven from peat and rotting cloth, embers for eyes, rising from the marsh. (style suffix) |
| Background — the Moor | `background` | `assets/images/backgrounds/fallowmire_moor.jpg` | The Fallowmire at night: endless black bog under a pale moon, distant dead trees, drifting fog, faint will-o'-the-wisps, a narrow plank path receding into darkness. (style suffix) |
| Background — the Hollow | `background` | `assets/images/backgrounds/fallowmire_hollow.jpg` | A sunken clearing ringed by twisted trees, a ruined stone chapel without a roof, one lit candle on the altar, fog pooling on the ground. (style suffix) |
| Event — The Wishing Well | `event-well` | `assets/images/events/wishing_well.png` | A moss-covered stone well in a foggy glade, its rope hanging into darkness, a few old coins glinting on the rim, faint light rising from below. (style suffix) |
| Event — The Empty Cradle | `event-cradle` | `assets/images/events/empty_cradle.png` | A pale woven-reed cradle rocking by itself beneath a leaning willow, mist coiling around it, a single crow perched on the tree. (style suffix) |
| Event — The Crow Court | `event-crow` | `assets/images/events/crow_court.png` | A ring of solemn crows perched on bare branches like a jury, a single bright brass button lying in the moonlight at the centre. (style suffix) |
| Event — The Lantern in the Mire | `event-lantern` | `assets/images/events/lantern_mire.png` | A single iron lantern hanging from a crooked post above a misty marsh, its warm light reflected in the black water, no one holding it. (style suffix) |
| Event — The Hanged Harvester | `event-harvester` | `assets/images/events/hanged_harvester.png` | A straw man in a patched coat hanging from an old wooden gallows at the edge of a field, crows resting on its shoulders, an empty moonlit meadow beyond. (style suffix) |

**Note on the two backgrounds:** the game currently uses a single generated
`background` texture. If you add both, swap the key in the scenes (or load the
second under the same key per-scene) to vary the mood.
