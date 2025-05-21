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

    // This listener is added once per page load/script injection context
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "startSelection") {
            console.log("Content script: 'startSelection' message received with type:", request.annotationType, "and description:", request.description ? request.description.substring(0,50) + "..." : "N/A");
            
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

        if (selectionBox) selectionBox.style.display = 'none';
        removeSelectionNotification();

        if (finalWidth > 0 && finalHeight > 0) {
            const messageToBackground = {
                type: "csToBgCropData", 
                coordinates: { x: finalX, y: finalY, width: finalWidth, height: finalHeight },
                annotationType: currentAnnotationType,
                description: currentDescription
            };
            chrome.runtime.sendMessage(messageToBackground);
            console.log("Content script: Sent csToBgCropData to background:", messageToBackground);
        } else {
            console.log("Content script: Selection was too small or invalid.");
            chrome.runtime.sendMessage({ 
                type: "selectionCancelled", 
                annotationType: currentAnnotationType 
            });
        }
        // Reset stored type and description
        currentAnnotationType = null;
        currentDescription = null;
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
            
            chrome.runtime.sendMessage({ 
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
