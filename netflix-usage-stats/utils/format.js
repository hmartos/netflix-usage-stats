/**
 * Format time from seconds to years, days, hours, minutes and seconds
 * @param {*} seconds
 */
function secondsToYdhms(seconds) {
  seconds = Number(seconds);
  const y = Math.floor(seconds / 31536000);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const yDisplay =
    y > 0
      ? y +
        (y === 1
          ? ` ${chrome.i18n.getMessage('year')}, `
          : ` ${chrome.i18n.getMessage('year')}s, `)
      : '';
  const dDisplay =
    d > 0
      ? d +
        (d === 1
          ? ` ${chrome.i18n.getMessage('day')}, `
          : ` ${chrome.i18n.getMessage('day')}s, `)
      : '';
  const hDisplay =
    h > 0 || (d > 0 && h === 0)
      ? h +
        (h === 1
          ? ` ${chrome.i18n.getMessage('hour')}, `
          : ` ${chrome.i18n.getMessage('hour')}s, `)
      : '';
  const mDisplay =
    m > 0 || (h > 0 && m === 0)
      ? m +
        (m === 1
          ? ` ${chrome.i18n.getMessage('minute')}, `
          : ` ${chrome.i18n.getMessage('minute')}s, `)
      : '';
  const sDisplay =
    s +
    (s === 1
      ? ` ${chrome.i18n.getMessage('second')}`
      : ` ${chrome.i18n.getMessage('second')}s`);
  return yDisplay + dDisplay + hDisplay + mDisplay + sDisplay;
}

/**
 * Format duration from seconds to minutes
 * @param {*} seconds
 */
function secondsToHoursMinutesSeconds(seconds, showZero = false) {
  const durationFormatted = new Date(seconds * 1000)
    .toISOString()
    .substr(11, 8);
  if (durationFormatted === '00:00:00') {
    if (showZero) {
      return '0';
    }
    return 'N/A';
  } else if (durationFormatted.startsWith('00')) {
    return durationFormatted.substr(3, 5);
  } else {
    return durationFormatted;
  }
}

/**
 * Format number adding thousands separator (comma in english and point in spanish)
 * @param {*} number
 */
function formatNumber(number) {
  if (chrome.i18n.getUILanguage() === 'es') {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  } else {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

/**
 * Format Netflix date with timestamp
 * Format depends on locale
 * @param number dateMilliseconds
 */
function formatFullDate(dateMilliseconds) {
  const date = new Date(dateMilliseconds);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date
    .getFullYear()
    .toString()
    .substr(-2);
  const hours = date.getHours() > 9 ? date.getHours() : `0${date.getHours()}`;
  const minutes =
    date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`;
  const seconds =
    date.getSeconds() > 9 ? date.getSeconds() : `0${date.getSeconds()}`;

  if (chrome.i18n.getUILanguage() === 'es') {
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  } else {
    return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
  }
}

/**
 * Format Netflix date
 * Format depends on locale
 * @param number dateMilliseconds
 */
function formatDate(dateMilliseconds) {
  const date = new Date(dateMilliseconds);
  if (chrome.i18n.getUILanguage() === 'es') {
    return `${date.getDate()}/${date.getMonth() + 1}/${date
      .getFullYear()
      .toString()
      .substr(-2)}`;
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}/${date
      .getFullYear()
      .toString()
      .substr(-2)}`;
  }
}

/**
 * Format date to show it on titles
 * Format depends on locale
 * @param number dateMilliseconds
 */
function formatDate4Title(dateMilliseconds, showHours) {
  const date = new Date(dateMilliseconds);
  const dayOfWeek = chrome.i18n.getMessage(WEEK_DAYS[date.getDay()]);
  const day = date.getDate() > 9 ? date.getDate() : `0${date.getDate()}`;
  const month = chrome.i18n.getMessage(MONTHS[date.getMonth()]);
  const year = date.getFullYear();

  if (!showHours) {
    return `${dayOfWeek}, ${day} ${month} ${year}`;
  }

  const hours = date.getHours() > 9 ? date.getHours() : `0${date.getHours()}`;
  const minutes =
    date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`;
  const seconds =
    date.getSeconds() > 9 ? date.getSeconds() : `0${date.getSeconds()}`;
  return `${dayOfWeek}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
}
