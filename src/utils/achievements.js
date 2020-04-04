/**
 * Calculate achievements based on viewed items
 * @param {*} viewedItems
 */
function calculateAchievements(viewedItems) {
  initializeAchievementsModel();
  debug('Calculating achievements...');
  // Achievement 1
  summary.achievements.achievement1.won = summary.moviesCount >= 1;
  if (!summary.achievements.achievement1.won) {
    summary.achievements.achievement1.remaining = `${summary.moviesCount}/1`;
  }

  // Achievement 2
  summary.achievements.achievement2.won = summary.episodesCount >= 1;
  if (!summary.achievements.achievement2.won) {
    summary.achievements.achievement2.remaining = `${summary.episodesCount}/1`;
  }

  // Achievement 3
  summary.achievements.achievement3.won = summary.moviesCount >= 1000;
  if (!summary.achievements.achievement3.won) {
    summary.achievements.achievement3.remaining = `${summary.moviesCount}/1000`;
  }

  // Achievement 4
  summary.achievements.achievement4.won = summary.seriesCount >= 100;
  if (!summary.achievements.achievement4.won) {
    summary.achievements.achievement4.remaining = `${summary.seriesCount}/100`;
  }

  // Achievement 5
  summary.achievements.achievement5.won = summary.maxTimeInDate >= 21600; // 6 hours
  if (!summary.achievements.achievement5.won) {
    summary.achievements.achievement5.remaining = `${summary.maxTimeInDate}/21600`; //TODO transform to hours
  }

  // Achievement 6
  summary.achievements.achievement6.won = summary.maxTimeInDate >= 43200; //12 hours
  if (!summary.achievements.achievement6.won) {
    summary.achievements.achievement6.remaining = `${summary.maxTimeInDate}/43200`; //TODO transform to hours
  }

  // Achievement 7
  summary.achievements.achievement7.won = summary.deviceCount >= 5;
  if (!summary.achievements.achievement7.won) {
    summary.achievements.achievement7.remaining = `${summary.deviceCount}/5`;
  }

  // Achievement 8
  summary.achievements.achievement8.won = monthDiff(summary.firstUse, new Date()) >= 24;
  if (!summary.achievements.achievement8.won) {
    summary.achievements.achievement8.remaining = `${monthDiff(summary.firstUse, new Date())}/24`;
  }

  // Achievement 9
  summary.achievements.achievement9.won = summary.viewedItemsCount >= 5000;
  if (!summary.achievements.achievement9.won) {
    summary.achievements.achievement9.remaining = `${summary.viewedItemsCount}/5000`;
  }

  // Achievement 10
  summary.achievements.achievement10.won = allAchievementsWon(10);
  if (!summary.achievements.achievement10.won) {
    summary.achievements.achievement10.remaining = `${summary.moviesCount}/10`; //TODO Calculate achievements won
  }

  debug('Calculated achievements', summary.achievements);
}

/**
 * Calculate difference in moths between two dates
 * @param {*} dateFrom
 * @param {*} dateTo
 */
function monthDiff(dateFrom, dateTo) {
  return dateTo.getMonth() - dateFrom.getMonth() + 12 * (dateTo.getFullYear() - dateFrom.getFullYear());
}

/**
 * Check if all achievements are won
 * @param {*} allAchievementsIndex - index of 'all achievements' achievement
 */
function allAchievementsWon(allAchievementsIndex) {
  for (var i = 1; i < allAchievementsIndex; i++) {
    if (!summary.achievements[`achievement${i}`].won) {
      return false;
    }
  }

  return true;
}

/**
 * Show achievements in achievements template
 * @param {*} viewedItems
 */
function showAchievements(viewedItems) {
  for (const achievement of _.keys(summary.achievements)) {
    document.querySelector(`#${achievement} .ns-title`).textContent = summary.achievements[achievement].title;
    document.querySelector(`#${achievement} .ns-description`).textContent =
      summary.achievements[achievement].description;
    if (summary.achievements[achievement].won) {
      document.querySelector(`#${achievement} i`).textContent = 'emoji_events';
      document.querySelector(`#${achievement} i`).classList.add('ns-icon-achievement-complete');
      $(`#${achievement} .ns-achievement-incomplete`).hide();
    } else {
      document.querySelector(`#${achievement} i`).textContent = 'lock';
      document.querySelector(`#${achievement} i`).classList.add('ns-icon-achievement-incomplete');
      document.querySelector(`#${achievement} .ns-achievement-incomplete`).textContent =
        summary.achievements[achievement].remaining;
      $(`#${achievement} .ns-achievement-info`).hide();
    }
  }
}

/**
 * Initializes the list of achievements and the title and description for each achievement
 */
function initializeAchievementsModel() {
  debug('Initializing achievements...');

  summary.achievements = {
    achievement1: {},
    achievement2: {},
    achievement3: {},
    achievement4: {},
    achievement5: {},
    achievement6: {},
    achievement7: {},
    achievement8: {},
    achievement9: {},
    achievement10: {},
  };

  for (const achievement of _.keys(summary.achievements)) {
    summary.achievements[achievement].title = chrome.i18n.getMessage(`${achievement}`);
    summary.achievements[achievement].description = chrome.i18n.getMessage(`${achievement}Description`);
  }

  debug('Initialized achievements', summary.achievements);
}
