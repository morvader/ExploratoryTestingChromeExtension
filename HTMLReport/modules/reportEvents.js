import { deleteAnnotation } from './reportData.js';
import { displayAnnotationsTable } from './reportUI.js';
import { downloadCompleteReport } from './reportDownload.js';

let annotationToDelete = null;
let currentFilter = 'all';

/**
 * Returns the current active filter type.
 */
export function getCurrentFilter() {
    return currentFilter;
}

/**
 * Sets up all interactive event listeners for the report.
 */
export function setupAllListeners(session) {
    setupFilterListeners(session);
    setupDeleteListeners();
    setupImagePreviewListeners();
    setupDownloadListener(session);
}

/**
 * Re-binds row-level listeners after table re-render.
 */
export function rebindTableListeners() {
    setupImagePreviewListeners();
}

function setupFilterListeners(session) {
    document.querySelectorAll('.filter-pill').forEach(button => {
        button.addEventListener('click', function () {
            document.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.type;
            displayAnnotationsTable(session, currentFilter);
            rebindTableListeners();
        });
    });
}

function setupDeleteListeners() {
    // Delegate click on delete buttons
    document.getElementById('annotationsTableBody').addEventListener('click', (e) => {
        const btn = e.target.closest('.delete-btn');
        if (!btn) return;
        annotationToDelete = parseInt(btn.dataset.index);
        document.getElementById('divOverlay').style.display = 'block';
    });

    document.getElementById('cancelDelete').addEventListener('click', () => {
        document.getElementById('divOverlay').style.display = 'none';
        annotationToDelete = null;
    });

    document.getElementById('deleteYes').addEventListener('click', async () => {
        if (annotationToDelete === null) return;
        const response = await deleteAnnotation(annotationToDelete);
        document.getElementById('divOverlay').style.display = 'none';
        annotationToDelete = null;
        // Reload to resync regardless of response
        location.reload();
    });
}

function setupImagePreviewListeners() {
    document.querySelectorAll('.preview-image').forEach(img => {
        img.addEventListener('click', () => showImagePreview(img.dataset.preview));
        img.addEventListener('mouseenter', (e) => showHoverPreview(img.dataset.preview, e));
        img.addEventListener('mousemove', updateHoverPosition);
        img.addEventListener('mouseleave', hideHoverPreview);
    });
}

function setupDownloadListener(session) {
    document.getElementById('downloadReportBtn').addEventListener('click', () => {
        downloadCompleteReport(session);
    });
}

// --- Image Preview ---

function showImagePreview(src) {
    const preview = document.getElementById('imagePreview');
    const previewImg = preview.querySelector('img');
    previewImg.src = src;
    preview.classList.add('active');

    const closePreview = () => {
        preview.classList.remove('active');
        preview.removeEventListener('click', closePreview);
    };
    preview.addEventListener('click', closePreview);
    previewImg.addEventListener('click', (e) => e.stopPropagation());
}

function showHoverPreview(src, event) {
    const preview = document.getElementById('imageHoverPreview');
    preview.querySelector('img').src = src;
    preview.classList.add('active');
    updateHoverPosition(event);
}

function updateHoverPosition(event) {
    const preview = document.getElementById('imageHoverPreview');
    if (!preview.classList.contains('active')) return;

    const offset = 15;
    const pw = preview.offsetWidth;
    const ph = preview.offsetHeight;
    let left = event.clientX + offset;
    let top = event.clientY + offset;

    if (left + pw > window.innerWidth) left = event.clientX - pw - offset;
    if (top + ph > window.innerHeight) top = event.clientY - ph - offset;

    preview.style.left = left + 'px';
    preview.style.top = top + 'px';
}

function hideHoverPreview() {
    document.getElementById('imageHoverPreview').classList.remove('active');
}
