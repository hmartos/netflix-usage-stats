/**
 * Clear Netflix viewing activity page to be used as the skeleton for viewing stats dashboard
 */
function setupDashboardTemplate() {
  // Change page title
  document.querySelector('h1').textContent = chrome.i18n.getMessage('myViewingStats');

  // Remove watched/rated tabs
  let tabs = document.querySelector('.pageToggle');
  if (tabs) {
    tabs.remove();
  }

  // Remove viewing activity footer
  let footer = document.querySelector('.viewing-activity-footer');
  if (footer) {
    footer.remove();
  }

  // Set default font for charts
  Chart.defaults.global.defaultFontFamily = 'Netflix Sans';
}

/**
 * Fill dashboard template with translated texts
 */
function fillDashboardTemplate() {
  // Titles
  const moviesVsTvTimeTitle = document.querySelector('#moviesVsTvTime .ns-section-title');
  moviesVsTvTimeTitle.textContent = chrome.i18n.getMessage('moviesVsTvTime');
  moviesVsTvTimeTitle.setAttribute('aria-label', chrome.i18n.getMessage('moviesVsTvTime'));

  const meanTimeByWeekDayTitle = document.querySelector('#meanTimeByWeekDay .ns-section-title');
  meanTimeByWeekDayTitle.textContent = chrome.i18n.getMessage('meanTimeByWeekDay');
  meanTimeByWeekDayTitle.setAttribute('aria-label', chrome.i18n.getMessage('meanTimeByWeekDay'));

  const viewingSummaryTitle = document.querySelector('#statsTitle');
  viewingSummaryTitle.textContent = chrome.i18n.getMessage('viewingSummary');
  viewingSummaryTitle.setAttribute('aria-label', chrome.i18n.getMessage('viewingSummary'));

  const viewingActivityTitle = document.querySelector('#viewingActivityTitle');
  viewingActivityTitle.textContent = chrome.i18n.getMessage('viewingActivity');
  viewingActivityTitle.setAttribute('aria-label', chrome.i18n.getMessage('viewingActivity'));

  // Stats
  document.querySelector('#viewedItemsCount .ns-title').textContent = chrome.i18n.getMessage('viewedItemsCount');
  document
    .querySelector('#viewedItemsCount .ns-title')
    .setAttribute('aria-label', chrome.i18n.getMessage('viewedItemsCount'));

  document.querySelector('#totalTime .ns-title').textContent = chrome.i18n.getMessage('totalTime');
  document
    .querySelector('#totalTime .ns-title')
    .setAttribute('aria-label', chrome.i18n.getMessage('totalTime'));

  document.querySelector('#maxTimeInDate .ns-title').textContent = chrome.i18n.getMessage('maxTimeInDate');
  document
    .querySelector('#maxTimeInDate .ns-title')
    .setAttribute('aria-label', chrome.i18n.getMessage('maxTimeInDate'));

  document.querySelector('#deviceCount .ns-title').textContent = chrome.i18n.getMessage('deviceCount');
  document
    .querySelector('#deviceCount .ns-title')
    .setAttribute('aria-label', chrome.i18n.getMessage('deviceCount'));

  document.querySelector('#moviesCount .ns-title').textContent = chrome.i18n.getMessage('moviesCount');
  document
    .querySelector('#moviesCount .ns-title')
    .setAttribute('aria-label', chrome.i18n.getMessage('moviesCount'));

  document.querySelector('#moviesTime .ns-title').textContent = chrome.i18n.getMessage('moviesTime');
  document
    .querySelector('#moviesTime .ns-title')
    .setAttribute('aria-label', chrome.i18n.getMessage('moviesTime'));

  document.querySelector('#seriesCount .ns-title').textContent = chrome.i18n.getMessage('seriesCount');
  document
    .querySelector('#seriesCount .ns-title')
    .setAttribute('aria-label', chrome.i18n.getMessage('seriesCount'));

  document.querySelector('#seriesTime .ns-title').textContent = chrome.i18n.getMessage('seriesTime');
  document
    .querySelector('#seriesTime .ns-title')
    .setAttribute('aria-label', chrome.i18n.getMessage('seriesTime'));
}
