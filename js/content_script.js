// js/content_script.js

// Check if the main listener and elements are already set up
if (typeof window.exploratoryTestingCropperInitialized === 'undefined') {
    window.exploratoryTestingCropperInitialized = true;

    let selectionBox = null; // Will hold the div element
    let isDrawing = false;   // True when mouse is down and dragging
    let startX, startY;      // Initial mouse coordinates on mousedown
    let selectionInstructionNotification = null; // For the notification message

    // This listener is added once per page load/script injection context
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "startSelection") {
            console.log("Content script: 'startSelection' message received.");
            // Reset state for a new selection attempt
            isDrawing = false; 
            if (selectionBox) { // Hide if it exists from a previous attempt
                selectionBox.style.display = 'none';
            }
            initSelection(); // Prepare for a new selection
            sendResponse({ status: "selectionStarted" });
        }
        return true; // Indicate async response capability
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
            box.style.pointerEvents = 'none'; // So it doesn't interfere with mouse events on underlying page elements
            box.style.display = 'none';       // Initially hidden
            document.body.appendChild(box);
            return box;
        }
        return existingBox;
    }

    // Create or get the selection box element once during initial setup
    selectionBox = createSelectionBoxElement();

    function showSelectionNotification(message) {
        // Remove any existing notification first
        removeSelectionNotification();

        selectionInstructionNotification = document.createElement('div');
        selectionInstructionNotification.id = 'exploratoryTestingSelectionNotification';
        selectionInstructionNotification.textContent = message;
        // Styling:
        selectionInstructionNotification.style.position = 'fixed';
        selectionInstructionNotification.style.top = '20px';
        selectionInstructionNotification.style.left = '50%';
        selectionInstructionNotification.style.transform = 'translateX(-50%)';
        selectionInstructionNotification.style.padding = '10px 20px';
        selectionInstructionNotification.style.backgroundColor = 'rgba(0,0,0,0.75)';
        selectionInstructionNotification.style.color = 'white';
        selectionInstructionNotification.style.fontSize = '16px';
        selectionInstructionNotification.style.borderRadius = '5px';
        selectionInstructionNotification.style.zIndex = '2147483646'; // Just below selectionBox
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
        // Ensure selectionBox is available (it should be due to the line above)
        if (!selectionBox) {
            console.error("Selection box element not found or created!");
            return;
        }
        
        // Reset visual state of the selection box
        selectionBox.style.left = '0px';
        selectionBox.style.top = '0px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'none';

        // Remove any listeners from previous selection attempts to prevent stacking
        cleanUpAllSelectionListeners();
        
        removeSelectionNotification(); // Remove any old notification
        showSelectionNotification("Click and drag to select an area. Press Esc to cancel.");


        // Add listeners for starting a new selection
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('keydown', handleKeyDown); // For Escape key
        console.log("Content script: Initialized for new selection. Mousedown and keydown listeners added. Notification shown.");
    }

    function handleMouseDown(event) {
        // Only proceed if the click is for starting selection (e.g., not on an input field if we want to be more specific later)
        // For now, any mousedown after initSelection starts drawing.
        event.preventDefault();   // Prevent default browser actions like text selection
        event.stopPropagation();  // Stop event from bubbling up

        isDrawing = true;
        startX = event.clientX;
        startY = event.clientY;

        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block'; // Make it visible

        // Add listeners for dragging and mouse up, specific to this drawing instance
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

        // Calculate position and dimensions
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
        if (!isDrawing) return; // Should not happen if listeners are managed correctly
        isDrawing = false;
        event.preventDefault();
        event.stopPropagation();

        console.log("Content script: Mouse up, drawing ended.");
        cleanUpInProgressSelectionListeners(); // Remove move/up listeners

        let finalX = parseInt(selectionBox.style.left, 10);
        let finalY = parseInt(selectionBox.style.top, 10);
        let finalWidth = parseInt(selectionBox.style.width, 10);
        let finalHeight = parseInt(selectionBox.style.height, 10);

        // Important: keep the selection box hidden but don't remove mousedown/keydown yet,
        // as another 'startSelection' message might come for a new crop.
        // The mousedown/keydown are cleaned by cleanUpAllSelectionListeners() in initSelection()
        // or by handleKeyDown if escape is pressed.

        if (finalWidth > 0 && finalHeight > 0) {
            chrome.runtime.sendMessage({
                type: "selectionCoordinates",
                coordinates: { x: finalX, y: finalY, width: finalWidth, height: finalHeight }
            });
            console.log("Content script: Sent coordinates:", { x: finalX, y: finalY, width: finalWidth, height: finalHeight });
        } else {
            console.log("Content script: Selection was too small or invalid.");
            chrome.runtime.sendMessage({ type: "selectionCancelled" });
        }
        // Do NOT hide selectionBox here, popup.js might need it if we decide to show it briefly.
        // Or rather, it should be hidden. The next initSelection will handle it.
        selectionBox.style.display = 'none';
        // The main mousedown and keydown listeners are removed by the next call to initSelection or by handleKeyDown.
        removeSelectionNotification();
    }

    function handleKeyDown(event) {
        if (event.key === 'Escape') {
            console.log("Content script: Escape key pressed.");
            if (isDrawing) { // If drawing is in progress
                isDrawing = false;
                console.log("Content script: Cancelling active drawing.");
            }
            selectionBox.style.display = 'none';
            cleanUpAllSelectionListeners(); // Remove all listeners
            removeSelectionNotification(); // Remove notification on cancel
            chrome.runtime.sendMessage({ type: "selectionCancelled" });
            console.log("Content script: Selection cancelled via Escape. All listeners removed. Notification removed.");
        }
    }

    function cleanUpInProgressSelectionListeners() {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        console.log("Content script: Cleaned up mousemove and mouseup listeners.");
    }
    
    function cleanUpAllSelectionListeners() {
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove); // In case they were somehow left active
        document.removeEventListener('mouseup', handleMouseUp);     // In case they were somehow left active
        document.removeEventListener('keydown', handleKeyDown);
        console.log("Content script: Cleaned up all selection listeners (mousedown, mousemove, mouseup, keydown).");
    }

} // End of if (typeof window.exploratoryTestingCropperInitialized === 'undefined')
else {
    // This 'else' block will be hit if executeScript runs this file again on the same page.
    // The existing onMessage listener (from the first injection) will handle the "startSelection" message.
    // The key is that variables are not re-declared with 'let' or 'const' at the top level.
    console.log("Content script: Already initialized (exploratoryTestingCropperInitialized = true). Waiting for 'startSelection' message on existing listener.");
}
