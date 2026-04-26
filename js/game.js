// Pong Atari - Game Module
// Encapsulated game logic with ES6 module pattern

// --- Constants ---
const PADDLE_W = 12;
const PADDLE_H = 80;
const BALL_SIZE = 12;
const PADDLE_SPEED = 5;
const BALL_SPEED_INIT = 5;
const BALL_SPEED_MAX = 12;
const BALL_SPEED_INC = 0.4;
const WALL_MARGIN = 0;
const MAX_ANGLE_DEG = 70;
const SERVE_ANGLE_MAX = 15;

// --- Game State ---
const state = {
  scores: [0, 0],
  gameState: 'menu', // 'menu' | 'waiting' | 'playing'
  serveSide: 0, // 0 = left, 1 = right
  canvas: null,
  ctx: null,
  W: 0,
  H: 0,
  paddles: [],
  ball: null,
  keys: {},
  menuSelected: 0, // Index of selected menu item
  mouseHoverIndex: -1, // Track mouse hover over menu options
  mouseX: 0,
  mouseY: 0,
  showComingSoon: false, // Flag for placeholder message
  comingSoonTimer: null // Timer to auto-hide coming soon message
};

// --- Menu Options ---
const menuOptions = [
  { label: '1 Player', action: 'comingSoon' },
  { label: '2 Players', action: 'startGame' }
];

// --- Initialization ---
export function init(canvas) {
  state.canvas = canvas;
  state.ctx = canvas.getContext('2d');
  state.W = canvas.width;
  state.H = canvas.height;

  // Initialize paddles
  state.paddles = [
    { x: 30, y: state.H / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H, dy: 0 },
    { x: state.W - 30 - PADDLE_W, y: state.H / 2 - PADDLE_H / 2, w: PADDLE_W, h: PADDLE_H, dy: 0 }
  ];

  // Initialize ball
  state.ball = {
    x: state.W / 2 - BALL_SIZE / 2,
    y: state.H / 2 - BALL_SIZE / 2,
    w: BALL_SIZE,
    h: BALL_SIZE,
    vx: 0,
    vy: 0,
    speed: BALL_SPEED_INIT
  };

  // Setup input handlers
  setupInput();

  // Start game loop
  loop();
}

// --- Input Handling ---
function setupInput() {
  state.keys = {};
  
  // Keyboard input
  window.addEventListener('keydown', e => {
    state.keys[e.code] = true;
    
    // Menu input handling
    if (state.gameState === 'menu') {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        state.menuSelected = (state.menuSelected - 1 + menuOptions.length) % menuOptions.length;
        state.mouseHoverIndex = -1; // Clear mouse hover when using keyboard
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        state.menuSelected = (state.menuSelected + 1) % menuOptions.length;
        state.mouseHoverIndex = -1; // Clear mouse hover when using keyboard
      } else if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        selectMenuItem();
      }
    } else if (e.code === 'Space') {
      e.preventDefault();
      if (state.gameState === 'waiting') serveBall();
    }
  });
  window.addEventListener('keyup', e => { state.keys[e.code] = false; });
  
  // Mouse input for menu
  state.canvas.addEventListener('mousemove', e => {
    if (state.gameState !== 'menu') return;
    
    const rect = state.canvas.getBoundingClientRect();
    state.mouseX = e.clientX - rect.left;
    state.mouseY = e.clientY - rect.top;
    
    // Check if mouse is over any menu option
    const titleY = state.H / 2 - 120;
    const optionStartY = state.H / 2;
    const optionSpacing = 50;
    const fontSize = 32;
    
    state.mouseHoverIndex = -1;
    for (let i = 0; i < menuOptions.length; i++) {
      const optionY = optionStartY + i * optionSpacing;
      const textWidth = state.ctx.measureText(menuOptions[i].label).width;
      const textLeft = state.W / 2 - textWidth / 2 - 20; // Account for "> <" markers
      const textRight = state.W / 2 + textWidth / 2 + 20;
      const textTop = optionY - fontSize;
      const textBottom = optionY + 10;
      
      if (state.mouseX >= textLeft && state.mouseX <= textRight &&
          state.mouseY >= textTop && state.mouseY <= textBottom) {
        state.mouseHoverIndex = i;
        break;
      }
    }
  });
  
  state.canvas.addEventListener('click', e => {
    if (state.gameState !== 'menu') return;
    
    if (state.mouseHoverIndex !== -1) {
      state.menuSelected = state.mouseHoverIndex;
      selectMenuItem();
    }
  });
  
  // Add pointer cursor when hovering over menu
  state.canvas.addEventListener('mousemove', e => {
    if (state.gameState === 'menu' && state.mouseHoverIndex !== -1) {
      state.canvas.style.cursor = 'pointer';
    } else {
      state.canvas.style.cursor = 'default';
    }
  });
}

// --- Menu Selection ---
function selectMenuItem() {
  const selected = menuOptions[state.menuSelected];
  if (selected.action === 'startGame') {
    state.gameState = 'waiting';
  } else if (selected.action === 'comingSoon') {
    // Show placeholder message
    state.showComingSoon = true;
    
    // Clear any existing timer
    if (state.comingSoonTimer) {
      clearTimeout(state.comingSoonTimer);
    }
    
    // Auto-hide after 2 seconds
    state.comingSoonTimer = setTimeout(() => {
      state.showComingSoon = false;
    }, 2000);
  }
}

// --- Serve ---
function serveBall() {
  state.gameState = 'playing';
  state.ball.speed = BALL_SPEED_INIT;

  // Random vertical angle on serve (±SERVE_ANGLE_MAX degrees)
  const vertAngle = (Math.random() * 2 - 1) * SERVE_ANGLE_MAX;
  const vertRad = vertAngle * Math.PI / 180;

  // Direction: toward the side that just conceded (or random first serve)
  const dir = state.serveSide === 0 ? 1 : -1;

  state.ball.vx = dir * Math.cos(vertRad) * state.ball.speed;
  state.ball.vy = Math.sin(vertRad) * state.ball.speed;

  // Place ball at center
  state.ball.x = state.W / 2 - BALL_SIZE / 2;
  state.ball.y = state.H / 2 - BALL_SIZE / 2;
}

// --- Paddle Movement ---
function movePaddles() {
  // Left paddle: W / S
  if (state.keys['KeyW']) state.paddles[0].dy = -PADDLE_SPEED;
  else if (state.keys['KeyS']) state.paddles[0].dy = PADDLE_SPEED;
  else state.paddles[0].dy = 0;

  // Right paddle: ArrowUp / ArrowDown
  if (state.keys['ArrowUp']) state.paddles[1].dy = -PADDLE_SPEED;
  else if (state.keys['ArrowDown']) state.paddles[1].dy = PADDLE_SPEED;
  else state.paddles[1].dy = 0;

  for (let p of state.paddles) {
    p.y += p.dy;
    // Clamp paddle within walls
    p.y = Math.max(WALL_MARGIN, Math.min(state.H - WALL_MARGIN - p.h, p.y));
  }
}

// --- Ball Physics ---
function moveBall() {
  if (state.gameState !== 'playing') return;

  state.ball.x += state.ball.vx;
  state.ball.y += state.ball.vy;

  // Top wall collision
  if (state.ball.y <= WALL_MARGIN) {
    state.ball.y = WALL_MARGIN + 1;
    state.ball.vy = Math.abs(state.ball.vy);
  }

  // Bottom wall collision
  if (state.ball.y + state.ball.h >= state.H - WALL_MARGIN) {
    state.ball.y = state.H - WALL_MARGIN - state.ball.h - 1;
    state.ball.vy = -Math.abs(state.ball.vy);
  }

  // Left paddle collision
  const lp = state.paddles[0];
  if (
    state.ball.vx < 0 &&
    state.ball.x <= lp.x + lp.w &&
    state.ball.x + state.ball.w > lp.x &&
    state.ball.y + state.ball.h > lp.y &&
    state.ball.y < lp.y + lp.h
  ) {
    state.ball.x = lp.x + lp.w + 1;
    reflectOffPaddle(lp, 1);
  }

  // Right paddle collision
  const rp = state.paddles[1];
  if (
    state.ball.vx > 0 &&
    state.ball.x + state.ball.h >= rp.x &&
    state.ball.x < rp.x + rp.w &&
    state.ball.y + state.ball.h > rp.y &&
    state.ball.y < rp.y + rp.h
  ) {
    state.ball.x = rp.x - state.ball.w - 1;
    reflectOffPaddle(rp, -1);
  }

  // Scoring
  if (state.ball.x + state.ball.w < 0) {
    state.scores[1]++;
    state.serveSide = 0;
    resetBall();
  } else if (state.ball.x > state.W) {
    state.scores[0]++;
    state.serveSide = 1;
    resetBall();
  }
}

function reflectOffPaddle(paddle, dirX) {
  const paddleCenterY = paddle.y + paddle.h / 2;
  const ballCenterY = state.ball.y + state.ball.h / 2;
  const relHit = (ballCenterY - paddleCenterY) / (paddle.h / 2);
  const clampedHit = Math.max(-1, Math.min(1, relHit));

  const angleDeg = clampedHit * MAX_ANGLE_DEG;
  const angleRad = angleDeg * Math.PI / 180;

  state.ball.speed = Math.min(state.ball.speed + BALL_SPEED_INC, BALL_SPEED_MAX);

  state.ball.vx = dirX * Math.cos(angleRad) * state.ball.speed;
  state.ball.vy = Math.sin(angleRad) * state.ball.speed;
}

function resetBall() {
  state.gameState = 'waiting';
  state.ball.x = state.W / 2 - BALL_SIZE / 2;
  state.ball.y = state.H / 2 - BALL_SIZE / 2;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.ball.speed = BALL_SPEED_INIT;
}

// --- Rendering ---
function drawRect(x, y, w, h, color = '#fff') {
  state.ctx.fillStyle = color;
  state.ctx.fillRect(x, y, w, h);
}

function drawDashedCenterLine() {
  state.ctx.setLineDash([10, 10]);
  state.ctx.strokeStyle = '#555';
  state.ctx.lineWidth = 2;
  state.ctx.beginPath();
  state.ctx.moveTo(state.W / 2, 0);
  state.ctx.lineTo(state.W / 2, state.H);
  state.ctx.stroke();
  state.ctx.setLineDash([]);
}

function drawScores() {
  state.ctx.fillStyle = '#fff';
  state.ctx.font = 'bold 48px Courier New';
  state.ctx.textAlign = 'center';
  state.ctx.fillText(state.scores[0], state.W / 2 - 80, 60);
  state.ctx.fillText(state.scores[1], state.W / 2 + 80, 60);
}

function drawWaitingMessage() {
  if (state.gameState === 'waiting') {
    state.ctx.fillStyle = '#aaa';
    state.ctx.font = '18px Courier New';
    state.ctx.textAlign = 'center';
    state.ctx.fillText('Press SPACE to serve', state.W / 2, state.H - 30);
  }
}

// --- Menu Rendering ---
// --- Menu Background ---
function drawMenuBackground() {
  if (state.gameState !== 'menu') return;
  
  const ctx = state.ctx;
  const W = state.W;
  const H = state.H;
  
  // Retro gradient background (dark purple to black)
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, '#0a001a');
  gradient.addColorStop(0.5, '#000000');
  gradient.addColorStop(1, '#050010');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  
  // Draw retro grid pattern
  ctx.strokeStyle = 'rgba(180, 0, 255, 0.15)';
  ctx.lineWidth = 1;
  
  // Vertical grid lines (perspective effect)
  const centerX = W / 2;
  const vanishingY = H * 0.3; // Vanishing point
  for (let i = -10; i <= 10; i++) {
    const x = centerX + i * 60;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(centerX + i * 15, H);
    ctx.stroke();
  }
  
  // Horizontal grid lines (moving effect)
  const time = Date.now() * 0.0005; // Slow animation
  for (let i = 0; i < 15; i++) {
    const y = H * 0.3 + Math.pow((i + (time % 1)) / 15, 2) * (H * 0.7);
    if (y < H) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }
  
  // Add subtle scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 2);
  }
  
  // Add some stars in the upper portion
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  const starPositions = [
    [100, 80], [200, 120], [350, 60], [500, 100], [650, 70], [750, 130],
    [150, 150], [400, 140], [600, 160], [700, 110]
  ];
  starPositions.forEach(([sx, sy]) => {
    const twinkle = 0.5 + 0.5 * Math.sin(Date.now() * 0.003 + sx);
    ctx.globalAlpha = twinkle * 0.6;
    ctx.fillRect(sx, sy, 2, 2);
  });
  ctx.globalAlpha = 1.0;
}

// --- Menu Rendering ---
function drawMenu() {
  if (state.gameState !== 'menu') return;
  
  // Draw background first
  drawMenuBackground();
  
  // Title with glow effect
  state.ctx.shadowColor = '#00ffff';
  state.ctx.shadowBlur = 15;
  state.ctx.fillStyle = '#fff';
  state.ctx.font = 'bold 72px Courier New';
  state.ctx.textAlign = 'center';
  state.ctx.fillText('ATARI PONG', state.W / 2, state.H / 2 - 120);
  state.ctx.shadowBlur = 0;
  
  // Menu options
  state.ctx.font = 'bold 32px Courier New';
  menuOptions.forEach((option, index) => {
    const y = state.H / 2 + index * 50;
    const isSelected = index === state.menuSelected;
    const isHovered = index === state.mouseHoverIndex;
    
    if (isSelected || isHovered) {
      // Green highlight for selected/hovered
      state.ctx.fillStyle = '#0f0';
      state.ctx.shadowColor = '#0f0';
      state.ctx.shadowBlur = 10;
      state.ctx.fillText('> ' + option.label + ' <', state.W / 2, y);
      state.ctx.shadowBlur = 0;
    } else {
      state.ctx.fillStyle = '#fff';
      state.ctx.fillText(option.label, state.W / 2, y);
    }
  });
  
  // Coming Soon overlay
  if (state.showComingSoon) {
    // Semi-transparent overlay
    state.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    state.ctx.fillRect(state.W / 2 - 200, state.H / 2 - 40, 400, 80);
    
    // Border
    state.ctx.strokeStyle = '#ff0';
    state.ctx.lineWidth = 2;
    state.ctx.strokeRect(state.W / 2 - 200, state.H / 2 - 40, 400, 80);
    
    // Text
    state.ctx.fillStyle = '#ff0';
    state.ctx.font = 'bold 24px Courier New';
    state.ctx.textAlign = 'center';
    state.ctx.fillText('AI Opponent - WIP', state.W / 2, state.H / 2 + 5);
    state.ctx.font = '16px Courier New';
    state.ctx.fillStyle = '#fff';
    state.ctx.fillText('Coming Soon!', state.W / 2, state.H / 2 + 30);
  }
  
  // Controls info at bottom
  state.ctx.fillStyle = '#666';
  state.ctx.font = '16px Courier New';
  state.ctx.textAlign = 'center';
  state.ctx.fillText('↑/↓ or W/S = Navigate  |  SPACE/ENTER = Select', state.W / 2, state.H - 60);
  state.ctx.fillText('W/S = Left Paddle  |  ↑/↓ = Right Paddle  |  SPACE = Serve', state.W / 2, state.H - 35);
}

function draw() {
  // Clear - but skip if in menu (background drawn separately)
  if (state.gameState !== 'menu') {
    state.ctx.fillStyle = '#000';
    state.ctx.fillRect(0, 0, state.W, state.H);
    
    drawDashedCenterLine();
    drawScores();

    // Paddles
    for (let p of state.paddles) drawRect(p.x, p.y, p.w, p.h);

    // Ball
    drawRect(state.ball.x, state.ball.y, state.ball.w, state.ball.h);

    drawWaitingMessage();
  }

  drawMenu();
}

// --- Game Loop ---
function loop() {
  movePaddles();
  moveBall();
  draw();
  requestAnimationFrame(loop);
}

// Export init function
export { state };
