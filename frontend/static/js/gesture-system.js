import { handState } from "./mediapipe-core.js";

const cursor =
    document.getElementById("cursor");

let previousPinch = false;

let hoveredElement = null;

function moveCursor() {
    cursor.style.left =
        handState.fingerX + "px";

    cursor.style.top =
        handState.fingerY + "px";
}

function getTarget() {
    return document.elementFromPoint(
        handState.fingerX,
        handState.fingerY
    );
}

function updateHover() {

    if (hoveredElement) {
        hoveredElement.classList.remove(
            "gesture-hover"
        );
    }

    const element =
        getTarget();

    if (!element) {
        hoveredElement = null;
        return;
    }

    hoveredElement =
        element.closest(
            "[data-gesture-click]"
        );

    if (!hoveredElement) {
        return;
    }

    hoveredElement.classList.add(
        "gesture-hover"
    );
}

function performClick() {

    if (!hoveredElement) {
        return;
    }

    hoveredElement.click();
}

function updateClick() {

    const pinchStart =
        handState.pinch &&
        !previousPinch;

    if (pinchStart) {
        performClick();
    }

    previousPinch =
        handState.pinch;
}

function loop() {
    requestAnimationFrame(loop);
    
    if (!handState.ready) {
        return;
    }

    if (!handState.detected) {
        return;
    }

    moveCursor();

    if (handState.pinch) {
    cursor.classList.add("pinching");
} else {
    cursor.classList.remove("pinching");
}

    updateHover();

    updateClick();
}

loop();