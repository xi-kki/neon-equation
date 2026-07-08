# 🎲 Neon Equation

**A math-powered physics sandbox with neon aesthetics.** Type mathematical expressions to destroy glowing particles, control gravity, and manipulate velocity in real-time. Every action triggers screen shake, neon explosions, and particle trails.

![License](https://img.shields.io/badge/license-MIT-green)
![Stack](https://img.shields.io/badge/stack-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-blue)

---

## 🎮 How to Play

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
- Use `spawn` to keep the combo going!

---

## ✨ Visual Features

- **Neon glow** — every particle has multi-layered glow effects
- **Motion trails** — particles leave fading neon trails
- **Screen shake** — proportional to explosion intensity
- **Explosion sparks** — burst effects on every destruction
- **Dark glassmorphism UI** — HUD overlays the canvas
- **Particle collisions** — realistic bounce physics

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript (strict) |
| **Frontend** | React 18 |
| **Build** | Vite 6 |
| **Styling** | Tailwind CSS 3 + Custom CSS |
| **Rendering** | HTML5 Canvas 2D |
| **Font** | JetBrains Mono |
| **Deploy** | Vercel |

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

## 🌐 Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Or manually:

```bash
npm install -g vercel
vercel --prod
```

---

## 📁 Project Structure

```
neon-equation/
├── src/
│   ├── game/
│   │   ├── engine.ts      # Physics, particles, explosions, scoring
│   │   ├── expression.ts  # Math expression parser
│   │   ├── game.ts        # Game coordinator (loop + input routing)
│   │   └── renderer.ts    # Canvas 2D neon rendering
│   ├── components/
│   │   └── GameCanvas.tsx  # React canvas wrapper
│   ├── types.ts           # Shared types + neon color palette
│   ├── App.tsx            # Main app with HUD + input
│   ├── main.tsx           # Entry point
│   └── index.css          # Tailwind + neon animations
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

## 🧠 How It Works

### Game Loop
1. **Physics tick** — gravity, velocity, damping, wall/particle collisions
2. **Expression parser** — validates input, separates commands from math
3. **Destruction** — matching particles explode into sparks, score updated
4. **Screen shake** — intensity proportional to event magnitude, decays per frame
5. **Render** — multiple canvas passes for glow, trails, sparks, vignette

### Neon Rendering Pipeline
```
Background gradient → Grid lines → Sparks → Trails → 
Particle outer glow → Particle mid glow → Particle core → 
Text label → Vignette overlay
```

Each particle uses 3 `shadowBlur` passes for the neon glow effect, plus a white center core for the bright spot.

---

## 📸 Screenshots

*(Add screenshots here after deploying)*

---

## 📄 License

MIT — build on it, ship it, have fun.
