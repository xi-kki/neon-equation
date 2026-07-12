# 🎲 Neon Equation

**A math-powered physics sandbox with neon aesthetics.** Type mathematical expressions to destroy glowing particles, control gravity, and manipulate velocity in real-time. Every action triggers screen shake, neon explosions, particle trails, and **sound effects**.

![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-blue)

---

## 🎮 How to Play

### 3 Game Modes

| Mode | Description |
|------|-------------|
| 🎯 **Sandbox** | Free play — no pressure, just math & physics |
| ⏱️ **Time Attack** | Destroy as many particles as you can in **60 seconds** |
| 🏆 **Target Score** | Reach **5,000 points** without running out of particles |

### Core Mechanic — Math → Physics

Particles with numbers bounce around the screen. Type a math expression to **destroy matching particles**:

| Expression | Effect |
|-----------|--------|
| `5 + 3` | Destroys all particles with value **8** |
| `10 * 2` | Destroys all particles with value **20** |
| `(15 - 3) / 4` | Destroys all particles with value **3** |
| `7 ^ 2` | Destroys all particles with value **49** |

### Commands — Control the Physics

| Command | Effect |
|---------|--------|
| `gravity 0.5` | Set gravity (0 = float, 0.15 = normal, 1 = heavy) |
| `speed 2` | Multiply all particle velocities |
| `spawn 15` | Spawn N new particles |
| `clear` | Destroy all particles in a massive explosion |

### Scoring
- **100 pts** per particle destroyed
- **Combo multiplier**: chain destructions for 1.5x, 2.25x, 3.375x...
- High scores saved locally in your browser (Time Attack & Target Score)

---

## ✨ Features (100% Complete)

### Visual
- **Neon glow** — every particle has 3-layer shadowBlur glow (outer, mid, core)
- **Motion trails** — particles leave fading neon trails
- **Screen shake** — proportional to explosion intensity, decays per frame
- **Explosion sparks** — radial burst effects on every destruction
- **Dark glassmorphism HUD** — `backdrop-filter: blur(8px)` panels
- **Particle collisions** — realistic bounce physics with velocity exchange
- **Floating background particles** — animated menu screen
- **Cinematic vignette** — subtle radial darkening at screen edges

### Audio (Web Audio API — no files needed)
- **Explosion SFX** — noise burst + low thump, intensity-scaled
- **Combo chime** — ascending pitch with combo count
- **Miss sound** — sad descending tone on failed expression
- **Command blip** — digital square wave chirp
- **Clear sweep** — rising sawtooth + noise burst
- **Game over / Victory** — descending / ascending arpeggios
- **Keypress click** — subtle feedback for every keystroke
- **Sound toggle** — on/off in menu

### Game Modes
- **Sandbox** — infinite free play, auto-spawn
- **Time Attack** — 60-second countdown, pulse timer in last 10s
- **Target Score** — reach 5,000 with limited particles

### Mobile Support
- **Responsive HUD** — scales from desktop to phone screens
- **Touch-friendly input** — `inputMode="text"`, larger tap targets
- **Quick-action buttons** — `Spawn`, `+`, `−`, `×`, `÷` for mobile
- **Active state scaling** — visual feedback on touch

### Persistence
- **High scores** — saved to localStorage per mode
- **New high score detection** — celebratory toast on game over

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript (strict) |
| **Frontend** | React 18 |
| **Build** | Vite 6 |
| **Styling** | Tailwind CSS 3 + Custom CSS animations |
| **Rendering** | HTML5 Canvas 2D (custom engine) |
| **Audio** | Web Audio API (oscillators, no files) |
| **Font** | JetBrains Mono |
| **Deploy** | Vercel |

---

## 🚀 Deploy to Vercel

### Option 1: Vercel Web (recommended)

1. Push to GitHub:
   ```bash
   git push origin master
   ```
2. Go to [vercel.com](https://vercel.com), import the repo
3. Vercel auto-detects Vite — hit **Deploy**
4. You're live in ~30 seconds

### Option 2: Vercel CLI

```bash
npm install -g vercel
vercel --prod
```

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
neon-equation/
├── src/
│   ├── game/
│   │   ├── engine.ts        # Physics, particles, explosions, scoring, game modes
│   │   ├── expression.ts    # Math expression parser
│   │   ├── game.ts          # Game coordinator (loop + input + sound routing)
│   │   ├── renderer.ts      # Canvas 2D neon rendering pipeline
│   │   └── sound.ts         # Web Audio API programmatic SFX
│   ├── components/
│   │   └── GameCanvas.tsx    # React canvas wrapper with resize observer
│   ├── types.ts              # Shared types, neon color palette, game mode config
│   ├── App.tsx               # Main app: menu, playing, gameover screens
│   ├── main.tsx              # Entry point
│   └── index.css             # Tailwind + neon animations + glassmorphism
├── public/
│   └── favicon.svg           # Favicon
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── vercel.json
├── .gitignore
├── package.json
└── README.md
```

---

## 🧠 Architecture

### Game Loop
1. **Physics tick** — gravity, velocity, damping, wall/particle collisions, dt-capped
2. **Mode logic** — time attack countdown, target score check, game over detection
3. **Expression parser** — validates input, separates commands from math
4. **Destruction** — matching particles explode into sparks, score + combo updated
5. **Sound dispatch** — explosion, combo chime, miss, or command sound
6. **Screen shake** — intensity proportional to event magnitude, decays per frame
7. **Render** — multi-pass canvas: grid → sparks → trails → particle glow (3 layers) → value text → vignette

### Neon Rendering Pipeline
```
Background radial gradient → Grid lines (3% opacity) → Sparks → 
Particle trails (fading opacity) → Outer glow (30px blur) → 
Mid glow (20px blur) → Core body (15px blur) → 
White center core (60% opacity) → Value text (8px blur shadow) → 
Vignette overlay
```

### Sound Architecture
All sounds are **programmatically generated** using Web Audio API oscillators and noise buffers — zero audio files, zero network requests. AudioContext is initialized on first user interaction (autoplay policy compliance).

---

## 📸 Screenshots

*(Add screenshots after deploying)*

---

## 📄 License

MIT — build on it, ship it, have fun.
