/**
 * Calculate achievements based on viewed items
 * @param {*} viewedItems
 */
function calculateAchievements(viewedItems) {
  initializeAchievementsModel();
  console.log('Calculating achievements...');
  // TODO Calculate time when each achievement won
  // Achievement 1
  summary.achievements.achievement1.won = summary.moviesCount >= 1;

  // Achievement 2
  summary.achievements.achievement2.won = summary.episodesCount >= 1;

  // Achievement 3
  summary.achievements.achievement3.won = summary.moviesCount >= 1000;

  // Achievement 4
  summary.achievements.achievement4.won = summary.seriesCount >= 100;

  // Achievement 5
  summary.achievements.achievement5.won = summary.maxTimeInDate >= 21600; // 6 hours

  // Achievement 6
  summary.achievements.achievement6.won = summary.maxTimeInDate >= 43200; //12 hours

  // Achievement 7
  summary.achievements.achievement7.won = summary.deviceCount >= 5;

  // Achievement 8
  summary.achievements.achievement8.won = monthDiff(summary.firstUse, new Date()) >= 24;

  // Achievement 9
  summary.achievements.achievement9.won = summary.viewedItemsCount >= 5000;

  // Achievement 10
  summary.achievements.achievement10.won = allAchievementsWon(10);

  console.log('Calculated achievements', summary.achievements);
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
  console.log('Mostrando logros!', viewedItems);

  // TODO Show time when each achievement won
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
      document.querySelector(`#${achievement} .ns-achievement-incomplete`).textContent = chrome.i18n.getMessage(
        `incomplete`
      );
      $(`#${achievement} .ns-achievement-info`).hide();
    }
  }
}

/**
 * Initializes the list of achievements and the title and description for each achievement
 */
function initializeAchievementsModel() {
  console.log('Initializing achievements...');

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
    console.log('Achievement:', achievement);
    summary.achievements[achievement].title = chrome.i18n.getMessage(`${achievement}`);
    summary.achievements[achievement].description = chrome.i18n.getMessage(`${achievement}Description`);
    console.log('Summary achievement', summary.achievements);
  }

  console.log('Initialized achievements', summary.achievements);
}
