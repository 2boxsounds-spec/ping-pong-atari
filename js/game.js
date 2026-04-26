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
  gameState: 'waiting', // 'waiting' | 'playing'
  serveSide: 0, // 0 = left, 1 = right
  canvas: null,
  ctx: null,
  W: 0,
  H: 0,
  paddles: [],
  ball: null,
  keys: {}
};

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
  window.addEventListener('keydown', e => {
    state.keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.gameState === 'waiting') serveBall();
    }
  });
  window.addEventListener('keyup', e => { state.keys[e.code] = false; });
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

function draw() {
  // Clear
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

// --- Game Loop ---
function loop() {
  movePaddles();
  moveBall();
  draw();
  requestAnimationFrame(loop);
}

// Export init function
export { state };
