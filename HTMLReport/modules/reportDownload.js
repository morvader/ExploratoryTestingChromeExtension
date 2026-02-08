import { serializeSession } from './reportData.js';

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
    // Remove chart container
    const chart = container.querySelector('#chartContainer');
    if (chart) chart.remove();

    // Remove download button
    const downloadBtn = container.querySelector('#downloadReportBtn');
    if (downloadBtn) downloadBtn.remove();

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
