// Guided tour for the extension, built with Driver.js (bundled in lib/driverjs, no CDN).
// Steps target the popup mock and the screenshot hotspots in tutorial.html via [data-tour].

const tourSteps = [
  {
    popover: {
      title: 'Welcome',
      description:
        'Record <b>Bugs</b>, <b>Notes</b>, <b>Questions</b> and <b>Ideas</b> while you explore a web page. ' +
        'This tour covers adding annotations, screenshots, cropping, the report, and exporting or importing a session.',
    },
  },
  {
    element: '[data-tour="types"]',
    popover: {
      title: 'Pick an annotation type',
      description:
        'Click Bug, Note, Question or Idea to open its form. ' +
        'The badge shows how many annotations of that type the session has. The URL of the current tab is saved automatically.',
      side: 'right',
    },
  },
  {
    element: '[data-tour="description"]',
    popover: {
      title: 'Describe what you found',
      description:
        'Type a short description. It is required for cropped screenshots, so write it before you click the crop button.',
      side: 'right',
    },
  },
  {
    element: '[data-tour="add"]',
    popover: {
      title: 'Add without a screenshot',
      description:
        'Saves the annotation with the description and URL only. Shortcut: <kbd>Ctrl</kbd> + <kbd>Enter</kbd> inside the text box.',
      side: 'right',
    },
  },
  {
    element: '[data-tour="screenshot"]',
    popover: {
      title: 'Add with a screenshot',
      description:
        'Saves the annotation together with a screenshot of the visible area of the current tab. ' +
        'Shortcut: <kbd>Shift</kbd> + <kbd>Enter</kbd> inside the text box.',
      side: 'right',
    },
  },
  {
    element: '[data-tour="crop"]',
    popover: {
      title: 'Add with a cropped screenshot',
      description:
        'The popup closes and you drag a rectangle over the part of the page you want to keep. ' +
        'The editor opens with that area so you can mark it up before saving.',
      side: 'right',
    },
  },
  {
    element: '[data-tour="editor-canvas"]',
    popover: {
      title: 'The crop editor',
      description:
        'Your selected area appears here. The description you typed in the popup is saved with the annotation.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="editor-tools"]',
    popover: {
      title: 'Draw on the screenshot',
      description:
        'Choose an arrow, a rectangle or text, then click and drag on the image. ' +
        'Shortcuts: <kbd>A</kbd>, <kbd>R</kbd>, <kbd>T</kbd>. Undo with <kbd>Ctrl</kbd> + <kbd>Z</kbd>.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="editor-blur-tool"]',
    popover: {
      title: 'Blur sensitive data',
      description:
        'Select the blur tool (<kbd>B</kbd>) and drag over anything that should not be shared, ' +
        'such as e-mails, names or tokens.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="editor-blurred"]',
    popover: {
      title: 'Blurred area',
      description: 'This is how a blurred area looks. The blur is baked into the image when you save with annotations.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="editor-save"]',
    popover: {
      title: 'Save or cancel',
      description:
        '<b>Save with Annotations</b> keeps your drawings and blur (<kbd>Ctrl</kbd> + <kbd>Enter</kbd>). ' +
        '<b>Save without Annotations</b> keeps the plain crop. <b>Cancel</b> (<kbd>Esc</kbd>) discards it.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="report-btn"]',
    popover: {
      title: 'View the report',
      description: 'Click this button in the popup to open the session report in a new tab.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="report-summary"]',
    popover: {
      title: 'Session summary',
      description: 'Start date, browser, operating system, the number of annotations per type and their distribution.',
      side: 'bottom',
    },
  },
  {
    element: '[data-tour="report-filters"]',
    popover: {
      title: 'Filter by type',
      description: 'Show only Bugs, Notes, Ideas or Questions, or switch back to All.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="report-table"]',
    popover: {
      title: 'Annotations table',
      description:
        'Every annotation with its type, description, URL, time and screenshot. ' +
        'Use the trash icon to delete an annotation.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="report-downloads"]',
    popover: {
      title: 'Download the report',
      description:
        '<b>Download Report</b> creates a standalone HTML file that works offline. ' +
        '<b>Download Images</b> creates a ZIP with all the screenshots.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="export"]',
    popover: {
      title: 'Export the session',
      description:
        'Export to <b>CSV</b> for spreadsheets or to <b>JSON</b> to keep a complete copy of the session.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="import"]',
    popover: {
      title: 'Import a session',
      description:
        'Load a JSON file you exported earlier to continue that session. ' +
        'Importing replaces the current session, so export first if you want to keep it.',
      side: 'top',
    },
  },
  {
    element: '[data-tour="help"]',
    popover: {
      title: 'Want to see this again?',
      description:
        'Click the <b>?</b> button at the top right of the extension popup to open this tutorial at any time.',
      side: 'left',
    },
  },
];

function createTour() {
  const { driver } = window.driver.js;
  return driver({
    showProgress: true,
    allowClose: true,
    smoothScroll: true,
    stagePadding: 6,
    stageRadius: 8,
    overlayOpacity: 0.65,
    popoverClass: 'et-tour',
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Finish',
    steps: tourSteps,
  });
}

document.addEventListener('DOMContentLoaded', () => {
  let tour = createTour();

  const start = () => {
    tour.destroy();
    tour = createTour();
    tour.drive();
  };

  document.getElementById('startTourBtn').addEventListener('click', start);
  start();
});
