// js/content_script.js

let selectionBox = null;
let isDrawing = false;
let startX, startY;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "startSelection") {
        // Initialize selection mode
        console.log("Content script: Start selection message received.");
        initSelection();
        // It might be useful to send a response indicating selection has started
        sendResponse({status: "selectionStarted"});
    }
    return true; // Keep message channel open for async response if needed later
});

function initSelection() {
    // Create selectionBox div if it doesn't exist
    if (!selectionBox) {
        selectionBox = document.createElement('div');
        selectionBox.style.position = 'fixed';
        selectionBox.style.backgroundColor = 'rgba(0, 100, 255, 0.3)';
        selectionBox.style.border = '1px dashed #0064ff';
        selectionBox.style.zIndex = '999999'; // Very high z-index
        selectionBox.style.cursor = 'crosshair';
        selectionBox.style.pointerEvents = 'none'; // Make sure it doesn't capture mouse events meant for elements underneath, initially
        document.body.appendChild(selectionBox);
    }
    selectionBox.style.display = 'none'; // Hide it initially

    // Add listeners to the document for drawing
    document.addEventListener('mousedown', handleMouseDown, { once: false }); // `once: false` might not be needed if we remove it correctly
}

function handleMouseDown(event) {
    // Prevent default only if we are truly starting a drag for our tool
    // For now, let's assume any mousedown starts drawing once initSelection is called
    event.preventDefault();

    isDrawing = true;
    startX = event.clientX;
    startY = event.clientY;

    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(event) {
    if (!isDrawing) return;
    event.preventDefault();

    let currentX = event.clientX;
    let currentY = event.clientY;

    let newX = Math.min(startX, currentX);
    let newY = Math.min(startY, currentY);
    let width = Math.abs(currentX - startX);
    let height = Math.abs(currentY - startY);

    selectionBox.style.left = newX + 'px';
    selectionBox.style.top = newY + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
}

function handleMouseUp(event) {
    if (!isDrawing) return;
    isDrawing = false;
    event.preventDefault();

    // Remove drawing listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    // Crucially, remove the mousedown listener too, so it doesn't keep firing
    document.removeEventListener('mousedown', handleMouseDown);


    let finalX = parseInt(selectionBox.style.left, 10);
    let finalY = parseInt(selectionBox.style.top, 10);
    let finalWidth = parseInt(selectionBox.style.width, 10);
    let finalHeight = parseInt(selectionBox.style.height, 10);

    selectionBox.style.display = 'none'; // Hide the selection box

    // Ensure width and height are positive
    if (finalWidth > 0 && finalHeight > 0) {
        chrome.runtime.sendMessage({
            type: "selectionCoordinates",
            coordinates: {
                x: finalX,
                y: finalY,
                width: finalWidth,
                height: finalHeight
            }
        });
        console.log("Content script: Sent coordinates:", { finalX, finalY, finalWidth, finalHeight });
    } else {
        console.log("Content script: Selection was too small or invalid.");
        // Optionally send a failure or cancellation message back
    }
}

// Optional: Add a way to cancel selection, e.g., pressing Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isDrawing) {
        isDrawing = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousedown', handleMouseDown);
        if (selectionBox) {
            selectionBox.style.display = 'none';
        }
        console.log("Content script: Selection cancelled by Escape key.");
        // Optionally send a cancellation message
        chrome.runtime.sendMessage({ type: "selectionCancelled" });
    }
});
