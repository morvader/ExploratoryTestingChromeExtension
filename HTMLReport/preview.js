import { loadSessionData } from './modules/reportData.js';
import { displaySessionInfo, displayStats, createAnnotationsChart, displayAnnotationsTable } from './modules/reportUI.js';
import { setupAllListeners, getCurrentFilter, rebindTableListeners } from './modules/reportEvents.js';

async function initReport() {
    try {
        const session = await loadSessionData();

        if (!session) {
            document.getElementById('report').innerHTML = `
                <div class="empty-report">
                    <h2>No session data available</h2>
                    <p>Start a testing session and add annotations to generate a report.</p>
                </div>`;
            return;
        }

        displaySessionInfo(session);
        displayStats(session);
        createAnnotationsChart(session);
        displayAnnotationsTable(session, getCurrentFilter());
        setupAllListeners(session);
        rebindTableListeners();
    } catch (error) {
        console.error('Error loading report:', error);
        document.getElementById('report').innerHTML = `
            <div class="empty-report">
                <h2>Error loading data</h2>
                <p>${error.message}</p>
            </div>`;
    }
}

document.addEventListener('DOMContentLoaded', initReport);
