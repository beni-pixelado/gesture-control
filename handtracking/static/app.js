import {
  HandLandmarker,
  FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 620,
      height: 480,
    },
  });

  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
);

const handLandmarker = await HandLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath:
      "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  },
  runningMode: "VIDEO",
  numHands: 2,
});

await setupCamera();

video.play();

canvas.width = video.videoWidth;
canvas.height = video.videoHeight;

function drawPoint(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = "lime";
  ctx.fill();
}

async function detectHands() {
  const now = performance.now();

  const results = handLandmarker.detectForVideo(video, now);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const smoothPoints = {};
  if (results.landmarks) {
    results.landmarks.forEach((hand, handIndex) => {
      hand.forEach((point, pointIndex) => {
        const rawX = point.x * canvas.width;
        const rawY = point.y * canvas.height;

        const key = `${handIndex}-${pointIndex}`;

        if (!smoothPoints[key]) {
          smoothPoints[key] = {
            x: rawX,
            y: rawY,
          };
        }

        smoothPoints[key].x = smoothPoints[key].x * 0.9 + rawX * 0.1;

        smoothPoints[key].y = smoothPoints[key].y * 0.9 + rawY * 0.1;

        const x = smoothPoints[key].x;
        const y = smoothPoints[key].y;

        drawPoint(x, y);

        if (pointIndex === 8) {
          ctx.fillStyle = "red";
          ctx.font = "20px Arial";
          ctx.fillText(`Dedo ${handIndex + 1}`, x + 10, y);
        }

        const thumb = hand[4];
        const index = hand[8];

        const distance = Math.sqrt(
          Math.pow(index.x - thumb.x, 2) + Math.pow(index.y - thumb.y, 2),
        );

        const isPinching = distance < 0.05;

        const box = document.getElementById("box");
        if (isPinching) {
          const x = (1 - index.x) * 620;
          const y = index.y * 480;

          box.style.left = x + "px";
          box.style.top = y + "px";
        }

    //variable
    let dragging = false;


        if (isPinching && !dragging) {

    const rect = box.getBoundingClientRect();

    const fingerX = index.x * window.innerWidth;
    const fingerY = (1 - index.y) * window.innerHeight;

    if (
        fingerX >= rect.left &&
        fingerX <= rect.right &&
        fingerY >= rect.top &&
        fingerY <= rect.bottom
    ) {
        dragging = true;
    }

    if (!isPinching) {
    dragging = false;

    let offsetX = 0;
let offsetY = 0;

if (isPinching && !dragging) {
    dragging = true;

    const boxRect = box.getBoundingClientRect();

    offsetX = fingerX - boxRect.left;
    offsetY = fingerY - boxRect.top;
}

    if (dragging) {

    box.style.left = fingerX + "px";
    box.style.top = fingerY + "px";
}
}
}
      });
    });
  }

  requestAnimationFrame(detectHands);
}

detectHands();
