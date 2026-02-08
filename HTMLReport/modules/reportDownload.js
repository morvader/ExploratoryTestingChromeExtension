import { serializeSession } from './reportData.js';

/**
 * Downloads all screenshots as a ZIP file.
 */
export async function downloadAllImages(session) {
    const annotations = session.getAnnotations();
    const imagesWithScreenshots = annotations.filter(a => a.imageURL);

    if (imagesWithScreenshots.length === 0) {
        alert('No screenshots available to download.');
        return;
    }

    if (typeof JSZip === 'undefined') {
        alert('JSZip library is not loaded. Cannot create ZIP file.');
        return;
    }

    const zip = new JSZip();
    const imgFolder = zip.folder('screenshots');

    // Add README file
    const readmeContent = `Exploratory Testing Screenshots
Generated: ${new Date().toLocaleString()}
Source: Exploratory Testing Chrome Extension
Total screenshots: ${imagesWithScreenshots.length}

This ZIP file is safe and contains screenshots captured during your testing session.`;
    zip.file('README.txt', readmeContent);

    // Add all images to the ZIP
    for (let i = 0; i < imagesWithScreenshots.length; i++) {
        const annotation = imagesWithScreenshots[i];
        const type = annotation.constructor.name;
        const timestamp = annotation.timestamp ? new Date(annotation.timestamp).toISOString().replace(/[:.]/g, '-') : `annotation-${i}`;
        const fileName = `${i + 1}_${type}_${timestamp}.png`;

        // Convert base64 to binary
        const base64Data = annotation.imageURL.split(',')[1];
        imgFolder.file(fileName, base64Data, { base64: true });
    }

    // Generate and download the ZIP
    try {
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ExploratoryTesting_Screenshots_${new Date().toISOString().slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error creating ZIP:', error);
        alert('Error creating ZIP file. Please try again.');
    }
}

const SVG_PATHS = {
    Bug: '../images/bug.svg',
    Note: '../images/note.svg',
    Idea: '../images/light-bulb.svg',
    Question: '../images/question.svg'
};

/**
 * Downloads a standalone HTML report with all resources embedded.
 */
export async function downloadCompleteReport(session) {
    const reportContent = document.getElementById('report').cloneNode(true);

    // Remove interactive-only elements from download
    removeInteractiveElements(reportContent);

    // Embed all images as base64
    await embedImages(reportContent);
    const icons = await loadSvgIconsAsBase64();
    replaceSvgIcons(reportContent, icons);

    const styles = extractStyles();
    const sessionJSON = JSON.stringify(serializeSession(session));

    const html = buildStandaloneHtml(reportContent.outerHTML, styles, sessionJSON);

    triggerDownload(html);
}

function removeInteractiveElements(container) {
    // Convert chart canvas to static image
    const chartCanvas = document.getElementById('annotationsChart');
    const chartContainer = container.querySelector('#chartContainer');
    if (chartCanvas && chartContainer) {
        try {
            // Get the canvas as base64 image
            const chartImageData = chartCanvas.toDataURL('image/png');

            // Replace canvas with img element
            const canvas = chartContainer.querySelector('canvas');
            if (canvas) {
                const img = document.createElement('img');
                img.src = chartImageData;
                img.alt = 'Annotations Distribution Chart';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                canvas.replaceWith(img);
            }
        } catch (error) {
            console.error('Error converting chart to image:', error);
            // If conversion fails, remove the chart
            if (chartContainer) chartContainer.remove();
        }
    }

    // Remove both download buttons
    const downloadReportBtn = container.querySelector('#downloadReportBtn');
    if (downloadReportBtn) downloadReportBtn.remove();

    const downloadImagesBtn = container.querySelector('#downloadImagesBtn');
    if (downloadImagesBtn) downloadImagesBtn.remove();

    // Remove button group if it's now empty
    const buttonGroup = container.querySelector('.button-group');
    if (buttonGroup && buttonGroup.children.length === 0) {
        buttonGroup.remove();
    }

    // Remove delete column from header
    const headerRow = container.querySelector('thead tr');
    if (headerRow && headerRow.lastElementChild) {
        headerRow.lastElementChild.remove();
    }

    // Remove delete column from each row
    container.querySelectorAll('tbody tr').forEach(row => {
        if (row.lastElementChild) row.lastElementChild.remove();
    });
}

async function embedImages(container) {
    const images = container.querySelectorAll('.preview-image');
    await Promise.all(Array.from(images).map(img => {
        return new Promise((resolve) => {
            if (!img.src) return resolve();
            const tempImg = new Image();
            tempImg.crossOrigin = 'Anonymous';
            tempImg.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = tempImg.width;
                canvas.height = tempImg.height;
                canvas.getContext('2d').drawImage(tempImg, 0, 0);
                img.src = canvas.toDataURL('image/png');
                resolve();
            };
            tempImg.onerror = () => resolve();
            tempImg.src = img.src;
        });
    }));
}

async function loadSvgIconsAsBase64() {
    const entries = Object.entries(SVG_PATHS);
    const results = await Promise.all(
        entries.map(([type, path]) => fetch(path).then(r => r.text()).then(svg => [type, svg]))
    );
    const icons = {};
    results.forEach(([type, svg]) => {
        icons[type] = `data:image/svg+xml;base64,${btoa(svg)}`;
    });
    return icons;
}

function replaceSvgIcons(container, icons) {
    container.querySelectorAll('.annotation-icon').forEach(icon => {
        const type = icon.alt;
        if (icons[type]) {
            icon.src = icons[type];
        }
    });
}

function extractStyles() {
    return Array.from(document.styleSheets)
        .map(sheet => {
            try {
                return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
            } catch {
                return '';
            }
        })
        .join('\n');
}

function buildStandaloneHtml(reportHtml, styles, sessionJSON) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Exploratory Testing Session Report</title>
    <style>${styles}</style>
</head>
<body>
    ${reportHtml}
    <div id="imagePreview" class="image-preview">
        <img src="" alt="Preview">
    </div>
    <div id="imageHoverPreview" class="image-hover-preview">
        <img src="" alt="Hover Preview">
    </div>
    <script>
        const sessionData = ${sessionJSON};

        function showImagePreview(src) {
            const preview = document.getElementById('imagePreview');
            if (!preview) return;
            const previewImg = preview.querySelector('img');
            if (!previewImg) return;
            previewImg.src = src;
            preview.classList.add('active');
            const close = () => { preview.classList.remove('active'); preview.removeEventListener('click', close); };
            preview.addEventListener('click', close);
            previewImg.addEventListener('click', e => e.stopPropagation());
        }

        function setupImageHover() {
            document.querySelectorAll('.preview-image').forEach(img => {
                img.addEventListener('click', e => { e.preventDefault(); showImagePreview(img.src); });
                img.addEventListener('mouseenter', e => {
                    const p = document.getElementById('imageHoverPreview');
                    if (!p) return;
                    p.querySelector('img').src = img.src;
                    p.classList.add('active');
                    updatePos(e);
                });
                img.addEventListener('mousemove', updatePos);
                img.addEventListener('mouseleave', () => {
                    const p = document.getElementById('imageHoverPreview');
                    if (p) p.classList.remove('active');
                });
            });
        }

        function updatePos(e) {
            const p = document.getElementById('imageHoverPreview');
            if (!p || !p.classList.contains('active')) return;
            const o = 15;
            let l = e.clientX + o, t = e.clientY + o;
            if (l + p.offsetWidth > window.innerWidth) l = e.clientX - p.offsetWidth - o;
            if (t + p.offsetHeight > window.innerHeight) t = e.clientY - p.offsetHeight - o;
            p.style.left = l + 'px';
            p.style.top = t + 'px';
        }

        // Filter functionality for downloaded report
        document.querySelectorAll('.filter-pill').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const type = this.dataset.type;
                document.querySelectorAll('.annotation-row').forEach(row => {
                    if (type === 'all') {
                        row.style.display = '';
                    } else {
                        row.style.display = row.classList.contains('annotation-row--' + type.toLowerCase()) ? '' : 'none';
                    }
                });
            });
        });

        document.addEventListener('DOMContentLoaded', setupImageHover);
    <\/script>
</body>
</html>`;
}

function triggerDownload(htmlContent) {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ExploratoryTestingReport_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
