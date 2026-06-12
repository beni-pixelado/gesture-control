import { handState } from "./mediapipe-core.js";

const box = document.getElementById("box");
const handle = document.getElementById("handle");

let dragging = false;
let resizing = false;
let selected = false;

let dragOffsetX = 0;
let dragOffsetY = 0;

let previousPinch = false;

function isInside(x, y, rect) {
    return (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
    );
}

function updateVisual() {
    box.style.background =
        selected
            ? "rgba(25,118,210,.25)"
            : "rgba(25,118,210,.12)";

    box.style.border =
        selected
            ? "3px solid #1976d2"
            : "2px solid #1976d2";
}

function startSelection() {
    const boxRect =
        box.getBoundingClientRect();

    const handleRect =
        handle.getBoundingClientRect();

    const insideBox =
        isInside(
            handState.fingerX,
            handState.fingerY,
            boxRect
        );

    const insideHandle =
        isInside(
            handState.fingerX,
            handState.fingerY,
            handleRect
        );

    if (!insideBox) {
        return;
    }

    if (!insideHandle) {
        selected = !selected;
        updateVisual();
    }
}

function startDrag() {
    if (!selected) return;

    const boxRect =
        box.getBoundingClientRect();

    if (
        !isInside(
            handState.fingerX,
            handState.fingerY,
            boxRect
        )
    ) {
        return;
    }

    dragOffsetX =
        handState.fingerX -
        boxRect.left;

    dragOffsetY =
        handState.fingerY -
        boxRect.top;

    dragging = true;
}

function updateDrag() {
    if (!dragging) return;

    box.style.left =
        handState.fingerX -
        dragOffsetX +
        "px";

    box.style.top =
        handState.fingerY -
        dragOffsetY +
        "px";
}

function startResize() {
    const handleRect =
        handle.getBoundingClientRect();

    const insideHandle =
        isInside(
            handState.fingerX,
            handState.fingerY,
            handleRect
        );

    if (!insideHandle) {
        return;
    }

    resizing = true;
}

function updateResize() {
    if (!resizing) return;

    const rect =
        box.getBoundingClientRect();

    const centerX =
        rect.left +
        rect.width / 2;

    const centerY =
        rect.top +
        rect.height / 2;

    const size =
        Math.max(
            60,
            Math.min(
                400,
                Math.hypot(
                    handState.fingerX - centerX,
                    handState.fingerY - centerY
                ) * 2
            )
        );

    box.style.width =
        size + "px";

    box.style.height =
        size + "px";
}

function stopActions() {
    dragging = false;
    resizing = false;
}

function loop() {
    requestAnimationFrame(loop);

    if (!handState.detected) {
        return;
    }

    const pinchStart =
        handState.pinch &&
        !previousPinch;

    const pinchEnd =
        !handState.pinch &&
        previousPinch;

    if (pinchStart) {

        startSelection();

        startResize();

        if (!resizing) {
            startDrag();
        }
    }

    if (handState.pinch) {

        updateDrag();

        updateResize();
    }

    if (pinchEnd) {
        stopActions();
    }

    previousPinch =
        handState.pinch;
}

updateVisual();

loop();