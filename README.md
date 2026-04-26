# 🏓 Ping Pong 3+

Classic Atari-style Pong game with modern refinements. Built with vanilla HTML5 Canvas and JavaScript.

## Features

- **Classic Atari Aesthetic** - Black background, white paddles and ball, square ball design
- **Two Player** - Local multiplayer (same keyboard)
- **Smooth Gameplay** - 60fps capped animation loop
- **Realistic Physics** - Ball angle varies based on where it hits the paddle
- **Progressive Difficulty** - Ball speeds up with each hit (up to max speed)
- **Anti-Stuck System** - Ball never gets stuck in walls or clips through paddles

## Controls

| Player | Controls |
|--------|----------|
| Left Paddle | `W` (up) / `S` (down) |
| Right Paddle | `↑` (up) / `↓` (down) |
| Serve / Restart | `Space` |

## How to Play

1. Open `index.html` in any modern browser
2. Press `Space` to serve
3. First player to reach **11 points** wins
4. Press `Space` again to restart after a win

## Technical Details

- **No dependencies** - Pure HTML5, CSS, and vanilla JavaScript
- **Single file** - Everything in `index.html` (~6.6KB)
- **Responsive** - Centered on screen, works at any resolution
- **Cross-browser** - Works in Chrome, Firefox, Safari, Edge

## refinements (v3+)

This version includes advanced physics fixes not found in basic Pong clones:

- **Wall collision fix** - Ball is nudged 1px away from walls to prevent double-bounce traps
- **Paddle clipping prevention** - Leading edge collision detection prevents ball tunneling
- **Varied bounce angles** - Hit position on paddle affects reflection angle (±70°)
- **Random serve** - Each serve has slight vertical variation (±15°)
- **Speed progression** - Ball accelerates +0.4 per hit, capped at 12 units

## Development

Built using the **Malandro workflow**:
- DeepSeek (Expert mode) for initial code generation
- Claude Sonnet for validation and refinement
- Iterative testing and bug fixes

## License

Public domain - use freely for any purpose.

---

**Created:** 2026-04-26  
**Version:** 3.0+
