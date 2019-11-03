/**
 * Clear Netflix viewing activity page to be used as the skeleton for viewing stats dashboard
 */
function setupDashboardTemplate() {
  // Change page title
  document.querySelector('h1').textContent = chrome.i18n.getMessage(
    'myViewingStats'
  );

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
  document.querySelector(
    '#viewedItemsCount .ns-title'
  ).textContent = chrome.i18n.getMessage('viewedItemsCount');
  document
    .querySelector('#viewedItemsCount .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('viewedItemsCount'));

  document.querySelector(
    '#totalTime .ns-title'
  ).textContent = chrome.i18n.getMessage('totalTime');
  document
    .querySelector('#totalTime .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('totalTime'));

  document.querySelector(
    '#maxTimeInDate .ns-title'
  ).textContent = chrome.i18n.getMessage('maxTimeInDate');
  document
    .querySelector('#maxTimeInDate .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('maxTimeInDate'));

  document.querySelector(
    '#deviceCount .ns-title'
  ).textContent = chrome.i18n.getMessage('deviceCount');
  document
    .querySelector('#deviceCount .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('deviceCount'));

  document.querySelector(
    '#moviesCount .ns-title'
  ).textContent = chrome.i18n.getMessage('moviesCount');
  document
    .querySelector('#moviesCount .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('moviesCount'));

  document.querySelector(
    '#moviesTime .ns-title'
  ).textContent = chrome.i18n.getMessage('moviesTime');
  document
    .querySelector('#moviesTime .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('moviesTime'));

  document.querySelector(
    '#seriesCount .ns-title'
  ).textContent = chrome.i18n.getMessage('seriesCount');
  document
    .querySelector('#seriesCount .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('seriesCount'));

  document.querySelector(
    '#seriesTime .ns-title'
  ).textContent = chrome.i18n.getMessage('seriesTime');
  document
    .querySelector('#seriesTime .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('seriesTime'));

  document.querySelector(
    '#moviesVsTvTime .ns-title'
  ).textContent = chrome.i18n.getMessage('moviesVsTvTime');
  document
    .querySelector('#moviesVsTvTime .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('moviesVsTvTime'));

  document.querySelector(
    '#meanTimeByWeekDay .ns-title'
  ).textContent = chrome.i18n.getMessage('meanTimeByWeekDay');
  document
    .querySelector('#meanTimeByWeekDay .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('meanTimeByWeekDay'));

  document.querySelector(
    '#activity .ns-title'
  ).textContent = chrome.i18n.getMessage('viewingActivity');
  document
    .querySelector('#activity .ns-title-container')
    .setAttribute('aria-label', chrome.i18n.getMessage('viewingActivity'));

  document.querySelector(
    '#activityDataTable #dataTableTitle'
  ).textContent = chrome.i18n.getMessage('title');
  document.querySelector(
    '#activityDataTable #dataTableDateFormatted'
  ).textContent = chrome.i18n.getMessage('date');
  document.querySelector(
    '#activityDataTable #dataTableDurationFormatted'
  ).textContent = chrome.i18n.getMessage('duration');
  document.querySelector(
    '#activityDataTable #dataTableType'
  ).textContent = chrome.i18n.getMessage('type');
}
