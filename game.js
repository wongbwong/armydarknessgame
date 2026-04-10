(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const ui = {
    iron: document.getElementById("iron-value"),
    gold: document.getElementById("gold-value"),
    wave: document.getElementById("wave-value"),
    enemies: document.getElementById("enemies-value"),
    waveProgressFill: document.getElementById("wave-progress-fill"),
    hordeFlag1: document.getElementById("horde-flag-1"),
    hordeFlag2: document.getElementById("horde-flag-2"),
    waveVictoryLabel: document.getElementById("wave-victory-label"),
    bookBar: document.getElementById("book-bar"),
    ashBar: document.getElementById("ash-bar"),
    controls: document.getElementById("controls"),
    moveLeft: document.getElementById("move-left"),
    moveRight: document.getElementById("move-right"),
    overlay: document.getElementById("overlay"),
    overlayTitle: document.getElementById("overlay-title"),
    overlaySubtitle: document.getElementById("overlay-subtitle"),
    overlayButton: document.getElementById("overlay-button"),
    intermissionScreen: document.getElementById("intermission-screen"),
    intermissionWave: document.getElementById("intermission-wave"),
    intermissionGold: document.getElementById("intermission-gold"),
    upgradeList: document.getElementById("upgrade-list"),
    intermissionContinue: document.getElementById("intermission-continue"),
    troopSelectScreen: document.getElementById("troop-select-screen"),
    troopSelectWave: document.getElementById("troop-select-wave"),
    troopSelectGrid: document.getElementById("troop-select-grid"),
    troopSelectChosen: document.getElementById("troop-select-chosen"),
    troopSelectCount: document.getElementById("troop-select-count"),
    troopSelectBack: document.getElementById("troop-select-back"),
    troopSelectContinue: document.getElementById("troop-select-continue"),
  };

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const GROUND_Y = 565;

  const WORLD_WIDTH = 6200;
  const BOOK_X = 160;
  const ASH_START_X = 305;
  const ASH_SPEED = 240;
  const CAMERA_LOOK_AHEAD = WIDTH * 0.35;
  const CAMERA_SMOOTHING = 8.5;
  const MAX_WAVES = 15;

  const UNIT_DEFS = {
    militia: {
      name: "Militia",
      cost: 35,
      cooldown: 1.35,
      hp: 120,
      speed: 62,
      damage: 17,
      range: 40,
      attackRate: 0.82,
      color: "#dbc597",
      ranged: false,
    },
    archer: {
      name: "Archer",
      cost: 52,
      cooldown: 1.9,
      hp: 94,
      speed: 55,
      damage: 23,
      range: 240,
      attackRate: 1.02,
      color: "#8fb8d9",
      ranged: true,
    },
    knight: {
      name: "Knight",
      cost: 95,
      cooldown: 4.6,
      hp: 300,
      speed: 46,
      damage: 46,
      range: 45,
      attackRate: 1.2,
      color: "#c6c9d3",
      ranged: false,
    },
  };
  

  const ENEMY_DEFS = {
    skeleton: {
      hp: 96,
      speed: 46,
      damage: 14,
      range: 34,
      attackRate: 1.06,
      rewardIron: 16,
      color: "#cfd3cc",
      scale: 0.96,
    },
    deadite: {
      hp: 165,
      speed: 40,
      damage: 22,
      range: 38,
      attackRate: 1.0,
      rewardIron: 24,
      color: "#89b066",
      scale: 1.06,
    },
    warlord: {
      hp: 390,
      speed: 33,
      damage: 43,
      range: 48,
      attackRate: 1.28,
      rewardIron: 50,
      color: "#875f8e",
      scale: 1.28,
    },
  };

  const ABILITY_DEFS = {
    boomstick: { cost: 45, cooldown: 12.0, damage: 260 },
    fortify: { cost: 35, cooldown: 18.0, heal: 190, shieldDuration: 4.5 },
  };

  const UPGRADE_ORDER = [
    "necronomicon",
    "wall_archers",
    "wall_catapults",
    "smithy",
    "treasury",
  ];

  const UPGRADE_DEFS = {
    necronomicon: {
      iconKey: "necronomicon",
      title: "Necronomicon",
      baseCost: 1000,
      growth: 1.52,
      maxLevel: 12,
      statIcon: "heart",
      stat: (level) => `${250 + level * 120}`,
    },
    wall_archers: {
      iconKey: "wall_archers",
      title: "Wall Archers",
      baseCost: 810,
      growth: 1.55,
      maxLevel: 12,
      statIcon: "blade",
      stat: (level) => `${26 + level * 7}`,
    },
    wall_catapults: {
      iconKey: "wall_catapults",
      title: "Wall Catapults",
      baseCost: 1530,
      growth: 1.57,
      maxLevel: 10,
      statIcon: "blade",
      stat: (level) => `${91 + level * 16}`,
    },
    smithy: {
      iconKey: "smithy",
      title: "Smithy",
      baseCost: 1260,
      growth: 1.5,
      maxLevel: 10,
      statIcon: "blade",
      stat: (level) => `${18 + level * 5}`,
    },
    treasury: {
      iconKey: "treasury",
      title: "Treasury",
      baseCost: 980,
      growth: 1.5,
      maxLevel: 10,
      statIcon: "coin",
      stat: (level) => `${14 + level * 6}`,
    },
  };

  const UPGRADE_ICON_SVG = {
    necronomicon: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#1a1a1a"/>
            <stop offset="1" stop-color="#090a0c"/>
          </linearGradient>
          <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#9b5626"/>
            <stop offset="1" stop-color="#5b2d13"/>
          </linearGradient>
          <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#bdc4ce"/>
            <stop offset="1" stop-color="#808996"/>
          </linearGradient>
        </defs>
        <rect width="96" height="72" fill="url(#bg)"/>
        <path d="M7 60 L28 17 L39 20 L18 66 Z" fill="url(#wood)"/>
        <rect x="25" y="8" width="26" height="27" rx="1.5" fill="#6e5a3a" stroke="#d8d0ad" stroke-width="1"/>
        <path d="M31 11 h12 v22 h-12 z" fill="#9a865b"/>
        <path d="M34 15 h6 M34 19 h6 M34 23 h6 M34 27 h6" stroke="#3b311e" stroke-width="1"/>
        <path d="M48 14 C64 20, 64 48, 46 56" fill="none" stroke="#d5d9de" stroke-width="2.5"/>
        <path d="M59 37 L72 35 L79 44 L73 57 L58 57 L50 49 Z" fill="url(#metal)" stroke="#646d78" stroke-width="1.3"/>
        <path d="M65 40 v13 M59 46 h13" stroke="#20232a" stroke-width="2"/>
      </svg>
    `,
    wall_archers: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72">
        <rect width="96" height="72" fill="#121316"/>
        <path d="M10 18 h76 v16 h-76z" fill="#7f5b40"/>
        <ellipse cx="26" cy="22" rx="12" ry="7" fill="#784f33"/>
        <ellipse cx="44" cy="21" rx="12" ry="7" fill="#7f5637"/>
        <ellipse cx="63" cy="22" rx="11" ry="6.5" fill="#704c33"/>
        <rect x="8" y="34" width="80" height="30" fill="#7b7f84"/>
        <path d="M8 40 h80 M8 47 h80 M8 54 h80" stroke="#555b62" stroke-width="2"/>
        <path d="M20 34 v30 M34 34 v30 M48 34 v30 M62 34 v30 M76 34 v30" stroke="#646a71" stroke-width="2"/>
        <rect x="0" y="30" width="96" height="42" fill="none" stroke="#31353b" stroke-width="3"/>
      </svg>
    `,
    wall_catapults: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72">
        <rect width="96" height="72" fill="#121418"/>
        <ellipse cx="73" cy="16" rx="9" ry="9" fill="#a2a8b0"/>
        <path d="M14 52 h52 l9-10 h8 l-12 18 h-58z" fill="#9f6f3b" stroke="#5f3b1f" stroke-width="2"/>
        <path d="M20 44 l20 -12 l17 4 l-21 15 z" fill="#8f6235"/>
        <path d="M26 34 l14 26 M34 30 l16 25 M44 30 l16 22" stroke="#6a4527" stroke-width="2"/>
        <path d="M23 23 l16 5 l-6 4 l-15 -5 z" fill="#d0d4d9"/>
        <path d="M39 28 l27 -14 l4 7 l-28 15 z" fill="#c6cacf"/>
        <circle cx="24" cy="57" r="7" fill="#c7c9ca" stroke="#6a6f75" stroke-width="2"/>
        <circle cx="58" cy="57" r="7" fill="#c7c9ca" stroke="#6a6f75" stroke-width="2"/>
      </svg>
    `,
    smithy: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72">
        <rect width="96" height="72" fill="#14161a"/>
        <rect x="14" y="38" width="70" height="20" rx="2" fill="#5a5f67"/>
        <rect x="22" y="44" width="54" height="8" fill="#9ea5af"/>
        <path d="M20 30 l18 -12 l6 8 l-18 12z" fill="#cfd3d8"/>
        <path d="M38 22 l34 26 l-4 6 l-35 -25z" fill="#8c5f35"/>
        <circle cx="69" cy="52" r="8" fill="#70747b"/>
      </svg>
    `,
    treasury: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 72">
        <rect width="96" height="72" fill="#15171b"/>
        <rect x="14" y="22" width="68" height="36" rx="4" fill="#5b421f" stroke="#c49f45" stroke-width="2"/>
        <rect x="20" y="28" width="56" height="24" fill="#2c2d30"/>
        <circle cx="35" cy="40" r="9" fill="#e0c451" stroke="#896f22" stroke-width="2"/>
        <text x="35" y="44" text-anchor="middle" font-size="11" fill="#3f3412">◎</text>
        <circle cx="57" cy="39" r="8" fill="#d7b944" stroke="#856a20" stroke-width="2"/>
        <circle cx="68" cy="44" r="7" fill="#cbac3d" stroke="#785f1a" stroke-width="2"/>
      </svg>
    `,
  };

  const TROOP_POOL = [
    { id: "peasant", name: "Peasant", tier: 5, attack: 211, hp: 1337, unitKey: "militia" },
    { id: "swordsman", name: "Swordsman", tier: 10, attack: 127, hp: 2098, unitKey: null },
    { id: "spearman", name: "Spearman", tier: 15, attack: 413, hp: 945, unitKey: null },
    { id: "archer", name: "Archer", tier: 10, attack: 174, hp: 716, unitKey: "archer" },
    { id: "sword-boy", name: "sword-boy", tier: 10, attack: 0, hp: 30, unitKey: null },
    { id: "armored-guard", name: "armored guard", tier: 30, attack: 360, hp: 6673, unitKey: "knight" },
    { id: "wiseman", name: "wiseman", tier: 40, attack: 351, hp: 796, unitKey: null },
    { id: "arthur", name: "arthur", tier: 55, attack: 460, hp: 20854, unitKey: null },
    { id: "horseman", name: "horseman", tier: 45, attack: 1154, hp: 1780, unitKey: null },
    { id: "henry", name: "henry", tier: 65, attack: 977, hp: 4961, unitKey: null },
    { id: "torch-boy", name: "torch-boy", tier: 30, attack: 10, hp: 30, unitKey: null },
  ];

  const TROOP_SELECT_MAX = 5;
  const DEFAULT_SELECTED_TROOPS = ["peasant", "archer", "armored-guard", "swordsman", "spearman"];
  const TROOP_BY_ID = Object.fromEntries(TROOP_POOL.map((troop) => [troop.id, troop]));

  function svgDataUri(svg) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  function getUpgradeIconSrc(id) {
    const key = UPGRADE_DEFS[id]?.iconKey;
    const svg = UPGRADE_ICON_SVG[key] || UPGRADE_ICON_SVG.smithy;
    return svgDataUri(svg);
  }

  function getStatIcon(iconType) {
    if (iconType === "heart") return "❤";
    if (iconType === "coin") return "◎";
    return "⚔";
  }

  const buttons = {
    boomstick: document.getElementById("btn-boomstick"),
    fortify: document.getElementById("btn-fortify"),
  };

  function createUpgradeLevels() {
    const levels = {};
    for (const id of UPGRADE_ORDER) {
      levels[id] = 0;
    }
    return levels;
  }

  const state = {
    mode: "menu",
    elapsed: 0,
    score: 0,

    wave: 1,
    waveTarget: 0,
    waveSpawned: 0,
    waveKilled: 0,
    waveProgressDisplay: 0,
    waveProgressAnimStart: 0,
    waveProgressAnimEnd: 0,
    waveProgressAnimElapsed: 0,
    waveProgressAnimDuration: 0.24,
    waveVictoryTimer: 0,
    nextWaveToStart: 1,
    troopSelectAllowBack: true,
    selectedTroops: [...DEFAULT_SELECTED_TROOPS],
    spawnCooldown: 1.3,

    iron: 120,
    gold: 0,
    resourceTick: 0,

    bookHp: 1100,
    bookMaxHp: 1100,
    bookShield: 0,

    ashHp: 650,
    ashMaxHp: 650,
    ashX: ASH_START_X,
    ashAttackCd: 0,
    ashAttackPulse: 0,

    ashMoveDir: 0,
    cameraX: 0,
    input: {
      left: false,
      right: false,
    },

    wallArcherCd: 0,
    wallCatapultCd: 0,

    cooldowns: {
      militia: 0,
      archer: 0,
      knight: 0,
      boomstick: 0,
      fortify: 0,
    },

    upgrades: createUpgradeLevels(),
    modifiers: {
      unitHpMult: 1,
      unitDamageMult: 1,
      ashDamageMult: 1,
      ashRateMult: 1,
      ashRangeMult: 1,
      boomDamageMult: 1,
      fortifyHealMult: 1,
      fortifyShieldMult: 1,
      ironIncomeMult: 1,
      goldRateMult: 1,
      waveStartIronBonus: 0,
      wallArcherLevel: 0,
      wallCatapultLevel: 0,
    },

    units: [],
    enemies: [],
    particles: [],
  };

  const audio = {
    ctx: null,
    master: null,
    last: {},
  };

  const spriteAtlas = buildSpriteAtlas();

  let overlayAction = null;
  let lastTick = performance.now();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function formatInt(value) {
    return Math.max(0, Math.floor(value)).toString();
  }

  function worldToScreenX(worldX) {
    return worldX - state.cameraX;
  }

  function isNearVisible(worldX, padding = 130) {
    const x = worldToScreenX(worldX);
    return x >= -padding && x <= WIDTH + padding;
  }

  function setMoveState(direction, active) {
    state.input[direction] = active;
  }

  function getUpgradeLevel(id) {
    return state.upgrades[id] || 0;
  }

  function getUpgradeCost(id) {
    const cfg = UPGRADE_DEFS[id];
    const level = getUpgradeLevel(id);
    return Math.floor(cfg.baseCost * Math.pow(cfg.growth, level));
  }

  function recomputeModifiers() {
    const necronomicon = getUpgradeLevel("necronomicon");
    const wallArchers = getUpgradeLevel("wall_archers");
    const wallCatapults = getUpgradeLevel("wall_catapults");
    const smithy = getUpgradeLevel("smithy");
    const treasury = getUpgradeLevel("treasury");

    state.modifiers.unitHpMult = 1 + smithy * 0.05;
    state.modifiers.unitDamageMult = 1 + smithy * 0.1;
    state.modifiers.ashDamageMult = 1 + smithy * 0.12;
    state.modifiers.ashRateMult = 1 - Math.min(0.4, smithy * 0.03);
    state.modifiers.ashRangeMult = 1 + smithy * 0.03;

    state.modifiers.boomDamageMult = 1 + smithy * 0.06;
    state.modifiers.fortifyHealMult = 1 + necronomicon * 0.06;
    state.modifiers.fortifyShieldMult = 1 + necronomicon * 0.05;

    state.modifiers.ironIncomeMult = 1 + treasury * 0.18;
    state.modifiers.goldRateMult = 1 + treasury * 0.22;
    state.modifiers.waveStartIronBonus = treasury * 18;

    state.modifiers.wallArcherLevel = wallArchers;
    state.modifiers.wallCatapultLevel = wallCatapults;

    state.bookMaxHp = 1100 + necronomicon * 170;
    state.bookHp = clamp(state.bookHp, 0, state.bookMaxHp);
  }

  function ensureAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    if (!audio.ctx) {
      try {
        audio.ctx = new AC();
        audio.master = audio.ctx.createGain();
        audio.master.gain.value = 0.12;
        audio.master.connect(audio.ctx.destination);
      } catch {
        audio.ctx = null;
        audio.master = null;
      }
    }

    if (audio.ctx && audio.ctx.state === "suspended") {
      audio.ctx.resume().catch(() => {});
    }
  }

  function canPlaySfx(name, minGap = 0.04) {
    if (!audio.ctx) return false;
    const now = audio.ctx.currentTime;
    if (now - (audio.last[name] || 0) < minGap) return false;
    audio.last[name] = now;
    return true;
  }

  function playTone(freq, duration, options = {}) {
    if (!audio.ctx || !audio.master) return;

    const now = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();

    const type = options.type || "square";
    const endFreq = options.endFreq || freq;
    const volume = options.volume ?? 0.05;
    const attack = options.attack ?? 0.008;

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, freq), now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(audio.master);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function playNoise(duration, options = {}) {
    if (!audio.ctx || !audio.master) return;

    const sampleRate = audio.ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = audio.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }

    const src = audio.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = audio.ctx.createBiquadFilter();
    filter.type = options.filterType || "highpass";
    filter.frequency.value = options.cutoff ?? 420;

    const gain = audio.ctx.createGain();
    const now = audio.ctx.currentTime;
    const volume = options.volume ?? 0.04;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(audio.master);

    src.start(now);
    src.stop(now + duration + 0.03);
  }

  function playSfx(name) {
    if (!audio.ctx || !audio.master) return;
    if (!canPlaySfx(name)) return;

    if (name === "summon") {
      playTone(440, 0.07, { type: "square", endFreq: 620, volume: 0.045 });
      return;
    }
    if (name === "archer") {
      playTone(860, 0.035, { type: "triangle", endFreq: 760, volume: 0.03 });
      return;
    }
    if (name === "slash") {
      playNoise(0.05, { cutoff: 900, volume: 0.03 });
      playTone(240, 0.06, { type: "sawtooth", endFreq: 180, volume: 0.02 });
      return;
    }
    if (name === "boomstick") {
      playNoise(0.2, { cutoff: 200, volume: 0.09, filterType: "lowpass" });
      playTone(120, 0.18, { type: "sawtooth", endFreq: 65, volume: 0.06 });
      return;
    }
    if (name === "fortify") {
      playTone(510, 0.24, { type: "sine", endFreq: 680, volume: 0.05 });
      playTone(760, 0.18, { type: "triangle", endFreq: 890, volume: 0.03 });
      return;
    }
    if (name === "upgrade") {
      playTone(580, 0.09, { type: "triangle", endFreq: 760, volume: 0.05 });
      playTone(760, 0.08, { type: "triangle", endFreq: 980, volume: 0.038 });
      return;
    }
    if (name === "wave") {
      playTone(320, 0.12, { type: "square", endFreq: 460, volume: 0.05 });
      return;
    }
    if (name === "victory") {
      playTone(420, 0.2, { type: "triangle", endFreq: 620, volume: 0.055 });
      playTone(620, 0.16, { type: "triangle", endFreq: 840, volume: 0.045 });
      return;
    }
    if (name === "defeat") {
      playTone(260, 0.22, { type: "sawtooth", endFreq: 140, volume: 0.06 });
      playNoise(0.14, { cutoff: 260, volume: 0.038, filterType: "lowpass" });
      return;
    }
    if (name === "intermission") {
      playTone(330, 0.11, { type: "triangle", endFreq: 420, volume: 0.045 });
      playTone(500, 0.14, { type: "triangle", endFreq: 650, volume: 0.03 });
    }
  }

  function showOverlay(title, subtitle, buttonText, onClick) {
    overlayAction = onClick;
    ui.overlayTitle.textContent = title;
    ui.overlaySubtitle.textContent = subtitle;
    ui.overlayButton.textContent = buttonText;
    ui.overlay.classList.add("visible");
  }

  function hideOverlay() {
    ui.overlay.classList.remove("visible");
  }

  function setWaveVictoryVisible(visible) {
    ui.waveVictoryLabel.classList.toggle("visible", visible);
  }

  function sanitizeSelectedTroops(list) {
    const unique = [];
    for (const id of list) {
      if (!TROOP_BY_ID[id]) continue;
      if (unique.includes(id)) continue;
      unique.push(id);
      if (unique.length >= TROOP_SELECT_MAX) break;
    }
    return unique;
  }

  function troopIsImplemented(troop) {
    return Boolean(troop?.unitKey && UNIT_DEFS[troop.unitKey]);
  }

  function troopIconText(name) {
    return name
      .split(/[\s-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  function renderSummonControls() {
    const selected = sanitizeSelectedTroops(state.selectedTroops);
    state.selectedTroops = selected;
    ui.controls.innerHTML = "";

    const troopCount = Math.max(1, selected.length);
    ui.controls.style.setProperty("--troop-count", troopCount.toString());

    if (selected.length === 0) {
      const empty = document.createElement("button");
      empty.className = "action placeholder";
      empty.disabled = true;
      empty.innerHTML = `
        <span class="name">No Troops</span>
        <span class="meta">Pick units before wave</span>
      `;
      ui.controls.appendChild(empty);
      return;
    }

    for (const troopId of selected) {
      const troop = TROOP_BY_ID[troopId];
      const implemented = troopIsImplemented(troop);
      const unit = implemented ? troop.unitKey : "";
      const button = document.createElement("button");
      button.className = `action${implemented ? "" : " placeholder"}`;
      button.dataset.action = "summon";
      button.dataset.unit = unit;
      button.dataset.troopId = troop.id;
      button.innerHTML = `
        <span class="name">${troop.name}</span>
        <span class="meta">${implemented ? `${UNIT_DEFS[unit].cost} Iron` : "Coming Soon"}</span>
      `;
      ui.controls.appendChild(button);
    }
  }

  function renderTroopSelect() {
    const selected = sanitizeSelectedTroops(state.selectedTroops);
    state.selectedTroops = selected;
    ui.troopSelectGrid.innerHTML = "";
    ui.troopSelectChosen.innerHTML = "";

    for (const troop of TROOP_POOL) {
      const implemented = troopIsImplemented(troop);
      const isSelected = selected.includes(troop.id);
      const option = document.createElement("button");
      option.type = "button";
      option.className = `troop-option${isSelected ? " selected" : ""}`;
      option.dataset.troopId = troop.id;
      option.innerHTML = `
        <span class="troop-icon">${troopIconText(troop.name)}</span>
        <div>
          <h3>${troop.name}</h3>
          <span class="troop-stat">⚔ ${troop.attack}</span>
          <span class="troop-stat heart">❤ ${troop.hp}</span>
        </div>
        <span class="troop-tier">${troop.tier}</span>
        <span class="troop-tag ${implemented ? "live" : ""}">${implemented ? "live" : "placeholder"}</span>
      `;
      ui.troopSelectGrid.appendChild(option);
    }

    for (let i = 0; i < TROOP_SELECT_MAX; i += 1) {
      const troopId = selected[i];
      if (!troopId) {
        const empty = document.createElement("div");
        empty.className = "troop-slot empty";
        empty.textContent = "Empty";
        ui.troopSelectChosen.appendChild(empty);
        continue;
      }
      const troop = TROOP_BY_ID[troopId];
      const slot = document.createElement("div");
      slot.className = "troop-slot";
      slot.innerHTML = `
        <button class="remove" data-remove-troop="${troop.id}" type="button">×</button>
        <span class="name">${troop.name}</span>
        <span class="tier">${troop.tier}</span>
      `;
      ui.troopSelectChosen.appendChild(slot);
    }

    ui.troopSelectCount.textContent = `${selected.length}/${TROOP_SELECT_MAX}`;
    ui.troopSelectContinue.disabled = selected.length === 0;
  }

  function toggleTroopSelection(troopId) {
    if (!TROOP_BY_ID[troopId]) return;
    const selected = sanitizeSelectedTroops(state.selectedTroops);
    const index = selected.indexOf(troopId);

    if (index >= 0) {
      selected.splice(index, 1);
    } else if (selected.length < TROOP_SELECT_MAX) {
      selected.push(troopId);
    } else {
      return;
    }

    state.selectedTroops = selected;
    renderTroopSelect();
    renderSummonControls();
    syncButtons();
  }

  function showTroopSelect(nextWave, allowBack) {
    state.mode = "troop_select";
    state.nextWaveToStart = nextWave;
    state.troopSelectAllowBack = allowBack;
    setWaveVictoryVisible(false);
    hideIntermission();
    ui.troopSelectScreen.classList.add("visible");
    ui.troopSelectWave.textContent = `Wave ${nextWave}`;
    ui.troopSelectBack.hidden = !allowBack;
    renderTroopSelect();
    renderSummonControls();
  }

  function hideTroopSelect() {
    ui.troopSelectScreen.classList.remove("visible");
  }

  function showIntermission() {
    state.mode = "intermission";
    setWaveVictoryVisible(false);
    hideTroopSelect();
    ui.intermissionScreen.classList.add("visible");
    ui.intermissionWave.textContent = `Wave ${state.wave}`;
    ui.intermissionGold.textContent = formatInt(state.gold);
    renderUpgradeRows();
    playSfx("intermission");
  }

  function hideIntermission() {
    ui.intermissionScreen.classList.remove("visible");
  }

  function getWaveTarget(waveNumber) {
    return 8 + waveNumber * 5;
  }

  function getWaveStartingIron(waveNumber) {
    return 85 + waveNumber * 15 + state.modifiers.waveStartIronBonus;
  }

  function resetRun() {
    state.mode = "playing";
    state.elapsed = 0;
    state.score = 0;

    state.wave = 1;
    state.waveTarget = 0;
    state.waveSpawned = 0;
    state.waveKilled = 0;
    state.waveProgressDisplay = 0;
    state.waveProgressAnimStart = 0;
    state.waveProgressAnimEnd = 0;
    state.waveProgressAnimElapsed = 0;
    state.waveProgressAnimDuration = 0.24;
    state.waveVictoryTimer = 0;
    state.nextWaveToStart = 1;
    state.troopSelectAllowBack = false;
    state.selectedTroops = [...DEFAULT_SELECTED_TROOPS];
    state.spawnCooldown = 1.3;

    state.iron = 0;
    state.gold = 0;
    state.resourceTick = 0;

    state.upgrades = createUpgradeLevels();
    recomputeModifiers();

    state.bookHp = state.bookMaxHp;
    state.bookShield = 0;

    state.ashMaxHp = 650;
    state.ashHp = state.ashMaxHp;
    state.ashX = ASH_START_X;
    state.ashAttackCd = 0;
    state.ashAttackPulse = 0;

    state.ashMoveDir = 0;
    state.cameraX = 0;
    state.input.left = false;
    state.input.right = false;

    state.wallArcherCd = 0;
    state.wallCatapultCd = 0;

    state.cooldowns.militia = 0;
    state.cooldowns.archer = 0;
    state.cooldowns.knight = 0;
    state.cooldowns.boomstick = 0;
    state.cooldowns.fortify = 0;

    state.units = [];
    state.enemies = [];
    state.particles = [];
    setWaveVictoryVisible(false);
    hideTroopSelect();
    hideIntermission();
    renderSummonControls();
  }

  function startWave(waveNumber) {
    state.wave = waveNumber;
    state.mode = "playing";

    state.waveTarget = getWaveTarget(waveNumber);
    state.waveSpawned = 0;
    state.waveKilled = 0;
    state.waveProgressDisplay = 0;
    state.waveProgressAnimStart = 0;
    state.waveProgressAnimEnd = 0;
    state.waveProgressAnimElapsed = 0;
    state.waveProgressAnimDuration = 0.24;
    state.waveVictoryTimer = 0;
    state.spawnCooldown = 1.15;

    state.iron = getWaveStartingIron(waveNumber);
    state.resourceTick = 0;

    state.ashHp = clamp(state.ashHp + state.ashMaxHp * 0.22, 0, state.ashMaxHp);
    state.bookHp = clamp(state.bookHp + state.bookMaxHp * 0.25, 0, state.bookMaxHp);
    state.bookShield = 0;

    hideIntermission();
    hideTroopSelect();
    renderSummonControls();
    setWaveVictoryVisible(false);
    playSfx("wave");
  }

  function startGame() {
    resetRun();
    hideOverlay();
    showTroopSelect(1, false);
  }

  function completeWave() {
    if (state.mode !== "playing") return;

    if (state.wave >= MAX_WAVES) {
      endGame(true);
      return;
    }
    state.mode = "wave_victory";
    state.waveVictoryTimer = 1.6;
    setWaveVictoryVisible(true);
    playSfx("victory");
  }

  function endGame(victory) {
    if (state.mode === "victory" || state.mode === "defeat") return;

    state.mode = victory ? "victory" : "defeat";
    hideIntermission();
    hideTroopSelect();
    setWaveVictoryVisible(false);

    playSfx(victory ? "victory" : "defeat");

    const title = victory ? "Dawn Breaks" : "The Book Is Lost";
    const subtitle = victory
      ? `You cleared ${MAX_WAVES} waves. Final score: ${state.score}.`
      : `You fell on wave ${state.wave}. Final score: ${state.score}.`;

    showOverlay(title, subtitle, "Defend Again", () => startGame());
  }

  function addParticle(x, y, color, options = {}) {
    state.particles.push({
      x,
      y,
      vx: options.vx ?? random(-35, 35),
      vy: options.vy ?? random(-85, -35),
      gravity: options.gravity ?? 180,
      life: options.life ?? 0.45,
      maxLife: options.life ?? 0.45,
      radius: options.radius ?? random(2.0, 4.5),
      color,
      text: options.text ?? null,
    });
  }

  function grantIron(amount, goldRatio = 0.18) {
    const ironGain = Math.max(0, Math.floor(amount));
    if (ironGain <= 0) return;

    state.iron += ironGain;

    const scaledGoldRatio = goldRatio * state.modifiers.goldRateMult;
    const goldGain = Math.max(1, Math.floor(ironGain * scaledGoldRatio));
    state.gold += goldGain;

    state.score += ironGain * 3 + goldGain * 9;
  }

  function getUnitStats(type) {
    const def = UNIT_DEFS[type];
    return {
      hp: def.hp * state.modifiers.unitHpMult,
      speed: def.speed,
      damage: def.damage * state.modifiers.unitDamageMult,
      range: def.range,
      attackRate: def.attackRate,
    };
  }

  function chooseEnemyType() {
    const w = state.wave;
    const roll = Math.random();

    if (w <= 2) {
      return roll < 0.78 ? "skeleton" : "deadite";
    }
    if (w <= 6) {
      if (roll < 0.52) return "skeleton";
      if (roll < 0.89) return "deadite";
      return "warlord";
    }
    if (roll < 0.3) return "skeleton";
    if (roll < 0.78) return "deadite";
    return "warlord";
  }

  function spawnEnemy() {
    const type = chooseEnemyType();
    const def = ENEMY_DEFS[type];

    const waveScale = 1 + state.wave * 0.14;
    const speedScale = 1 + state.wave * 0.06;

    const spawnFloor = Math.max(state.cameraX + WIDTH + random(140, 430), state.ashX + random(620, 980));

    state.enemies.push({
      type,
      x: Math.min(WORLD_WIDTH - 50, spawnFloor),
      y: GROUND_Y + random(-10, 14),
      hp: def.hp * waveScale,
      maxHp: def.hp * waveScale,
      speed: def.speed * speedScale,
      damage: def.damage * (0.92 + state.wave * 0.07),
      range: def.range,
      attackRate: def.attackRate,
      attackCd: random(0.08, def.attackRate),
      rewardIron: Math.round(def.rewardIron * (0.85 + state.wave * 0.13)),
      scale: def.scale,
      color: def.color,
      dead: false,
      animState: "walk",
      animOffset: Math.random() * 10,
      actionTimer: 0,
    });

    state.waveSpawned += 1;
  }

  function spawnUnit(type) {
    if (state.mode !== "playing") return false;

    const def = UNIT_DEFS[type];
    if (!def) return false;
    if (state.iron < def.cost || state.cooldowns[type] > 0) return false;

    const stats = getUnitStats(type);
    const spawnX = BOOK_X + random(26, 72);
    const spawnY = GROUND_Y + random(-8, 10);

    state.iron -= def.cost;
    state.cooldowns[type] = def.cooldown;

    state.units.push({
      type,
      x: spawnX,
      y: spawnY,
      hp: stats.hp,
      maxHp: stats.hp,
      speed: stats.speed,
      damage: stats.damage,
      range: stats.range,
      attackRate: stats.attackRate,
      attackCd: random(0.0, 0.2),
      color: def.color,
      ranged: def.ranged,
      dead: false,
      animState: "walk",
      animOffset: Math.random() * 10,
      actionTimer: 0,
    });

    playSfx("summon");

    for (let i = 0; i < 6; i += 1) {
      addParticle(spawnX + random(0, 16), spawnY - 16, "#ffe1a0", {
        vx: random(20, 95),
        vy: random(-120, -45),
        life: random(0.2, 0.35),
        radius: random(1.8, 3.2),
      });
    }

    return true;
  }

  function useBoomstick() {
    if (state.mode !== "playing") return false;

    const cfg = ABILITY_DEFS.boomstick;
    if (state.cooldowns.boomstick > 0 || state.iron < cfg.cost) return false;

    state.iron -= cfg.cost;
    state.cooldowns.boomstick = cfg.cooldown;

    const blastStart = state.ashX + 12;
    const blastEnd = state.ashX + 460;
    const blastDamage = cfg.damage * state.modifiers.boomDamageMult;

    let hitCount = 0;
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      if (enemy.x >= blastStart && enemy.x <= blastEnd) {
        const dropoff = clamp((enemy.x - blastStart) / (blastEnd - blastStart), 0, 1);
        const damage = blastDamage * (1 - 0.48 * dropoff);
        damageEnemy(enemy, damage);
        hitCount += 1;
      }
    }

    playSfx("boomstick");

    for (let i = 0; i < 42; i += 1) {
      addParticle(state.ashX + random(20, 80), GROUND_Y - random(20, 80), "rgba(252, 196, 93, 0.95)", {
        vx: random(140, 430),
        vy: random(-140, 70),
        life: random(0.18, 0.32),
        gravity: 90,
        radius: random(2.0, 4.0),
      });
    }

    if (hitCount > 0) {
      addParticle(state.ashX + 90, GROUND_Y - 82, "#fff5cb", {
        vx: 0,
        vy: -34,
        gravity: 0,
        life: 0.65,
        radius: 0,
        text: "BOOMSTICK!",
      });
    }

    return true;
  }

  function useFortify() {
    if (state.mode !== "playing") return false;

    const cfg = ABILITY_DEFS.fortify;
    if (state.cooldowns.fortify > 0 || state.iron < cfg.cost) return false;

    state.iron -= cfg.cost;
    state.cooldowns.fortify = cfg.cooldown;

    state.bookShield = cfg.shieldDuration * state.modifiers.fortifyShieldMult;
    state.bookHp = clamp(state.bookHp + cfg.heal * state.modifiers.fortifyHealMult, 0, state.bookMaxHp);

    playSfx("fortify");

    for (let i = 0; i < 28; i += 1) {
      const angle = (Math.PI * 2 * i) / 28;
      addParticle(BOOK_X + 28 + Math.cos(angle) * 42, GROUND_Y - 58 + Math.sin(angle) * 58, "#8ce4d3", {
        vx: Math.cos(angle) * random(8, 30),
        vy: Math.sin(angle) * random(8, 30),
        gravity: 0,
        life: random(0.4, 0.8),
        radius: random(1.8, 3.4),
      });
    }

    return true;
  }

  function damageEnemy(enemy, amount) {
    if (enemy.dead) return;

    enemy.hp -= amount;

    addParticle(enemy.x, enemy.y - 30, "#ffcf99", {
      vx: random(-30, 30),
      vy: random(-120, -45),
      life: random(0.15, 0.3),
      radius: random(1.6, 3.2),
    });

    if (enemy.hp <= 0) {
      enemy.dead = true;
      state.waveKilled += 1;
      grantIron(enemy.rewardIron, 0.2);

      for (let i = 0; i < 8; i += 1) {
        addParticle(enemy.x, enemy.y - 20, "#9cf0dc", {
          vx: random(-95, 95),
          vy: random(-170, -30),
          life: random(0.3, 0.6),
          radius: random(2.0, 4.0),
        });
      }
    }
  }

  function damageBook(amount) {
    const scaled = state.bookShield > 0 ? amount * 0.35 : amount;
    state.bookHp = clamp(state.bookHp - scaled, 0, state.bookMaxHp);
    if (state.bookHp <= 0) {
      endGame(false);
    }
  }

  function damageAsh(amount) {
    state.ashHp = clamp(state.ashHp - amount, 0, state.ashMaxHp);
    if (state.ashHp <= 0) {
      endGame(false);
    }
  }

  function nearestEnemy(x, maxDist) {
    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      const dist = Math.abs(enemy.x - x);
      if (dist < bestDist && dist <= maxDist) {
        best = enemy;
        bestDist = dist;
      }
    }

    return best;
  }

  function nearestUnitLeftOf(enemyX) {
    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const unit of state.units) {
      if (unit.dead) continue;
      if (unit.x > enemyX + 6) continue;

      const dist = enemyX - unit.x;
      if (dist < bestDist) {
        bestDist = dist;
        best = unit;
      }
    }

    return best;
  }

  function updateAshMovement(dt) {
    if (state.mode !== "playing") {
      state.ashMoveDir = 0;
      return;
    }

    const moveDir = (state.input.right ? 1 : 0) - (state.input.left ? 1 : 0);
    state.ashMoveDir = moveDir;
    if (moveDir === 0) return;

    state.ashX += moveDir * ASH_SPEED * dt;
    const minX = BOOK_X + 24;
    const maxX = WORLD_WIDTH - 120;
    state.ashX = clamp(state.ashX, minX, maxX);
  }

  function updateCamera(dt) {
    const target = clamp(state.ashX - CAMERA_LOOK_AHEAD, 0, WORLD_WIDTH - WIDTH);
    const lerp = 1 - Math.exp(-CAMERA_SMOOTHING * dt);
    state.cameraX += (target - state.cameraX) * lerp;
    state.cameraX = clamp(state.cameraX, 0, WORLD_WIDTH - WIDTH);
  }

  function updateCombat(dt) {
    state.ashAttackCd = Math.max(0, state.ashAttackCd - dt);
    state.ashAttackPulse = Math.max(0, state.ashAttackPulse - dt);

    const ashRange = 300 * state.modifiers.ashRangeMult;
    const ashTarget = nearestEnemy(state.ashX + 16, ashRange);

    if (ashTarget && state.ashAttackCd <= 0) {
      const ashDamage = random(36, 52) * state.modifiers.ashDamageMult;
      damageEnemy(ashTarget, ashDamage);
      state.ashAttackCd = 0.56 * state.modifiers.ashRateMult;
      state.ashAttackPulse = 0.16;
      playSfx("slash");

      for (let i = 0; i < 4; i += 1) {
        addParticle(state.ashX + 24, GROUND_Y - 64, "#ffe8b4", {
          vx: random(150, 270),
          vy: random(-28, 28),
          gravity: 0,
          life: random(0.08, 0.14),
          radius: random(1.6, 2.8),
        });
      }
    }

    for (const unit of state.units) {
      if (unit.dead) continue;

      unit.attackCd = Math.max(0, unit.attackCd - dt);
      unit.actionTimer = Math.max(0, unit.actionTimer - dt);
      unit.animState = unit.actionTimer > 0 ? "attack" : "idle";

      const target = nearestEnemy(unit.x, unit.range);
      if (target) {
        if (unit.attackCd <= 0) {
          unit.attackCd = unit.attackRate;
          unit.actionTimer = 0.16;
          unit.animState = "attack";

          const damage = random(unit.damage * 0.9, unit.damage * 1.1);
          damageEnemy(target, damage);

          if (unit.ranged) {
            playSfx("archer");
            addParticle(unit.x + 10, unit.y - 52, "#d7eef9", {
              vx: random(130, 220),
              vy: random(-8, 8),
              gravity: 0,
              life: random(0.1, 0.18),
              radius: random(1.2, 2.0),
            });
          }
        }
      } else {
        unit.x += unit.speed * dt;
        unit.animState = "walk";
      }

      unit.x = clamp(unit.x, BOOK_X + 8, WORLD_WIDTH - 90);
    }

    for (const enemy of state.enemies) {
      if (enemy.dead) continue;

      enemy.attackCd = Math.max(0, enemy.attackCd - dt);
      enemy.actionTimer = Math.max(0, enemy.actionTimer - dt);
      enemy.animState = enemy.actionTimer > 0 ? "attack" : "walk";

      const targetUnit = nearestUnitLeftOf(enemy.x);
      const unitDistance = targetUnit ? enemy.x - targetUnit.x : Number.POSITIVE_INFINITY;
      const canHitUnit = targetUnit && unitDistance <= enemy.range;
      const canHitAsh = Math.abs(enemy.x - state.ashX) <= enemy.range + 4;
      const canHitBook = enemy.x - BOOK_X <= enemy.range;

      if (canHitUnit) {
        enemy.animState = "attack";
        if (enemy.attackCd <= 0) {
          enemy.attackCd = enemy.attackRate;
          enemy.actionTimer = 0.16;
          targetUnit.hp -= enemy.damage;

          addParticle(targetUnit.x + 5, targetUnit.y - 30, "#ff9b7c", {
            vx: random(-28, 28),
            vy: random(-95, -45),
            life: random(0.14, 0.28),
            radius: random(1.4, 2.8),
          });

          if (targetUnit.hp <= 0) targetUnit.dead = true;
        }
      } else if (canHitAsh) {
        enemy.animState = "attack";
        if (enemy.attackCd <= 0) {
          enemy.attackCd = enemy.attackRate;
          enemy.actionTimer = 0.16;
          damageAsh(enemy.damage * 0.65);

          addParticle(state.ashX + 8, GROUND_Y - 60, "#f3a586", {
            vx: random(-20, 20),
            vy: random(-85, -42),
            life: random(0.14, 0.25),
            radius: random(1.6, 3.0),
          });
        }
      } else if (canHitBook) {
        enemy.animState = "attack";
        if (enemy.attackCd <= 0) {
          enemy.attackCd = enemy.attackRate;
          enemy.actionTimer = 0.16;
          damageBook(enemy.damage);

          addParticle(BOOK_X + 20, GROUND_Y - 42, "#f4bb7b", {
            vx: random(-12, 20),
            vy: random(-80, -30),
            life: random(0.16, 0.26),
            radius: random(1.6, 3.0),
          });
        }
      } else {
        enemy.x -= enemy.speed * dt;
        enemy.animState = "walk";
      }

      enemy.x = Math.max(enemy.x, BOOK_X - 8);
    }
  }

  function updateDefenseSystems(dt) {
    const archerLevel = state.modifiers.wallArcherLevel;
    const catapultLevel = state.modifiers.wallCatapultLevel;

    if (archerLevel > 0) {
      state.wallArcherCd -= dt;
      if (state.wallArcherCd <= 0) {
        const target = nearestEnemy(BOOK_X + 90, 980);
        if (target) {
          const damage = 18 + archerLevel * 9;
          damageEnemy(target, damage);
          addParticle(BOOK_X + 28, GROUND_Y - 130, "#dce7f1", {
            vx: random(210, 310),
            vy: random(-24, 24),
            gravity: 0,
            life: random(0.1, 0.2),
            radius: random(1.1, 2.0),
          });
        }
        state.wallArcherCd = Math.max(0.5, 2.2 - archerLevel * 0.14);
      }
    }

    if (catapultLevel > 0) {
      state.wallCatapultCd -= dt;
      if (state.wallCatapultCd <= 0 && state.enemies.length > 0) {
        let center = null;
        for (const enemy of state.enemies) {
          if (!enemy.dead) {
            center = enemy;
            break;
          }
        }

        if (center) {
          const radius = 120 + catapultLevel * 9;
          const blastDamage = 90 + catapultLevel * 42;

          for (const enemy of state.enemies) {
            if (enemy.dead) continue;
            const dist = Math.abs(enemy.x - center.x);
            if (dist <= radius) {
              const falloff = 1 - dist / Math.max(1, radius);
              damageEnemy(enemy, blastDamage * (0.45 + 0.55 * falloff));
            }
          }

          for (let i = 0; i < 20; i += 1) {
            addParticle(center.x + random(-40, 40), center.y - random(20, 80), "#ffd8a0", {
              vx: random(-100, 100),
              vy: random(-160, -55),
              gravity: 145,
              life: random(0.2, 0.45),
              radius: random(2, 4),
            });
          }
        }

        state.wallCatapultCd = Math.max(1.8, 7.0 - catapultLevel * 0.32);
      }
    }
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
  }

  function updateEconomy(dt) {
    state.resourceTick += dt;
    while (state.resourceTick >= 1) {
      const base = 2 + Math.floor(state.wave * 0.5);
      const passiveIron = base * state.modifiers.ironIncomeMult;
      grantIron(passiveIron, 0.08);
      state.resourceTick -= 1;
    }

    state.iron = Math.min(state.iron, 99999);
    state.gold = Math.min(state.gold, 999999);
  }

  function updateSpawning(dt) {
    if (state.waveSpawned >= state.waveTarget) return;

    state.spawnCooldown -= dt;
    if (state.spawnCooldown > 0) return;

    spawnEnemy();

    if (state.wave >= 5 && state.waveSpawned < state.waveTarget && Math.random() < 0.24) {
      spawnEnemy();
    }
    if (state.wave >= 9 && state.waveSpawned < state.waveTarget && Math.random() < 0.28) {
      spawnEnemy();
    }

    const base = 1.95 - Math.min(1.25, state.wave * 0.085);
    state.spawnCooldown = Math.max(0.45, base + random(0.06, 0.56));
  }

  function updateCooldowns(dt) {
    for (const key of Object.keys(state.cooldowns)) {
      state.cooldowns[key] = Math.max(0, state.cooldowns[key] - dt);
    }
    state.bookShield = Math.max(0, state.bookShield - dt);
  }

  function cullEntities() {
    state.units = state.units.filter((u) => !u.dead && u.hp > 0);
    state.enemies = state.enemies.filter((e) => !e.dead && e.hp > 0 && e.x > BOOK_X - 140);
  }

  function updateWaveProgress(dt) {
    const total = Math.max(1, state.waveTarget);
    const targetProgress = clamp(state.waveKilled / total, 0, 1);

    if (targetProgress < state.waveProgressDisplay) {
      state.waveProgressDisplay = targetProgress;
      state.waveProgressAnimStart = targetProgress;
      state.waveProgressAnimEnd = targetProgress;
      state.waveProgressAnimElapsed = 0;
      return;
    }

    // Retarget on each kill and ease each increment slow -> fast -> slow.
    if (targetProgress > state.waveProgressAnimEnd + 0.0001) {
      const from = state.waveProgressDisplay;
      const distance = targetProgress - from;
      state.waveProgressAnimStart = from;
      state.waveProgressAnimEnd = targetProgress;
      state.waveProgressAnimElapsed = 0;
      state.waveProgressAnimDuration = clamp(0.24 + distance * 4.5, 0.24, 0.9);
    }

    if (state.waveProgressDisplay >= state.waveProgressAnimEnd) return;

    state.waveProgressAnimElapsed += dt;
    const t = clamp(state.waveProgressAnimElapsed / state.waveProgressAnimDuration, 0, 1);
    // Quintic smootherstep: soft start and soft stop with gentler end deceleration.
    const easedT = t * t * t * (t * (t * 6 - 15) + 10);
    state.waveProgressDisplay =
      state.waveProgressAnimStart + (state.waveProgressAnimEnd - state.waveProgressAnimStart) * easedT;
  }

  function update(dt) {
    if (state.mode === "menu" || state.mode === "victory" || state.mode === "defeat") {
      updateParticles(dt);
      updateCamera(dt);
      updateWaveProgress(dt);
      syncHud();
      syncButtons();
      return;
    }

    if (state.mode === "intermission") {
      updateParticles(dt);
      updateCamera(dt);
      updateWaveProgress(dt);
      syncHud();
      syncButtons();
      return;
    }

    if (state.mode === "troop_select") {
      updateParticles(dt);
      updateCamera(dt);
      updateWaveProgress(dt);
      syncHud();
      syncButtons();
      return;
    }

    if (state.mode === "wave_victory") {
      state.waveVictoryTimer = Math.max(0, state.waveVictoryTimer - dt);
      updateParticles(dt);
      updateCamera(dt);
      updateWaveProgress(dt);
      if (state.waveVictoryTimer <= 0) {
        showIntermission();
      }
      syncHud();
      syncButtons();
      return;
    }

    state.elapsed += dt;

    updateAshMovement(dt);
    updateEconomy(dt);
    updateCooldowns(dt);
    updateSpawning(dt);
    updateCombat(dt);
    updateDefenseSystems(dt);
    updateParticles(dt);
    cullEntities();
    updateCamera(dt);
    updateWaveProgress(dt);

    if (state.waveSpawned >= state.waveTarget && state.waveKilled >= state.waveTarget && state.enemies.length === 0) {
      completeWave();
    }

    syncHud();
    syncButtons();
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#171f42");
    sky.addColorStop(0.45, "#1f2143");
    sky.addColorStop(1, "#31210f");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const moonX = 1020 - state.cameraX * 0.08;
    const moon = ctx.createRadialGradient(moonX, 118, 6, moonX, 118, 90);
    moon.addColorStop(0, "rgba(241, 244, 255, 0.9)");
    moon.addColorStop(1, "rgba(241, 244, 255, 0)");
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(moonX, 118, 92, 0, Math.PI * 2);
    ctx.fill();

    const farStep = 520;
    const farOffset = -((state.cameraX * 0.22) % farStep);
    ctx.fillStyle = "#20284f";
    for (let i = -1; i <= Math.ceil(WIDTH / farStep) + 1; i += 1) {
      const x = farOffset + i * farStep;
      ctx.beginPath();
      ctx.moveTo(x, 450);
      ctx.lineTo(x + 96, 388);
      ctx.lineTo(x + 204, 452);
      ctx.lineTo(x + 332, 378);
      ctx.lineTo(x + 466, 455);
      ctx.lineTo(x + farStep, 420);
      ctx.lineTo(x + farStep, HEIGHT);
      ctx.lineTo(x, HEIGHT);
      ctx.closePath();
      ctx.fill();
    }

    const nearStep = 420;
    const nearOffset = -((state.cameraX * 0.38) % nearStep);
    ctx.fillStyle = "#171f3b";
    for (let i = -1; i <= Math.ceil(WIDTH / nearStep) + 1; i += 1) {
      const x = nearOffset + i * nearStep;
      ctx.beginPath();
      ctx.moveTo(x, 492);
      ctx.lineTo(x + 70, 434);
      ctx.lineTo(x + 168, 498);
      ctx.lineTo(x + 274, 440);
      ctx.lineTo(x + nearStep, 504);
      ctx.lineTo(x + nearStep, HEIGHT);
      ctx.lineTo(x, HEIGHT);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#151a35";
    ctx.fillRect(0, GROUND_Y + 4, WIDTH, HEIGHT - GROUND_Y);
    ctx.fillStyle = "#463a26";
    ctx.fillRect(0, GROUND_Y + 35, WIDTH, HEIGHT - GROUND_Y - 35);

    const seamOffset = -((state.cameraX * 0.7) % 80);
    ctx.strokeStyle = "rgba(118, 88, 56, 0.36)";
    ctx.lineWidth = 1;
    for (let x = seamOffset; x <= WIDTH + 80; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y + 35);
      ctx.lineTo(x + 24, HEIGHT);
      ctx.stroke();
    }
  }

  function drawBookAndAsh() {
    const bookScreenX = worldToScreenX(BOOK_X);
    const towerX = bookScreenX - 38;
    const towerY = GROUND_Y - 110;

    if (state.bookShield > 0 && towerX > -120 && towerX < WIDTH + 120) {
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.012);
      ctx.strokeStyle = `rgba(115, 234, 206, ${0.45 + pulse * 0.3})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bookScreenX + 20, GROUND_Y - 52, 58 + pulse * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (towerX > -120 && towerX < WIDTH + 80) {
      ctx.fillStyle = "#4c3a22";
      ctx.fillRect(towerX, towerY, 74, 104);
      ctx.fillStyle = "#7d5b34";
      ctx.fillRect(towerX + 8, towerY + 8, 58, 88);
      ctx.fillStyle = "#d9b36e";
      ctx.fillRect(towerX + 18, towerY + 24, 38, 56);
      ctx.fillStyle = "#422f18";
      ctx.fillRect(towerX + 22, towerY + 30, 30, 44);
      ctx.fillStyle = "#eec37c";
      ctx.fillRect(towerX + 0, towerY - 10, 74, 10);
    }

    const ashSpriteState = {
      animState: state.ashAttackPulse > 0 ? "attack" : state.ashMoveDir !== 0 ? "walk" : "idle",
      animOffset: 0.1,
    };

    drawSprite(spriteAtlas.ash, ashSpriteState, state.ashX, GROUND_Y + 4, 1.75);
  }

  function drawSprite(sheet, actor, x, y, scale) {
    const action = actor.animState || "idle";
    const frames = sheet.anim[action] || sheet.anim.idle;

    let fps = 4;
    if (action === "walk") fps = 9;
    if (action === "attack") fps = 13;

    const frameIndex = frames[Math.floor((state.elapsed + (actor.animOffset || 0)) * fps) % frames.length];

    const w = Math.round(sheet.frameWidth * scale);
    const h = Math.round(sheet.frameHeight * scale);
    const screenX = worldToScreenX(x);
    if (screenX < -w || screenX > WIDTH + w) return;

    const dx = Math.round(screenX - w / 2);
    const dy = Math.round(y - h);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      sheet.canvas,
      frameIndex * sheet.frameWidth,
      0,
      sheet.frameWidth,
      sheet.frameHeight,
      dx,
      dy,
      w,
      h,
    );
    ctx.imageSmoothingEnabled = true;
  }

  function drawUnit(unit) {
    if (!isNearVisible(unit.x, 140)) return;

    const sheet = spriteAtlas.units[unit.type];
    drawSprite(sheet, unit, unit.x, unit.y + 4, 1.58);
    drawHealthBar(worldToScreenX(unit.x) - 16, unit.y - 78, 32, 5, unit.hp / unit.maxHp, "#67d8a3");
  }

  function drawEnemy(enemy) {
    if (!isNearVisible(enemy.x, 140)) return;

    const sheet = spriteAtlas.enemies[enemy.type];
    const scale = 1.52 * enemy.scale;
    drawSprite(sheet, enemy, enemy.x, enemy.y + 5, scale);
    drawHealthBar(worldToScreenX(enemy.x) - 18, enemy.y - 84, 36, 5, enemy.hp / enemy.maxHp, "#ff7867");
  }

  function drawHealthBar(x, y, w, h, ratio, color) {
    const safeRatio = clamp(ratio, 0, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, (w - 2) * safeRatio, h - 2);
  }

  function drawParticles() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 18px Trebuchet MS, sans-serif";

    for (const p of state.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      const sx = worldToScreenX(p.x);

      if (p.text) {
        ctx.fillStyle = `rgba(255, 250, 212, ${alpha})`;
        ctx.fillText(p.text, sx, p.y);
        continue;
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawStageText() {
    if (state.mode !== "playing" && state.mode !== "wave_victory") return;
  }

  function render() {
    drawBackground();
    drawBookAndAsh();

    for (const unit of state.units) {
      drawUnit(unit);
    }
    for (const enemy of state.enemies) {
      drawEnemy(enemy);
    }

    drawParticles();
    drawStageText();
  }

  function syncHud() {
    ui.iron.textContent = formatInt(state.iron);
    ui.gold.textContent = formatInt(state.gold);
    ui.wave.textContent = state.wave.toString();
    ui.enemies.textContent = Math.max(0, state.waveTarget - state.waveKilled).toString();

    const completionRatio = state.waveProgressDisplay;

    // Progress fills from right to left as kills accumulate.
    ui.waveProgressFill.style.transform = `scaleX(${completionRatio})`;
    ui.hordeFlag1.classList.toggle("reached", completionRatio >= 0.34);
    ui.hordeFlag2.classList.toggle("reached", completionRatio >= 0.68);
    setWaveVictoryVisible(state.mode === "wave_victory");

    ui.bookBar.style.width = `${(state.bookHp / state.bookMaxHp) * 100}%`;
    ui.ashBar.style.width = `${(state.ashHp / state.ashMaxHp) * 100}%`;

    ui.intermissionGold.textContent = formatInt(state.gold);
  }

  function setButtonMeta(button, label) {
    const meta = button.querySelector(".meta");
    if (meta) meta.textContent = label;
  }

  function syncButtons() {
    const active = state.mode === "playing";

    const summonButtons = ui.controls.querySelectorAll("button.action");
    for (const button of summonButtons) {
      const unit = button.dataset.unit;
      const cfg = UNIT_DEFS[unit];
      if (!cfg) {
        button.disabled = true;
        setButtonMeta(button, "Coming Soon");
        continue;
      }

      const cd = state.cooldowns[unit] ?? 0;
      const canUse = active && state.iron >= cfg.cost && cd <= 0;
      button.disabled = !canUse;
      setButtonMeta(button, cd > 0 ? `${cd.toFixed(1)}s` : `${cfg.cost} Iron`);
    }

    buttons.boomstick.disabled = true;
    buttons.fortify.disabled = true;

    ui.moveLeft.disabled = !active;
    ui.moveRight.disabled = !active;
  }

  function performAction(action, unit) {
    if (action === "summon" && unit) {
      spawnUnit(unit);
      return;
    }
    if (action === "boomstick") {
      useBoomstick();
      return;
    }
    if (action === "fortify") {
      useFortify();
    }
  }

  function handleControlPress(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    event.preventDefault();
    ensureAudio();
    performAction(button.dataset.action, button.dataset.unit);
  }

  function bindMoveButton(button, direction) {
    if (!button) return;

    const start = (event) => {
      event.preventDefault();
      ensureAudio();
      setMoveState(direction, true);
    };

    const stop = (event) => {
      event.preventDefault();
      setMoveState(direction, false);
    };

    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("pointerleave", stop);
  }

  function handleKeyMovement(event, isDown) {
    const key = event.key.toLowerCase();

    if (key === "arrowleft" || key === "a") {
      event.preventDefault();
      setMoveState("left", isDown);
    }
    if (key === "arrowright" || key === "d") {
      event.preventDefault();
      setMoveState("right", isDown);
    }
  }

  function renderUpgradeRows() {
    ui.upgradeList.innerHTML = "";

    for (const id of UPGRADE_ORDER) {
      const cfg = UPGRADE_DEFS[id];
      const level = getUpgradeLevel(id);
      const maxed = level >= cfg.maxLevel;
      const cost = getUpgradeCost(id);
      const canBuy = !maxed && state.gold >= cost;
      const iconSrc = getUpgradeIconSrc(id);
      const statIcon = getStatIcon(cfg.statIcon);
      const statValue = cfg.stat(level);

      const row = document.createElement("article");
      row.className = "upgrade-row";
      row.innerHTML = `
        <div class="upgrade-icon"><img src="${iconSrc}" alt="${cfg.title} icon" /></div>
        <div class="upgrade-info">
          <h3>${cfg.title}</h3>
          <span class="meta">LEVEL ${level}</span>
          <span class="stat"><span class="i">${statIcon}</span>${statValue}</span>
        </div>
        <button class="upgrade-btn" data-upgrade="${id}" ${canBuy ? "" : "disabled"}>
          <span class="line1">UPGRADE</span>
          <span class="line2">${maxed ? "MAX" : `◎${cost}`}</span>
        </button>
      `;

      ui.upgradeList.appendChild(row);
    }
  }

  function buyUpgrade(id) {
    if (state.mode !== "intermission") return;

    const cfg = UPGRADE_DEFS[id];
    if (!cfg) return;

    const level = getUpgradeLevel(id);
    if (level >= cfg.maxLevel) return;

    const cost = getUpgradeCost(id);
    if (state.gold < cost) return;

    state.gold -= cost;
    state.upgrades[id] = level + 1;

    const oldMax = state.bookMaxHp;
    recomputeModifiers();
    if (state.bookMaxHp > oldMax) {
      state.bookHp = Math.min(state.bookMaxHp, state.bookHp + (state.bookMaxHp - oldMax));
    }

    playSfx("upgrade");

    for (let i = 0; i < 18; i += 1) {
      addParticle(BOOK_X + random(60, 200), GROUND_Y - random(60, 140), "#ffe69b", {
        vx: random(-130, 130),
        vy: random(-160, -40),
        life: random(0.2, 0.5),
        radius: random(1.8, 3.4),
      });
    }

    renderUpgradeRows();
    syncHud();
  }

  function setupControls() {
    ui.controls.addEventListener("click", handleControlPress);
    bindMoveButton(ui.moveLeft, "left");
    bindMoveButton(ui.moveRight, "right");

    window.addEventListener("keydown", (event) => handleKeyMovement(event, true));
    window.addEventListener("keyup", (event) => handleKeyMovement(event, false));

    window.addEventListener("blur", () => {
      setMoveState("left", false);
      setMoveState("right", false);
    });

    ui.overlayButton.addEventListener("click", () => {
      ensureAudio();
      if (typeof overlayAction === "function") {
        overlayAction();
      }
    });

    ui.upgradeList.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-upgrade]");
      if (!button) return;
      ensureAudio();
      buyUpgrade(button.dataset.upgrade);
    });

    ui.intermissionContinue.addEventListener("click", () => {
      ensureAudio();
      showTroopSelect(state.wave + 1, true);
    });

    ui.troopSelectGrid.addEventListener("click", (event) => {
      const option = event.target.closest("button[data-troop-id]");
      if (!option) return;
      ensureAudio();
      toggleTroopSelection(option.dataset.troopId);
    });

    ui.troopSelectChosen.addEventListener("click", (event) => {
      const removeBtn = event.target.closest("button[data-remove-troop]");
      if (!removeBtn) return;
      ensureAudio();
      toggleTroopSelection(removeBtn.dataset.removeTroop);
    });

    ui.troopSelectBack.addEventListener("click", () => {
      ensureAudio();
      if (!state.troopSelectAllowBack) return;
      hideTroopSelect();
      showIntermission();
    });

    ui.troopSelectContinue.addEventListener("click", () => {
      ensureAudio();
      if (state.selectedTroops.length === 0) return;
      hideTroopSelect();
      startWave(state.nextWaveToStart);
    });
  }

  function gameLoop(now) {
    const dt = Math.min((now - lastTick) / 1000, 0.05);
    lastTick = now;

    update(dt);
    render();
    requestAnimationFrame(gameLoop);
  }

  function buildSpriteAtlas() {
    const baseAnim = {
      idle: [0, 1],
      walk: [2, 3, 4, 5],
      attack: [6, 7, 8],
    };

    return {
      ash: createActorSheet(
        {
          body: "#6aa5d3",
          trim: "#2c2b36",
          skin: "#efc79f",
          hair: "#3a291c",
          metal: "#c5ccd8",
          accent: "#8ebadf",
        },
        baseAnim,
      ),
      units: {
        militia: createActorSheet(
          {
            body: "#d5bf8f",
            trim: "#62513b",
            skin: "#efcaa2",
            hair: "#4f3826",
            metal: "#d8d9d5",
            accent: "#b2956c",
          },
          baseAnim,
        ),
        archer: createActorSheet(
          {
            body: "#8db6d9",
            trim: "#3e5e76",
            skin: "#f2caa2",
            hair: "#5f4737",
            metal: "#bdd5e8",
            accent: "#dceaf6",
          },
          baseAnim,
        ),
        knight: createActorSheet(
          {
            body: "#c6c9d3",
            trim: "#636779",
            skin: "#f0caa5",
            hair: "#4a3b30",
            metal: "#e2e5ee",
            accent: "#95a0b7",
          },
          baseAnim,
        ),
      },
      enemies: {
        skeleton: createActorSheet(
          {
            body: "#cfd3cc",
            trim: "#8c9189",
            skin: "#f2ead3",
            hair: "#7d7f79",
            metal: "#dadede",
            accent: "#b0b4ad",
          },
          baseAnim,
        ),
        deadite: createActorSheet(
          {
            body: "#89b066",
            trim: "#48643b",
            skin: "#c3d39f",
            hair: "#263120",
            metal: "#97a17a",
            accent: "#c2d9a8",
          },
          baseAnim,
        ),
        warlord: createActorSheet(
          {
            body: "#875f8e",
            trim: "#4e3353",
            skin: "#d8b6c8",
            hair: "#2f2233",
            metal: "#bb9ec3",
            accent: "#d6b8de",
          },
          baseAnim,
        ),
      },
    };
  }

  function createActorSheet(palette, anim) {
    const frameWidth = 32;
    const frameHeight = 42;
    const frameCount = 10;

    const sheet = document.createElement("canvas");
    sheet.width = frameWidth * frameCount;
    sheet.height = frameHeight;

    const sctx = sheet.getContext("2d");
    sctx.imageSmoothingEnabled = false;

    for (let frame = 0; frame < frameCount; frame += 1) {
      drawActorFrame(sctx, frame, frameWidth, frameHeight, palette);
    }

    return {
      canvas: sheet,
      frameWidth,
      frameHeight,
      anim,
    };
  }

  function drawActorFrame(sctx, frame, fw, fh, p) {
    const x0 = frame * fw;
    const yBase = fh - 2;

    const walkPhase = frame >= 2 && frame <= 5 ? frame - 2 : 0;
    const leftLegShift = walkPhase === 0 ? -1 : walkPhase === 2 ? 1 : 0;
    const rightLegShift = walkPhase === 1 ? -1 : walkPhase === 3 ? 1 : 0;

    const isAttack = frame >= 6 && frame <= 8;
    const bob = frame % 2 === 0 ? 0 : 1;

    sctx.fillStyle = p.trim;
    sctx.fillRect(x0 + 12 + leftLegShift, yBase - 10 - bob, 4, 8);
    sctx.fillRect(x0 + 17 + rightLegShift, yBase - 10 - bob, 4, 8);

    sctx.fillStyle = p.body;
    sctx.fillRect(x0 + 10, yBase - 24 - bob, 12, 12);

    sctx.fillStyle = p.accent;
    sctx.fillRect(x0 + 13, yBase - 20 - bob, 6, 4);

    sctx.fillStyle = p.skin;
    sctx.fillRect(x0 + 12, yBase - 31 - bob, 8, 7);

    sctx.fillStyle = p.hair;
    sctx.fillRect(x0 + 12, yBase - 33 - bob, 8, 3);

    sctx.fillStyle = p.trim;
    sctx.fillRect(x0 + 9, yBase - 22 - bob, 2, 7);

    if (isAttack) {
      sctx.fillStyle = p.metal;
      sctx.fillRect(x0 + 21, yBase - 22 - bob, 8, 2);
      sctx.fillRect(x0 + 27, yBase - 24 - bob, 2, 6);
    } else {
      sctx.fillStyle = p.metal;
      sctx.fillRect(x0 + 20, yBase - 21 - bob, 5, 2);
    }
  }

  setupControls();

  showOverlay(
    "Army of Darkness Defense",
    "Kill each wave to enter upgrades, then pick up to 5 troops before battle.",
    "Start Defense",
    () => startGame(),
  );

  renderSummonControls();
  syncHud();
  syncButtons();
  requestAnimationFrame(gameLoop);
})();
