// js/content_script.js

// Check if the main listener and elements are already set up
if (typeof window.exploratoryTestingCropperInitialized === 'undefined') {
    window.exploratoryTestingCropperInitialized = true;

    let selectionBox = null; // Will hold the div element
    let isDrawing = false;   // True when mouse is down and dragging
    let startX, startY;      // Initial mouse coordinates on mousedown
    let selectionInstructionNotification = null; // For the notification message

    // Store data received from popup
    let currentAnnotationType = null;
    let currentDescription = null;

    // Helper function to check if extension context is valid
    function isExtensionContextValid() {
        try {
            // Multiple checks to ensure extension context is valid
            if (!chrome || !chrome.runtime) {
                return false;
            }

            // Check if runtime.id exists
            if (chrome.runtime.id === undefined) {
                return false;
            }

            // Try to access sendMessage to ensure it's available
            if (typeof chrome.runtime.sendMessage !== 'function') {
                return false;
            }

            // Additional check: try to get the URL (this will fail if context is invalid)
            try {
                chrome.runtime.getURL('');
                return true;
            } catch (e) {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    // Helper function to safely send messages to background
    function safeSendMessage(message, callback) {
        // Comprehensive validation before attempting to send
        if (!isExtensionContextValid()) {
            // Silently show notification without console warnings
            showExtensionReloadNotification();
            return;
        }

        try {
            chrome.runtime.sendMessage(message, function(response) {
                // Handle async errors from chrome.runtime.lastError
                if (chrome.runtime.lastError) {
                    const errorMessage = chrome.runtime.lastError.message;
                    if (errorMessage.includes("Extension context invalidated") ||
                        errorMessage.includes("message port closed") ||
                        errorMessage.includes("receiving end does not exist")) {
                        // Silently show notification without console warnings
                        showExtensionReloadNotification();
                    } else {
                        console.error("Content script: Error sending message:", errorMessage);
                    }
                } else if (callback) {
                    callback(response);
                }
            });
        } catch (error) {
            // Catch synchronous errors
            if (error.message && (error.message.includes("Extension context invalidated") ||
                                  error.message.includes("message port closed"))) {
                // Silently show notification without console warnings
                showExtensionReloadNotification();
            } else {
                console.error("Content script: Unexpected error sending message:", error);
            }
        }
    }

    // Show notification to reload page when extension context is invalidated
    function showExtensionReloadNotification() {
        // Notification disabled - function does nothing
        // Errors are handled silently without user notification
    }

    // This listener is added once per page load/script injection context
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "startSelection") {
            console.log("Content script: 'startSelection' message received with type:", request.annotationType, "and description:", request.description ? request.description.substring(0, 50) + "..." : "N/A");

            // Check if extension context is valid
            if (!isExtensionContextValid()) {
                // Silently show notification without console warnings
                showExtensionReloadNotification();
                return true;
            }

            // Store annotation details
            currentAnnotationType = request.annotationType;
            currentDescription = request.description;

            isDrawing = false;
            if (selectionBox) { // Hide if it exists from a previous attempt
                selectionBox.style.display = 'none';
            }
            initSelection(); // Prepare for a new selection
            sendResponse({ status: "selectionStarted" }); // Response back to popup.js
        }
        // For safety with multiple potential message types, keeping 'return true;'
        // as other handlers (if added in the future) might use sendResponse asynchronously.
        return true;
    });

    function createSelectionBoxElement() {
        // Check if the element already exists
        let existingBox = document.getElementById('exploratoryTestingSelectionBox');
        if (!existingBox) {
            let box = document.createElement('div');
            box.id = 'exploratoryTestingSelectionBox';
            box.style.position = 'fixed';
            box.style.backgroundColor = 'rgba(0, 100, 255, 0.3)';
            box.style.border = '1px dashed #0064ff';
            box.style.zIndex = '2147483647'; // Max z-index
            box.style.cursor = 'crosshair';
            box.style.pointerEvents = 'none';
            box.style.display = 'none';
            document.body.appendChild(box);
            return box;
        }
        return existingBox;
    }

    function showSelectionNotification(message) {
        removeSelectionNotification();
        selectionInstructionNotification = document.createElement('div');
        selectionInstructionNotification.id = 'exploratoryTestingSelectionNotification';
        selectionInstructionNotification.textContent = message;
        selectionInstructionNotification.style.position = 'fixed';
        selectionInstructionNotification.style.top = '20px';
        selectionInstructionNotification.style.left = '50%';
        selectionInstructionNotification.style.transform = 'translateX(-50%)';
        selectionInstructionNotification.style.padding = '10px 20px';
        selectionInstructionNotification.style.backgroundColor = 'rgba(0,0,0,0.75)';
        selectionInstructionNotification.style.color = 'white';
        selectionInstructionNotification.style.fontSize = '16px';
        selectionInstructionNotification.style.borderRadius = '5px';
        selectionInstructionNotification.style.zIndex = '2147483646';
        selectionInstructionNotification.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        document.body.appendChild(selectionInstructionNotification);
    }

    function removeSelectionNotification() {
        if (selectionInstructionNotification && selectionInstructionNotification.parentNode) {
            selectionInstructionNotification.parentNode.removeChild(selectionInstructionNotification);
            selectionInstructionNotification = null;
        }
    }

    function initSelection() {
        if (!selectionBox) {
            console.error("Selection box element not found or created!");
            return;
        }
        selectionBox.style.left = '0px';
        selectionBox.style.top = '0px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'none';

        cleanUpAllSelectionListeners();
        removeSelectionNotification();
        showSelectionNotification("Click and drag to select an area. Press Esc to cancel.");

        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown);
        console.log("Content script: Initialized for new selection. Mousedown and keydown listeners added. Notification shown.");
    }

    function handleMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();

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
        console.log("Content script: Mouse down, drawing started.");
    }

    function handleMouseMove(event) {
        if (!isDrawing) return;
        event.preventDefault();
        event.stopPropagation();

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
        event.stopPropagation();

        console.log("Content script: Mouse up, drawing ended.");
        cleanUpInProgressSelectionListeners();

        let finalX = parseInt(selectionBox.style.left, 10);
        let finalY = parseInt(selectionBox.style.top, 10);
        let finalWidth = parseInt(selectionBox.style.width, 10);
        let finalHeight = parseInt(selectionBox.style.height, 10);

        // Hide selection box and notification IMMEDIATELY
        if (selectionBox) selectionBox.style.display = 'none';
        removeSelectionNotification();

        if (finalWidth > 0 && finalHeight > 0) {
            // Wait for the browser to re-render without the selection box
            // This ensures the screenshot won't include the blue overlay
            requestAnimationFrame(() => {
                setTimeout(() => {
                    // Capture the selected area and open annotation editor
                    captureAndOpenAnnotationEditor(finalX, finalY, finalWidth, finalHeight);
                }, 50); // Wait 50ms for the DOM to fully update
            });
        } else {
            console.log("Content script: Selection was too small or invalid.");
            safeSendMessage({
                type: "selectionCancelled",
                annotationType: currentAnnotationType
            });
            // Reset stored type and description
            currentAnnotationType = null;
            currentDescription = null;
        }
    }

    // Capture the cropped area and open the annotation editor
    function captureAndOpenAnnotationEditor(x, y, width, height) {
        const dpr = window.devicePixelRatio || 1;

        // Request screenshot from background
        safeSendMessage({
            type: "requestCropScreenshot",
            coordinates: {
                x: x * dpr,
                y: y * dpr,
                width: width * dpr,
                height: height * dpr
            }
        }, (response) => {
            if (response && response.croppedImageData) {
                // Open annotation editor with the cropped image
                openAnnotationEditor(response.croppedImageData);
            } else {
                console.error("Content script: Failed to get cropped screenshot");
                safeSendMessage({
                    type: "selectionCancelled",
                    annotationType: currentAnnotationType
                });
                currentAnnotationType = null;
                currentDescription = null;
            }
        });
    }

    // Open annotation editor overlay
    function openAnnotationEditor(imageData) {
        // Create iframe for annotation editor
        const iframe = document.createElement('iframe');
        iframe.id = 'exploratoryTestingAnnotationEditor';
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.zIndex = '2147483647';
        iframe.src = chrome.runtime.getURL('js/annotation_editor.html');

        document.body.appendChild(iframe);

        // Wait for iframe to load, then send image data
        iframe.addEventListener('load', () => {
            iframe.contentWindow.postMessage({
                type: 'initAnnotationEditor',
                imageData: imageData
            }, '*');
        });

        // Listen for messages from annotation editor
        const messageHandler = (event) => {
            if (event.data.type === 'annotationComplete') {
                // Close editor
                closeAnnotationEditor();

                // Send annotated image to background
                safeSendMessage({
                    type: "csToBgCropData",
                    annotatedImageData: event.data.imageData,
                    annotationType: currentAnnotationType,
                    description: currentDescription
                });

                console.log("Content script: Sent annotated crop data to background");

                // Reset and cleanup
                currentAnnotationType = null;
                currentDescription = null;
                window.removeEventListener('message', messageHandler);
            } else if (event.data.type === 'annotationCancelled') {
                // Close editor and cancel
                closeAnnotationEditor();

                safeSendMessage({
                    type: "selectionCancelled",
                    annotationType: currentAnnotationType
                });

                // Reset and cleanup
                currentAnnotationType = null;
                currentDescription = null;
                window.removeEventListener('message', messageHandler);
            }
        };

        window.addEventListener('message', messageHandler);
    }

    // Close annotation editor
    function closeAnnotationEditor() {
        const iframe = document.getElementById('exploratoryTestingAnnotationEditor');
        if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
        }
    }

    function handleKeyDown(event) {
        if (event.key === 'Escape') {
            console.log("Content script: Escape key pressed.");
            if (isDrawing) {
                isDrawing = false;
                console.log("Content script: Cancelling active drawing.");
            }
            if (selectionBox) selectionBox.style.display = 'none';
            cleanUpAllSelectionListeners();
            removeSelectionNotification();

            safeSendMessage({
                type: "selectionCancelled",
                annotationType: currentAnnotationType // Include type
            });
            console.log("Content script: Selection cancelled via Escape. Sent 'selectionCancelled' for type:", currentAnnotationType);
            // Reset stored type and description
            currentAnnotationType = null;
            currentDescription = null;
        }
    }

    function cleanUpInProgressSelectionListeners() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        console.log("Content script: Cleaned up mousemove and mouseup listeners.");
    }

    function cleanUpAllSelectionListeners() {
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('keydown', handleKeyDown);
        console.log("Content script: Cleaned up all selection listeners (mousedown, mousemove, mouseup, keydown).");
    }

    // Initial creation of the selection box
    selectionBox = createSelectionBoxElement();

}
else {
    console.log("Content script: Already initialized. Waiting for 'startSelection' message.");
}
