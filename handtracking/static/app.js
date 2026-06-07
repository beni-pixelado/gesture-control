import {
  HandLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const box = document.getElementById("box");
const handle = document.getElementById("handle");

let handLandmarker = null;

// STATE
let selected = false;
let dragging = false;
let resizing = false;

let pinchState = 'idle';
let pinchStateTime = 0;
const DOUBLE_PINCH_WINDOW = 600;

let pinchFrames = 0;
let prevPinchFrames = 0;

let offsetX = 0;
let offsetY = 0;

let boxSize = 100;
let lastSelectTime = 0;

function updateBoxStyle() {
  box.style.backgroundColor = selected
    ? "rgba(0, 120, 255, 0.35)"
    : "rgba(255, 255, 255, 0.2)";

  box.style.border = selected
    ? "2px solid rgba(0, 140, 255, 0.9)"
    : "2px solid rgba(255, 255, 255, 0.4)";

  handle.style.display = selected ? "block" : "none";
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 640, height: 480 },
  });

  video.srcObject = stream;

  await new Promise(r => (video.onloadedmetadata = r));
  await video.play();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

async function setupModel() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    },
    runningMode: "VIDEO",
    numHands: 1,
  });
}

function drawBone(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function isInsideRect(fx, fy, rect) {
  return (
    fx >= rect.left &&
    fx <= rect.right &&
    fy >= rect.top &&
    fy <= rect.bottom
  );
}

function loop() {
  requestAnimationFrame(loop);

  if (!handLandmarker || video.readyState < 2) return;

  const res = handLandmarker.detectForVideo(video, performance.now());
  const hand = res.landmarks?.[0];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!hand) {
    prevPinchFrames = 0;
    pinchFrames = 0;
    pinchState = 'idle';
    dragging = false;
    resizing = false;
    return;
  }

  // Espelha X para coincidir com o vídeo espelhado via CSS
  const pts = hand.map(p => ({
    x: (1 - p.x) * canvas.width,
    y: p.y * canvas.height,
  }));

  // ESQUELETO
  const bones = [
    [0,1],[1,2],[2,3],[3,4],
    [0,5],[5,6],[6,7],[7,8],
    [0,9],[9,10],[10,11],[11,12],
    [0,13],[13,14],[14,15],[15,16],
    [0,17],[17,18],[18,19],[19,20],
  ];

  bones.forEach(([a, b]) => {
    drawBone(pts[a].x, pts[a].y, pts[b].x, pts[b].y);
  });

  // PONTAS DOS DEDOS
  const tips = [4, 8, 12, 16, 20];
  ctx.fillStyle = "lime";
  tips.forEach(i => {
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  const thumb = pts[4];
  const index = pts[8];
  const pinch = dist(thumb, index) < 40;
  const now = performance.now();

  // Coordenadas do dedo em viewport
  const canvasRect = canvas.getBoundingClientRect();
  const scaleX = canvasRect.width / canvas.width;
  const scaleY = canvasRect.height / canvas.height;

  const fingerViewX = canvasRect.left + index.x * scaleX;
  const fingerViewY = canvasRect.top + index.y * scaleY;

  const boxRect = box.getBoundingClientRect();
  const handleRect = handle.getBoundingClientRect();

  const inside = isInsideRect(fingerViewX, fingerViewY, boxRect);

  // Área de toque do handle expandida em 30px para facilitar o gesto
  const handleHit = {
    left:   handleRect.left   - 30,
    right:  handleRect.right  + 30,
    top:    handleRect.top    - 30,
    bottom: handleRect.bottom + 30,
  };
  const onHandle = isInsideRect(fingerViewX, fingerViewY, handleHit);

  // ─────────────────────────────────────────
  // PINCH EDGES
  // ─────────────────────────────────────────
  prevPinchFrames = pinchFrames;

  if (pinch) {
    pinchFrames++;
  } else {
    pinchFrames = 0;
  }

  const pinchStart = pinch && prevPinchFrames === 0;
  const pinchEnd   = !pinch && prevPinchFrames > 0;

  // Timeout do double pinch
  if (pinchState !== 'idle' && now - pinchStateTime > DOUBLE_PINCH_WINDOW) {
    pinchState = 'idle';
  }

  // ─────────────────────────────────────────
  // MÁQUINA DE ESTADOS — DOUBLE PINCH
  // ─────────────────────────────────────────
  switch (pinchState) {
    case 'idle':
      if (pinchStart) {
        pinchState = 'first_down';
        pinchStateTime = now;
      }
      break;

    case 'first_down':
      if (pinchEnd) {
        pinchState = 'first_up';
        pinchStateTime = now;
      }
      break;

    case 'first_up':
      if (pinchStart) {
        pinchState = 'second_down';
        pinchStateTime = now;
      }
      break;

    case 'second_down':
      if (pinchEnd) {
        if (inside && !onHandle) {
          selected = !selected;
          updateBoxStyle();
          lastSelectTime = now;
        }
        pinchState = 'idle';
      }
      break;
  }

  // ─────────────────────────────────────────
  // RESIZE — pinch no handle e arrastar
  // ─────────────────────────────────────────
  if (pinchStart && onHandle) {
    resizing = true;
  }

  if (resizing && pinch) {
    const cx = boxRect.left + boxRect.width / 2;
    const cy = boxRect.top + boxRect.height / 2;

    const d = Math.hypot(fingerViewX - cx, fingerViewY - cy);

    // Tamanho = distância do centro ao dedo * 2, com limites
    boxSize = Math.min(Math.max(d * 2, 50), 400);

    box.style.width  = boxSize + "px";
    box.style.height = boxSize + "px";
  }

  if (!pinch) resizing = false;

  // ─────────────────────────────────────────
  // DRAG
  // ─────────────────────────────────────────
  const selectCooldown = now - lastSelectTime > 200;

  if (pinch && selected && !dragging && inside && !onHandle && !resizing && selectCooldown) {
    dragging = true;
    offsetX = fingerViewX - boxRect.left;
    offsetY = fingerViewY - boxRect.top;
  }

  if (dragging && selected && pinch) {
    const containerRect = canvas.parentElement.getBoundingClientRect();
    box.style.left = (fingerViewX - offsetX - containerRect.left) + "px";
    box.style.top  = (fingerViewY - offsetY - containerRect.top)  + "px";
  }

  if (!pinch) dragging = false;
}

async function init() {
  await setupCamera();
  await setupModel();
  updateBoxStyle();
  loop();
}

init();