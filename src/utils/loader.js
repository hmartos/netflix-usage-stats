/**
 * Shows loader while data is being retrieved
 */
function showLoader() {
  // Loader
  let container = document.createElement('div');
  container.id = 'ns-loader-container';

  let loader = document.createElement('div');
  loader.className = 'ns-loader';

  let paragraph = document.createElement('p');
  paragraph.className = 'ns-loading-message';
  let message = document.createTextNode(`${chrome.i18n.getMessage('loadingMessage')}`);
  paragraph.appendChild(message);

  container.appendChild(loader);
  container.appendChild(paragraph);

  // Get Netflix activity table
  let activityTable = document.querySelector('.retable');

  // Show loader
  activityTable.replaceWith(container);
}

/**
 * Hide loader replacing it with stats template
 * @param {*} statsTemplate
 */
function hideLoader(statsTemplate) {
  // Hide loader
  let statsSection = document.createElement('div');
  statsSection.id = 'stats-section';
  statsSection.classList.add('structural', 'stdHeight');
  statsSection.innerHTML = DOMPurify.sanitize(statsTemplate);
  document.querySelector('#ns-loader-container').replaceWith(statsSection);
}
