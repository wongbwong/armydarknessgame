(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const ui = {
    souls: document.getElementById("souls-value"),
    wave: document.getElementById("wave-value"),
    time: document.getElementById("time-value"),
    bookBar: document.getElementById("book-bar"),
    ashBar: document.getElementById("ash-bar"),
    controls: document.getElementById("controls"),
    overlay: document.getElementById("overlay"),
    overlayTitle: document.getElementById("overlay-title"),
    overlaySubtitle: document.getElementById("overlay-subtitle"),
    overlayButton: document.getElementById("overlay-button"),
    shopOptions: document.getElementById("shop-options"),
    movement: document.getElementById("movement"),
    moveLeft: document.getElementById("move-left"),
    moveRight: document.getElementById("move-right"),
  };

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const GROUND_Y = 565;
  const WORLD_WIDTH = 6200;
  const BOOK_X = 160;
  const ASH_START_X = 300;
  const ASH_SPEED = 240;
  const CAMERA_LOOK_AHEAD = WIDTH * 0.35;
  const CAMERA_SMOOTHING = 8.5;

  const WIN_TIME_SECONDS = 210;
  const WAVE_DURATION = 20;
  const SHOP_INTERVAL = 2;
  const FIRST_SHOP_WAVE = 3;
  const FINAL_SHOP_WAVE = 9;

  const UNIT_DEFS = {
    militia: {
      name: "Militia",
      cost: 35,
      cooldown: 1.4,
      hp: 120,
      speed: 62,
      damage: 16,
      range: 38,
      attackRate: 0.82,
      color: "#dbc597",
      ranged: false,
    },
    archer: {
      name: "Archer",
      cost: 10,
      cooldown: 0.5,
      hp: 95,
      speed: 53,
      damage: 24,
      range: 240,
      attackRate: 2,
      color: "#8fb8d9",
      ranged: true,
    },
    knight: {
      name: "Knight",
      cost: 95,
      cooldown: 4.8,
      hp: 300,
      speed: 46,
      damage: 44,
      range: 42,
      attackRate: 1.2,
      color: "#c6c9d3",
      ranged: false,
    },
  };

  const ENEMY_DEFS = {
    skeleton: {
      name: "Skeleton",
      hp: 90,
      speed: 45,
      damage: 13,
      range: 34,
      attackRate: 1.08,
      reward: 16,
      color: "#cfd3cc",
      scale: 0.95,
    },
    deadite: {
      name: "Deadite",
      hp: 155,
      speed: 39,
      damage: 20,
      range: 38,
      attackRate: 1.0,
      reward: 24,
      color: "#89b066",
      scale: 1.05,
    },
    warlord: {
      name: "Warlord",
      hp: 360,
      speed: 32,
      damage: 40,
      range: 46,
      attackRate: 1.35,
      reward: 52,
      color: "#875f8e",
      scale: 1.25,
    },
  };

  const ABILITY_DEFS = {
    boomstick: { cost: 45, cooldown: 12.0, damage: 260 },
    fortify: { cost: 35, cooldown: 18.0, heal: 190, shieldDuration: 4.5 },
  };

  const UPGRADE_DEFS = {
    militia_drill: {
      title: "Militia Drill",
      desc: "+18% militia damage and +12% militia health.",
      maxLevel: 4,
      baseCost: 70,
      step: 36,
      apply: () => {
        state.modifiers.unitDamage.militia *= 1.18;
        state.modifiers.unitHp.militia *= 1.12;
      },
    },
    archer_fletching: {
      title: "Archer Fletching",
      desc: "+16% archer damage and +10% archer range.",
      maxLevel: 4,
      baseCost: 78,
      step: 38,
      apply: () => {
        state.modifiers.unitDamage.archer *= 1.16;
        state.modifiers.unitRange.archer *= 1.1;
      },
    },
    knight_plating: {
      title: "Knight Plating",
      desc: "+25% knight health and +8% knight damage.",
      maxLevel: 3,
      baseCost: 95,
      step: 48,
      apply: () => {
        state.modifiers.unitHp.knight *= 1.25;
        state.modifiers.unitDamage.knight *= 1.08;
      },
    },
    soul_siphon: {
      title: "Soul Siphon",
      desc: "+24% passive soul income.",
      maxLevel: 4,
      baseCost: 80,
      step: 44,
      apply: () => {
        state.modifiers.soulIncome *= 1.24;
      },
    },
    bounty_board: {
      title: "Bounty Board",
      desc: "+20% souls from enemy kills.",
      maxLevel: 3,
      baseCost: 88,
      step: 45,
      apply: () => {
        state.modifiers.enemyReward *= 1.2;
      },
    },
    ash_aim: {
      title: "Ash's Aim",
      desc: "+20% Ash damage and +10% Ash range.",
      maxLevel: 4,
      baseCost: 85,
      step: 40,
      apply: () => {
        state.modifiers.ashDamage *= 1.2;
        state.modifiers.ashRange *= 1.1;
      },
    },
    quick_pump: {
      title: "Quick Pump",
      desc: "Ash attacks 10% faster.",
      maxLevel: 4,
      baseCost: 92,
      step: 50,
      apply: () => {
        state.modifiers.ashRate *= 0.9;
      },
    },
    boomstick_shells: {
      title: "Boomstick Shells",
      desc: "+28% Boomstick damage and 10% lower cooldown.",
      maxLevel: 3,
      baseCost: 98,
      step: 54,
      apply: () => {
        state.modifiers.boomDamage *= 1.28;
        state.modifiers.boomCd *= 0.9;
      },
    },
    holy_resin: {
      title: "Holy Resin",
      desc: "+35% Fortify heal and +20% shield duration.",
      maxLevel: 3,
      baseCost: 90,
      step: 46,
      apply: () => {
        state.modifiers.fortifyHeal *= 1.35;
        state.modifiers.fortifyShield *= 1.2;
      },
    },
    ancient_warding: {
      title: "Ancient Warding",
      desc: "+120 max Necronomicon HP and instant repair.",
      maxLevel: 4,
      baseCost: 110,
      step: 58,
      apply: () => {
        state.bookMaxHp += 120;
        state.bookHp = Math.min(state.bookMaxHp, state.bookHp + 160);
      },
    },
  };

  const buttons = {
    militia: document.getElementById("btn-militia"),
    archer: document.getElementById("btn-archer"),
    knight: document.getElementById("btn-knight"),
    boomstick: document.getElementById("btn-boomstick"),
    fortify: document.getElementById("btn-fortify"),
  };

  function makeDefaultModifiers() {
    return {
      unitHp: { militia: 1, archer: 1, knight: 1 },
      unitDamage: { militia: 1, archer: 1, knight: 1 },
      unitSpeed: { militia: 1, archer: 1, knight: 1 },
      unitRange: { militia: 1, archer: 1, knight: 1 },
      soulIncome: 1,
      enemyReward: 1,
      ashDamage: 1,
      ashRate: 1,
      ashRange: 1,
      boomDamage: 1,
      boomCd: 1,
      fortifyHeal: 1,
      fortifyShield: 1,
    };
  }

  function makeDefaultUpgrades() {
    const levels = {};
    for (const key of Object.keys(UPGRADE_DEFS)) {
      levels[key] = 0;
    }
    return levels;
  }

  const state = {
    mode: "menu",
    elapsed: 0,
    wave: 1,
    nextShopWave: FIRST_SHOP_WAVE,
    souls: 120,
    soulsTick: 0,
    score: 0,
    spawnCooldown: 2.0,
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
    cooldowns: {
      militia: 0,
      archer: 0,
      knight: 0,
      boomstick: 0,
      fortify: 0,
    },
    upgrades: makeDefaultUpgrades(),
    modifiers: makeDefaultModifiers(),
    shopOffers: [],
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

  function formatTime(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    const mins = Math.floor(s / 60);
    const rem = String(s % 60).padStart(2, "0");
    return `${mins}:${rem}`;
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  function worldToScreenX(worldX) {
    return worldX - state.cameraX;
  }

  function isNearVisible(worldX, padding = 120) {
    const x = worldToScreenX(worldX);
    return x >= -padding && x <= WIDTH + padding;
  }

  function setMoveState(direction, active) {
    if (!state.input[direction]) {
      state.input[direction] = false;
    }
    state.input[direction] = active;
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
    const minX = BOOK_X + 22;
    const maxX = WORLD_WIDTH - 120;
    state.ashX = clamp(state.ashX, minX, maxX);
  }

  function updateCamera(dt) {
    const target = clamp(state.ashX - CAMERA_LOOK_AHEAD, 0, WORLD_WIDTH - WIDTH);
    const lerp = 1 - Math.exp(-CAMERA_SMOOTHING * dt);
    state.cameraX += (target - state.cameraX) * lerp;
    state.cameraX = clamp(state.cameraX, 0, WORLD_WIDTH - WIDTH);
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

  function canPlaySfx(name, minGap = 0.04) {
    if (!audio.ctx) return false;
    const now = audio.ctx.currentTime;
    if (now - (audio.last[name] || 0) < minGap) return false;
    audio.last[name] = now;
    return true;
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

    if (name === "shop") {
      playTone(330, 0.12, { type: "sine", endFreq: 440, volume: 0.04 });
      playTone(440, 0.12, { type: "sine", endFreq: 560, volume: 0.03 });
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
    }
  }

  function resetGame() {
    state.mode = "playing";
    state.elapsed = 0;
    state.wave = 1;
    state.nextShopWave = FIRST_SHOP_WAVE;
    state.souls = 120;
    state.soulsTick = 0;
    state.score = 0;
    state.spawnCooldown = 2.0;

    state.bookMaxHp = 1100;
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

    state.cooldowns.militia = 0;
    state.cooldowns.archer = 0;
    state.cooldowns.knight = 0;
    state.cooldowns.boomstick = 0;
    state.cooldowns.fortify = 0;

    state.upgrades = makeDefaultUpgrades();
    state.modifiers = makeDefaultModifiers();
    state.shopOffers = [];

    state.units = [];
    state.enemies = [];
    state.particles = [];
  }

  function showOverlay(title, subtitle, buttonText, onClick, options = {}) {
    overlayAction = onClick;
    ui.overlayTitle.textContent = title;
    ui.overlaySubtitle.textContent = subtitle;
    ui.overlayButton.textContent = buttonText;

    const showShop = !!options.showShop;
    ui.shopOptions.classList.toggle("visible", showShop);
    if (!showShop) {
      ui.shopOptions.innerHTML = "";
    }

    ui.overlay.classList.add("visible");
  }

  function hideOverlay() {
    ui.overlay.classList.remove("visible");
    ui.shopOptions.classList.remove("visible");
  }

  function startGame() {
    resetGame();
    hideOverlay();
    playSfx("wave");
  }

  function endGame(victory) {
    if (state.mode !== "playing") {
      return;
    }

    state.mode = victory ? "victory" : "defeat";
    playSfx(victory ? "victory" : "defeat");

    const title = victory ? "Dawn Breaks" : "The Book Is Lost";
    const subtitle = victory
      ? `You survived ${state.wave} waves and scored ${state.score}. Groovy.`
      : `You reached wave ${state.wave} with a score of ${state.score}.`;
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

  function chooseEnemyType() {
    const t = state.elapsed;
    const roll = Math.random();

    if (t < 35) {
      return roll < 0.8 ? "skeleton" : "deadite";
    }
    if (t < 90) {
      if (roll < 0.57) return "skeleton";
      if (roll < 0.9) return "deadite";
      return "warlord";
    }
    if (roll < 0.43) return "skeleton";
    if (roll < 0.84) return "deadite";
    return "warlord";
  }

  function getUnitStats(type) {
    const def = UNIT_DEFS[type];
    return {
      hp: def.hp * state.modifiers.unitHp[type],
      speed: def.speed * state.modifiers.unitSpeed[type],
      damage: def.damage * state.modifiers.unitDamage[type],
      range: def.range * state.modifiers.unitRange[type],
      attackRate: def.attackRate,
    };
  }

  function spawnEnemy() {
    const type = chooseEnemyType();
    const def = ENEMY_DEFS[type];
    const scaling = 1 + state.elapsed / 175;
    const speedScale = 1 + state.elapsed / 320;
    const yOffset = random(-10, 14);

    const spawnFloor = Math.max(state.cameraX + WIDTH + random(140, 440), state.ashX + random(680, 980));

    state.enemies.push({
      type,
      x: Math.min(WORLD_WIDTH - 40, spawnFloor),
      y: GROUND_Y + yOffset,
      hp: def.hp * scaling,
      maxHp: def.hp * scaling,
      speed: def.speed * speedScale,
      damage: def.damage * (0.92 + state.elapsed / 260),
      range: def.range,
      attackRate: def.attackRate,
      attackCd: random(0.1, def.attackRate),
      reward: Math.round(def.reward * (0.9 + state.elapsed / 380)),
      scale: def.scale,
      color: def.color,
      dead: false,
      animState: "walk",
      animOffset: Math.random() * 10,
      actionTimer: 0,
    });
  }

  function spawnUnit(type) {
    if (state.mode !== "playing") return false;
    const def = UNIT_DEFS[type];
    if (!def) return false;
    if (state.souls < def.cost || state.cooldowns[type] > 0) return false;

    const stats = getUnitStats(type);

    state.souls -= def.cost;
    state.cooldowns[type] = def.cooldown;

    state.units.push({
      type,
      x: state.ashX + random(8, 32),
      y: GROUND_Y + random(-8, 10),
      hp: stats.hp,
      maxHp: stats.hp,
      speed: stats.speed,
      damage: stats.damage,
      range: stats.range,
      attackRate: stats.attackRate,
      attackCd: random(0.0, 0.15),
      color: def.color,
      ranged: def.ranged,
      dead: false,
      animState: "walk",
      animOffset: Math.random() * 10,
      actionTimer: 0,
    });

    playSfx("summon");

    for (let i = 0; i < 6; i += 1) {
      addParticle(state.ashX + 20, GROUND_Y - 16, "#ffe1a0", {
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
    const cooldown = cfg.cooldown * state.modifiers.boomCd;

    if (state.cooldowns.boomstick > 0 || state.souls < cfg.cost) return false;

    state.souls -= cfg.cost;
    state.cooldowns.boomstick = cooldown;
    const blastStart = state.ashX + 12;
    const blastEnd = state.ashX + 440;
    const blastDamage = cfg.damage * state.modifiers.boomDamage;

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
      addParticle(
        state.ashX + random(20, 80),
        GROUND_Y - random(20, 80),
        "rgba(252, 196, 93, 0.95)",
        {
          vx: random(140, 430),
          vy: random(-140, 70),
          life: random(0.18, 0.32),
          gravity: 90,
          radius: random(2.0, 4.0),
        },
      );
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
    if (state.cooldowns.fortify > 0 || state.souls < cfg.cost) return false;

    state.souls -= cfg.cost;
    state.cooldowns.fortify = cfg.cooldown;
    state.bookShield = cfg.shieldDuration * state.modifiers.fortifyShield;
    state.bookHp = clamp(state.bookHp + cfg.heal * state.modifiers.fortifyHeal, 0, state.bookMaxHp);

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
      const reward = Math.round(enemy.reward * state.modifiers.enemyReward);
      state.souls += reward;
      state.score += reward * 4;

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

  function updateCombat(dt) {
    state.ashAttackCd = Math.max(0, state.ashAttackCd - dt);
    state.ashAttackPulse = Math.max(0, state.ashAttackPulse - dt);

    const ashRange = 300 * state.modifiers.ashRange;
    const ashTarget = nearestEnemy(state.ashX + 16, ashRange);

    if (ashTarget && state.ashAttackCd <= 0) {
      const ashDamage = random(36, 52) * state.modifiers.ashDamage;
      damageEnemy(ashTarget, ashDamage);
      state.ashAttackCd = 0.56 * state.modifiers.ashRate;
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
          unit.actionTimer = 0.15;
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
          if (targetUnit.hp <= 0) {
            targetUnit.dead = true;
          }
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
    state.soulsTick += dt;
    while (state.soulsTick >= 1) {
      const income = (2 + Math.floor(state.wave / 4)) * state.modifiers.soulIncome;
      state.souls += income;
      state.soulsTick -= 1;
    }
    state.souls = Math.min(state.souls, 9999);
  }

  function updateSpawning(dt) {
    state.spawnCooldown -= dt;
    if (state.spawnCooldown > 0) return;

    spawnEnemy();
    if (state.wave > 4 && Math.random() < 0.16) spawnEnemy();
    if (state.wave > 8 && Math.random() < 0.21) spawnEnemy();

    const base = 2.35 - Math.min(1.66, state.elapsed * 0.012);
    state.spawnCooldown = Math.max(0.52, base + random(0.08, 0.7));
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

  function bankAndClearEnemies() {
    let bonus = 0;
    for (const enemy of state.enemies) {
      if (!enemy.dead && enemy.hp > 0) {
        bonus += enemy.reward * 0.45;
        addParticle(enemy.x, enemy.y - 24, "#b3f7df", {
          vx: random(-80, 80),
          vy: random(-150, -50),
          life: random(0.25, 0.55),
          radius: random(2, 4),
        });
      }
    }
    state.souls += Math.round(bonus);
    state.enemies = [];
  }

  function getUpgradeCost(id) {
    const def = UPGRADE_DEFS[id];
    const level = state.upgrades[id] || 0;
    return def.baseCost + def.step * level;
  }

  function getAvailableUpgradeIds() {
    return Object.keys(UPGRADE_DEFS).filter((id) => (state.upgrades[id] || 0) < UPGRADE_DEFS[id].maxLevel);
  }

  function generateShopOffers() {
    const available = getAvailableUpgradeIds();
    if (available.length === 0) {
      state.shopOffers = [];
      return;
    }

    shuffle(available);
    const picked = available.slice(0, Math.min(3, available.length));
    state.shopOffers = picked.map((id) => ({ id, purchased: false }));
  }

  function updateShopSubtitle() {
    const shopsLeft = Math.max(0, Math.floor((FINAL_SHOP_WAVE - state.wave) / SHOP_INTERVAL));
    ui.overlaySubtitle.textContent = `Spend Souls on permanent run upgrades. Souls: ${Math.floor(
      state.souls,
    )}. Upcoming shop stops: ${shopsLeft}.`;
  }

  function renderShopCards() {
    ui.shopOptions.innerHTML = "";

    if (state.shopOffers.length === 0) {
      const empty = document.createElement("button");
      empty.className = "shop-card";
      empty.type = "button";
      empty.innerHTML = '<div class="title">Tree Completed</div><div class="desc">All upgrades are maxed for this run.</div>';
      empty.disabled = true;
      ui.shopOptions.appendChild(empty);
      return;
    }

    state.shopOffers.forEach((offer, index) => {
      const upgrade = UPGRADE_DEFS[offer.id];
      const level = state.upgrades[offer.id] || 0;
      const max = upgrade.maxLevel;
      const cost = getUpgradeCost(offer.id);
      const affordable = state.souls >= cost;

      const card = document.createElement("button");
      card.className = "shop-card";
      card.type = "button";
      card.disabled = offer.purchased || level >= max || !affordable;

      const costText = level >= max ? "MAXED" : affordable ? `${cost} Souls` : `Need ${cost}`;
      card.innerHTML = `
        <div class="title">${upgrade.title} (${level}/${max})</div>
        <div class="desc">${upgrade.desc}</div>
        <div class="cost">${offer.purchased ? "Purchased" : costText}</div>
      `;

      card.addEventListener("click", () => {
        ensureAudio();
        buyUpgrade(index);
      });

      ui.shopOptions.appendChild(card);
    });
  }

  function buyUpgrade(offerIndex) {
    if (state.mode !== "shop") return;

    const offer = state.shopOffers[offerIndex];
    if (!offer || offer.purchased) return;

    const id = offer.id;
    const def = UPGRADE_DEFS[id];
    const level = state.upgrades[id] || 0;
    if (level >= def.maxLevel) {
      offer.purchased = true;
      renderShopCards();
      return;
    }

    const cost = getUpgradeCost(id);
    if (state.souls < cost) {
      return;
    }

    state.souls -= cost;
    state.upgrades[id] = level + 1;
    def.apply();
    offer.purchased = true;

    playSfx("upgrade");

    for (let i = 0; i < 16; i += 1) {
      addParticle(BOOK_X + random(60, 200), GROUND_Y - random(60, 140), "#ffe69b", {
        vx: random(-130, 130),
        vy: random(-160, -40),
        life: random(0.2, 0.5),
        radius: random(1.8, 3.4),
      });
    }

    renderShopCards();
    updateShopSubtitle();
    syncHud();
    syncButtons();
  }

  function startWaveFromShop() {
    if (state.mode !== "shop") return;
    state.mode = "playing";
    state.spawnCooldown = 1.15;
    hideOverlay();
    playSfx("wave");
  }

  function openShop() {
    state.mode = "shop";
    bankAndClearEnemies();
    generateShopOffers();

    showOverlay(
      `Camp Shop - Before Wave ${state.wave}`,
      "Spend Souls on permanent run upgrades.",
      "Start Wave",
      () => startWaveFromShop(),
      { showShop: true },
    );
    renderShopCards();
    updateShopSubtitle();

    playSfx("shop");
  }

  function maybeOpenShopOnWaveTransition() {
    if (state.wave < state.nextShopWave) return false;
    if (state.wave > FINAL_SHOP_WAVE) return false;

    openShop();
    state.nextShopWave += SHOP_INTERVAL;
    return true;
  }

  function update(dt) {
    if (state.mode === "menu" || state.mode === "victory" || state.mode === "defeat") {
      updateParticles(dt);
      updateCamera(dt);
      syncHud();
      syncButtons();
      return;
    }

    if (state.mode === "shop") {
      updateParticles(dt);
      updateCamera(dt);
      syncHud();
      syncButtons();
      return;
    }

    const previousWave = state.wave;
    state.elapsed += dt;
    state.wave = Math.floor(state.elapsed / WAVE_DURATION) + 1;

    if (state.elapsed >= WIN_TIME_SECONDS) {
      endGame(true);
      syncHud();
      syncButtons();
      return;
    }

    if (state.wave !== previousWave) {
      if (maybeOpenShopOnWaveTransition()) {
        updateCamera(dt);
        syncHud();
        syncButtons();
        return;
      }
    }

    updateAshMovement(dt);
    updateEconomy(dt);
    updateCooldowns(dt);
    updateSpawning(dt);
    updateCombat(dt);
    updateParticles(dt);
    cullEntities();
    updateCamera(dt);

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
      if (p.text) {
        ctx.fillStyle = `rgba(255, 250, 212, ${alpha})`;
        ctx.fillText(p.text, worldToScreenX(p.x), p.y);
        continue;
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(worldToScreenX(p.x), p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawStageText() {
    if (state.mode !== "playing") {
      return;
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.font = "800 30px Trebuchet MS, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`WAVE ${state.wave}`, WIDTH - 24, 190);
  }

  function drawShopText() {
    if (state.mode !== "shop") return;
    ctx.fillStyle = "rgba(255, 238, 190, 0.2)";
    ctx.font = "800 34px Trebuchet MS, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("SHOP BREAK", WIDTH - 24, 190);
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
    drawShopText();
  }

  function syncHud() {
    ui.souls.textContent = Math.floor(state.souls).toString();
    ui.wave.textContent = state.wave.toString();
    ui.time.textContent = formatTime(WIN_TIME_SECONDS - state.elapsed);
    ui.bookBar.style.width = `${(state.bookHp / state.bookMaxHp) * 100}%`;
    ui.ashBar.style.width = `${(state.ashHp / state.ashMaxHp) * 100}%`;
  }

  function setButtonMeta(button, label) {
    const meta = button.querySelector(".meta");
    if (meta) meta.textContent = label;
  }

  function syncButtons() {
    const active = state.mode === "playing";

    for (const key of ["militia", "archer", "knight"]) {
      const button = buttons[key];
      const cfg = UNIT_DEFS[key];
      const cd = state.cooldowns[key];
      const canUse = active && state.souls >= cfg.cost && cd <= 0;
      button.disabled = !canUse;
      setButtonMeta(button, cd > 0 ? `${cd.toFixed(1)}s` : `${cfg.cost} Souls`);
    }

    const boomCd = state.cooldowns.boomstick;
    const canBoom = active && state.souls >= ABILITY_DEFS.boomstick.cost && boomCd <= 0;
    buttons.boomstick.disabled = !canBoom;
    setButtonMeta(
      buttons.boomstick,
      boomCd > 0 ? `${boomCd.toFixed(1)}s` : `${ABILITY_DEFS.boomstick.cost} Souls`,
    );

    const fortCd = state.cooldowns.fortify;
    const canFort = active && state.souls >= ABILITY_DEFS.fortify.cost && fortCd <= 0;
    buttons.fortify.disabled = !canFort;
    setButtonMeta(
      buttons.fortify,
      fortCd > 0 ? `${fortCd.toFixed(1)}s` : `${ABILITY_DEFS.fortify.cost} Souls`,
    );
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
      ash: createActorSheet({
        body: "#6aa5d3",
        trim: "#2c2b36",
        skin: "#efc79f",
        hair: "#3a291c",
        metal: "#c5ccd8",
        accent: "#8ebadf",
      }, baseAnim),
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
    "Summon defenders, fire Boomstick Blast, and protect the Necronomicon until dawn.",
    "Start Defense",
    () => startGame(),
  );
  syncHud();
  syncButtons();
  requestAnimationFrame(gameLoop);
})();
