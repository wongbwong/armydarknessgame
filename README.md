# Army of Darkness Defense (Browser Clone)

This project recreates the feel of the classic mobile *Army of Darkness Defense* loop using plain HTML, CSS, and JavaScript.

## What is included

- Mobile-first layout with touch-ready action buttons
- Base-defense gameplay:
  - Defend the Necronomicon
  - Move Ash left and right (touch pad or `A/D` and arrow keys)
  - Side-scrolling battlefield camera that follows Ash
  - Summon `Militia`, `Archer`, and `Knight` units
  - Fight escalating undead waves
- Procedural sprite-sheet animation system:
  - Frame-based animated actors for Ash, allies, and enemies
  - Retro pixel-art style rendered through canvas sprite atlases
- Synthesized sound effects (Web Audio API):
  - Summons, attacks, abilities, shop purchases, and victory/defeat cues
  - Audio starts after first user interaction (browser autoplay policy)
- Hero abilities:
  - `Boomstick Blast` (frontline burst damage)
  - `Fortify Book` (heal + temporary shield)
- Between-wave shop and upgrade tree:
  - Shop breaks open during the run
  - Buy persistent run upgrades (unit damage/HP/range, economy, Ash power, ability buffs, book durability)
  - Upgrade levels and scaling costs
- Win condition: survive until dawn (`3:30`)
- Lose condition: Ash or the Necronomicon is destroyed

## Run it

Open [`index.html`](./index.html) directly in a browser.

If you prefer serving over HTTP:

```bash
python3 -m http.server 8000
```

Then browse to `http://localhost:8000`.

Or run with Node.js:

```bash
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
npm start
```

Then browse to `http://127.0.0.1:3000`.

Shortcut:

```bash
./run-node.sh
```

## Files

- `index.html` - game markup and HUD/controls
- `style.css` - responsive visual design
- `game.js` - full game logic and rendering
- `server.js` - Node static server
- `package.json` - npm scripts
- `run-node.sh` - starts npm server with nvm loaded
