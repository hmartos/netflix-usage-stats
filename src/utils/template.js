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
 * @param {*} viewedItems
 */
function fillDashboardTemplate(viewedItems) {
  // Chart titles
  const moviesVsTvTimeTitle = document.querySelector('#moviesVsTvTime .ns-section-title');
  moviesVsTvTimeTitle.textContent = chrome.i18n.getMessage('moviesVsTvTime');
  moviesVsTvTimeTitle.setAttribute('aria-label', chrome.i18n.getMessage('moviesVsTvTime'));

  const meanTimeByWeekDayTitle = document.querySelector('#meanTimeByWeekDay .ns-section-title');
  meanTimeByWeekDayTitle.textContent = chrome.i18n.getMessage('meanTimeByWeekDay');
  meanTimeByWeekDayTitle.setAttribute('aria-label', chrome.i18n.getMessage('meanTimeByWeekDay'));

  // Init toggle section with stats title
  const tabSectionTitle = document.querySelector('#tabSectionTitle');
  tabSectionTitle.textContent = chrome.i18n.getMessage('viewingSummary');
  tabSectionTitle.setAttribute('aria-label', chrome.i18n.getMessage('viewingSummary'));

  const viewingActivityTitle = document.querySelector('#viewingActivityTitle');
  viewingActivityTitle.textContent = chrome.i18n.getMessage('viewingActivity');
  viewingActivityTitle.setAttribute('aria-label', chrome.i18n.getMessage('viewingActivity'));

  // Toggle between stats and achievements
  const summaryPageToggleSelector = '.pageToggle .choice.icon.summary';
  const achievementsPageToggleSelector = '.pageToggle .choice.icon.achievements';

  // Summary toggle
  let summaryPageToggle = document.querySelector(summaryPageToggleSelector);
  summaryPageToggle.textContent = chrome.i18n.getMessage('summary');
  bindPageToggleBtn(summaryPageToggleSelector, viewedItems);

  // Achievements toggle
  let achievementsPageToggle = document.querySelector(achievementsPageToggleSelector);
  achievementsPageToggle.textContent = chrome.i18n.getMessage('achievements');
  bindPageToggleBtn(achievementsPageToggleSelector, viewedItems);

  // Hide achievements tab
  $('#achievements').hide();

  showStatsSection();
}

/**
 * Create icon DOM node
 * @param {*} iconText - material icons text
 */
function createIconNode(iconText) {
  let icon = document.createElement('i');
  icon.classList = ['material-icons'];
  icon.innerText = `${iconText}`;
  return icon;
}

/**
 * Show stats section
 */
function showStatsSection() {
  document.querySelector('#viewedItemsCount .ns-title').textContent = chrome.i18n.getMessage('viewedItemsCount');
  document
    .querySelector('#viewedItemsCount .ns-title')
    .setAttribute('aria-label', chrome.i18n.getMessage('viewedItemsCount'));

  document.querySelector('#totalTime .ns-title').textContent = chrome.i18n.getMessage('totalTime');
  document.querySelector('#totalTime .ns-title').setAttribute('aria-label', chrome.i18n.getMessage('totalTime'));

  document.querySelector('#maxTimeInDate .ns-title').textContent = chrome.i18n.getMessage('maxTimeInDate');
  document
    .querySelector('#maxTimeInDate .ns-title')
    .setAttribute('aria-label', chrome.i18n.getMessage('maxTimeInDate'));

  document.querySelector('#deviceCount .ns-title').textContent = chrome.i18n.getMessage('deviceCount');
  document.querySelector('#deviceCount .ns-title').setAttribute('aria-label', chrome.i18n.getMessage('deviceCount'));

  document.querySelector('#moviesCount .ns-title').textContent = chrome.i18n.getMessage('moviesCount');
  document.querySelector('#moviesCount .ns-title').setAttribute('aria-label', chrome.i18n.getMessage('moviesCount'));
  document.querySelector('#moviesCount .ns-image').setAttribute('src', chrome.runtime.getURL('/images/movie.svg'));

  document.querySelector('#moviesTime .ns-title').textContent = chrome.i18n.getMessage('moviesTime');
  document.querySelector('#moviesTime .ns-title').setAttribute('aria-label', chrome.i18n.getMessage('moviesTime'));

  document.querySelector('#seriesCount .ns-title').textContent = chrome.i18n.getMessage('seriesCount');
  document.querySelector('#seriesCount .ns-title').setAttribute('aria-label', chrome.i18n.getMessage('seriesCount'));
  document.querySelector('#seriesCount .ns-image').setAttribute('src', chrome.runtime.getURL('/images/tv.svg'));

  document.querySelector('#seriesTime .ns-title').textContent = chrome.i18n.getMessage('seriesTime');
  document.querySelector('#seriesTime .ns-title').setAttribute('aria-label', chrome.i18n.getMessage('seriesTime'));
}

/**
 * Bind on click event on 'pageToggle' buttons
 * @param {*} selector
 * @param {*} viewedItems
 */
function bindPageToggleBtn(selector, viewedItems) {
  const pageToggleBtn = $(selector);
  pageToggleBtn.on('click', function() {
    changeTab(selector, viewedItems);
  });
}

/**
 * Change selected tab between summary and achievements
 * @param {*} selector
 * @param {*} viewedItems
 */
function changeTab(selector, viewedItems) {
  console.log('Switching to tab', selector);
  const tabSectionTitle = document.querySelector('#tabSectionTitle');
  $(selector).addClass('selected');

  if (selector === '.pageToggle .choice.icon.summary') {
    tabSectionTitle.textContent = chrome.i18n.getMessage('viewingSummary');
    changeSelectedTab('summary', selector, viewedItems);
    $('#achievements').hide();
    $('#stats').show();
    showStatsSection();
    showStats();
  } else if (selector === '.pageToggle .choice.icon.achievements') {
    tabSectionTitle.textContent = chrome.i18n.getMessage('achievements');
    changeSelectedTab('achievements', selector, viewedItems);
    $('#achievements').show();
    $('#stats').hide();
    showAchievements(viewedItems);
  }
}

/**
 * Change selected tab creating a <span> for selected tab and a <a> for not selected tab
 * @param {*} selected
 * @param {*} selector
 * @param {*} viewedItems
 */
function changeSelectedTab(selected, selector, viewedItems) {
  if (selected === 'summary') {
    $(selector).replaceWith(`<span class="first choice icon summary">${chrome.i18n.getMessage('summary')}</span>`);
    $('.pageToggle .choice.icon.achievements').replaceWith(
      `<a class="choice icon achievements">${chrome.i18n.getMessage('achievements')}</a>`
    );
    bindPageToggleBtn('.pageToggle .choice.icon.achievements', viewedItems);
  } else {
    $(selector).replaceWith(`<span class="choice icon achievements">${chrome.i18n.getMessage('achievements')}</span>`);
    $('.pageToggle .choice.icon.summary').replaceWith(
      `<a class="first choice icon summary">${chrome.i18n.getMessage('summary')}</a>`
    );
    bindPageToggleBtn('.pageToggle .choice.icon.summary', viewedItems);
  }
}
