function hydrateFilters(items) {
  const parent = document.getElementById('filters');
  const select = parent.firstElementChild;
  const activeYears = getActiveYears(items);
  const activeFilters = getActiveFilters();

  debug(`active years ${activeYears}`);
  const defaultOption = buildOption('-');
  select.append(defaultOption);

  activeYears.forEach(year => {
    const isSelected = activeFilters.year === year;
    const option = buildOption(year, isSelected);
    select.append(option);
  });

  select.addEventListener('change', event => {
    const year = event.target.value;
    window.location = `https://www.netflix.com/settings/viewed?stats=true&year=${year}`;
  });
}

function getActiveYears(items) {
  const firstItem = items[0];
  const lastItem = items[items.length - 1];
  const newerYear = getYearFromDate(firstItem.date);
  const olderYear = getYearFromDate(lastItem.date);
  return _.range(olderYear, newerYear + 1);
}

function buildOption(value, selected) {
  const $option = $(`<option ${selected ? 'selected' : ''} value=${value}>${value}</option>`);
  return $option.get(0);
}

function getActiveFilters(items) {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const year = parseInt(urlSearchParams.get('year'));
  return { year };
}

function getYearFromDate(dateStr) {
  const date = new Date(dateStr);
  return date.getFullYear();
}

function getFilteredItems(items) {
  const year = getActiveFilters().year;

  if (!year) {
    return items;
  }

  debug(`filtering by year ${year}`);
  return items.filter(item => {
    return year === getYearFromDate(item.date);
  });
}
