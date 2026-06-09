import {
    HandLandmarker,
    FilesetResolver,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let handLandmarker = null;

let lastTime = 0;

export const handState = {
    ready: false,

    detected: false,

    fingerX: 0,
    fingerY: 0,

    pinch: false,

    landmarks: null,
};

function distance(a, b) {
    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );
}

async function setupCamera() {
    const stream =
        await navigator.mediaDevices.getUserMedia({
            video: {
                width: 640,
                height: 480,
            },
        });

    video.srcObject = stream;

    await new Promise(resolve => {
        video.onloadedmetadata = resolve;
    });

    await video.play();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

async function setupModel() {
    const vision =
        await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

    handLandmarker =
        await HandLandmarker.createFromOptions(
            vision,
            {
                baseOptions: {
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
                },

                runningMode: "VIDEO",

                numHands: 1,
            }
        );
}

function drawBone(x1, y1, x2, y2) {
    ctx.beginPath();

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    ctx.strokeStyle = "#1976d2";
    ctx.lineWidth = 2;

    ctx.stroke();
}


function loop() {
    requestAnimationFrame(loop);

    if (!handLandmarker) {
        return;
    }

    if (video.readyState < 2) {
        return;
    }

    const result =
        handLandmarker.detectForVideo(
            video,
            performance.now()
        );

    const hand =
        result.landmarks?.[0];

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (!hand) {
        handState.detected = false;
        handState.landmarks = null;
        handState.pinch = false;
        return;
    }

    

    handState.detected = true;

    const points = hand.map(point => ({
        x: (1 - point.x) * canvas.width,
        y: point.y * canvas.height,
    }));

    const center = points[0]; // pulso

const scale = 0.3;

const scaledPoints = points.map(p => ({
    x: center.x + (p.x - center.x) * scale,
    y: center.y + (p.y - center.y) * scale,
}));

    handState.landmarks = scaledPoints;

    const bones = [
        [0,1],[1,2],[2,3],[3,4],
        [0,5],[5,6],[6,7],[7,8],
        [0,9],[9,10],[10,11],[11,12],
        [0,13],[13,14],[14,15],[15,16],
        [0,17],[17,18],[18,19],[19,20],
    ];

    bones.forEach(([a, b]) => {
        drawBone(
            points[a].x,
            points[a].y,
            points[b].x,
            points[b].y
        );
    });

    const tips = [4, 8, 12, 16, 20];

    ctx.fillStyle = "#1976d2";

    tips.forEach(index => {
        ctx.beginPath();

        ctx.arc(
            points[index].x,
            points[index].y,
            6,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });

    const thumb = points[4];
    const index = points[8];

    handState.fingerX = index.x;
    handState.fingerY = index.y;

    handState.pinch =
        distance(
            thumb,
            index
        ) < 40;

    
}

async function init() {
    await setupCamera();

    await setupModel();

    handState.ready = true;

    loop();
}

init();

window.addEventListener(
    "resize",
    () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
);