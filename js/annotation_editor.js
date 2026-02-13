// Annotation Editor - Handles drawing annotations on cropped screenshots
(function() {
    'use strict';

    const canvas = document.getElementById('annotation-canvas');
    const ctx = canvas.getContext('2d');

    let currentTool = 'arrow'; // 'arrow' or 'rectangle'
    let isDrawing = false;
    let startX, startY;
    let annotations = []; // Store all drawn annotations
    let baseImage = null; // Store the original screenshot
    let imageData = null; // Store the image data URL

    // Drawing state
    const ANNOTATION_COLOR = '#DC2626';
    const LINE_WIDTH = 3;

    // Initialize editor with screenshot data
    function initEditor(screenshotDataUrl) {
        imageData = screenshotDataUrl;
        const img = new Image();

        img.onload = function() {
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Store base image
            baseImage = img;

            // Draw initial image
            redrawCanvas();
        };

        img.src = screenshotDataUrl;
    }

    // Undo last annotation
    function undo() {
        if (annotations.length === 0) return;
        annotations.pop();
        redrawCanvas();
        updateUndoButton();
    }

    // Enable/disable undo button based on annotations count
    function updateUndoButton() {
        document.getElementById('undo-button').disabled = annotations.length === 0;
    }

    // Redraw canvas with base image and all annotations
    function redrawCanvas() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw base image
        if (baseImage) {
            ctx.drawImage(baseImage, 0, 0);
        }

        // Draw all annotations
        annotations.forEach(annotation => {
            drawAnnotation(annotation);
        });
    }

    // Draw a single annotation
    function drawAnnotation(annotation) {
        ctx.strokeStyle = ANNOTATION_COLOR;
        ctx.lineWidth = LINE_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (annotation.type === 'arrow') {
            drawArrow(annotation.startX, annotation.startY, annotation.endX, annotation.endY);
        } else if (annotation.type === 'rectangle') {
            drawRectangle(annotation.startX, annotation.startY, annotation.width, annotation.height);
        }
    }

    // Draw arrow with arrowhead
    function drawArrow(fromX, fromY, toX, toY) {
        const headLength = 15; // Arrow head length
        const angle = Math.atan2(toY - fromY, toX - fromX);

        // Draw line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }

    // Draw rectangle
    function drawRectangle(x, y, width, height) {
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.stroke();
    }

    // Get mouse position relative to canvas
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    // Mouse event handlers
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const pos = getMousePos(e);
        startX = pos.x;
        startY = pos.y;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;

        const pos = getMousePos(e);

        // Redraw canvas with preview
        redrawCanvas();

        // Draw preview
        ctx.strokeStyle = ANNOTATION_COLOR;
        ctx.lineWidth = LINE_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (currentTool === 'arrow') {
            drawArrow(startX, startY, pos.x, pos.y);
        } else if (currentTool === 'rectangle') {
            const width = pos.x - startX;
            const height = pos.y - startY;
            drawRectangle(startX, startY, width, height);
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (!isDrawing) return;
        isDrawing = false;

        const pos = getMousePos(e);

        // Save annotation
        if (currentTool === 'arrow') {
            annotations.push({
                type: 'arrow',
                startX: startX,
                startY: startY,
                endX: pos.x,
                endY: pos.y
            });
        } else if (currentTool === 'rectangle') {
            annotations.push({
                type: 'rectangle',
                startX: startX,
                startY: startY,
                width: pos.x - startX,
                height: pos.y - startY
            });
        }

        redrawCanvas();
        updateUndoButton();
    });

    // Tool selection
    document.getElementById('arrow-tool').addEventListener('click', () => {
        currentTool = 'arrow';
        document.getElementById('arrow-tool').classList.add('active');
        document.getElementById('rectangle-tool').classList.remove('active');
        canvas.className = 'tool-arrow';
    });

    document.getElementById('rectangle-tool').addEventListener('click', () => {
        currentTool = 'rectangle';
        document.getElementById('rectangle-tool').classList.add('active');
        document.getElementById('arrow-tool').classList.remove('active');
        canvas.className = 'tool-rectangle';
    });

    // Undo button
    document.getElementById('undo-button').addEventListener('click', undo);

    // Action buttons
    document.getElementById('save-with-annotations').addEventListener('click', () => {
        // Get final canvas as data URL
        const annotatedImageData = canvas.toDataURL('image/png');

        // Send back to content script or background
        window.parent.postMessage({
            type: 'annotationComplete',
            imageData: annotatedImageData,
            hasAnnotations: true
        }, '*');
    });

    document.getElementById('save-without-annotations').addEventListener('click', () => {
        // Send original image back
        window.parent.postMessage({
            type: 'annotationComplete',
            imageData: imageData,
            hasAnnotations: false
        }, '*');
    });

    document.getElementById('cancel-button').addEventListener('click', () => {
        window.parent.postMessage({
            type: 'annotationCancelled'
        }, '*');
    });

    // Listen for initialization message
    window.addEventListener('message', (event) => {
        if (event.data.type === 'initAnnotationEditor') {
            initEditor(event.data.imageData);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('cancel-button').click();
        } else if (e.key === 'a' || e.key === 'A') {
            document.getElementById('arrow-tool').click();
        } else if (e.key === 'r' || e.key === 'R') {
            document.getElementById('rectangle-tool').click();
            } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            undo();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            document.getElementById('save-with-annotations').click();
        }
    });

    // Signal ready
    console.log('Annotation editor loaded and ready');
})();
