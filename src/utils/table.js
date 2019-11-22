/**
 * Create datatable
 */
function createDatatable(viewedItems) {
  const dataset = viewedItems.map(viewedItem => {
    viewedItem.title = viewedItem.series ? `${viewedItem.seriesTitle} - ${viewedItem.title}` : `${viewedItem.title}`;
    viewedItem.dateFormatted = formatFullDate(viewedItem.date);
    viewedItem.durationFormatted = secondsToHoursMinutesSeconds(viewedItem.duration);
    viewedItem.type = viewedItem.series ? `${chrome.i18n.getMessage('serie')}` : `${chrome.i18n.getMessage('movie')}`;
    return viewedItem;
  });
  debug(`Datatable data`, dataset);

  const datatable = $('#activityDataTable').DataTable({
    data: dataset,
    columns: [
      { data: 'title' },
      { data: 'date' },
      { data: 'date' }, // To pass the date in milliseconds to renderDateColumn function
      { data: 'duration' },
      { data: 'durationFormatted' },
      { data: 'type' },
    ],
    columnDefs: [
      { targets: [0], className: 'dt-body-left', render: renderTitleColumn },
      { targets: [1], visible: false, searchable: false }, // Hide column date and make it not searchable
      { targets: [2], orderData: 1, render: renderDateColumn }, // Order column dateFormatted by hidden column date
      { targets: [3], visible: false, searchable: false }, // Hide column duration and make it not searchable
      {
        targets: [4],
        orderData: 3,
        className: 'dt-body-right',
        render: renderDurationColumn,
      }, // Order column durationFormatted by hidden column duration
      { targets: [5], render: renderTypeColumn },
    ],
    order: [[1, 'desc']],
    language: {
      processing: `${chrome.i18n.getMessage('processing')}`,
      search: `${chrome.i18n.getMessage('search')}`,
      lengthMenu: `${chrome.i18n.getMessage('lengthMenu')}`,
      info: `${chrome.i18n.getMessage('info')}`,
      infoEmpty: `${chrome.i18n.getMessage('infoEmpty')}`,
      infoFiltered: `${chrome.i18n.getMessage('infoFiltered')}`,
      loadingRecords: `${chrome.i18n.getMessage('loadingRecords')}`,
      zeroRecords: `${chrome.i18n.getMessage('zeroRecords')}`,
      emptyTable: `${chrome.i18n.getMessage('emptyTable')}`,
      aria: {
        sortAscending: `${chrome.i18n.getMessage('sortAscending')}`,
        sortDescending: `${chrome.i18n.getMessage('sortDescending')}`,
      },
    },
    deferRender: true,
    scrollY: 375,
    scrollCollapse: true,
    scroller: true,
    responsive: {
      details: {
        renderer: function(api, rowIdx, columns) {
          var data = $.map(columns, function(col, i) {
            return col.hidden
              ? '<tr data-dt-row="' +
                  col.rowIndex +
                  '" data-dt-column="' +
                  col.columnIndex +
                  '">' +
                  '<td>' +
                  col.title +
                  ':' +
                  '</td> ' +
                  '<td>' +
                  col.data +
                  '</td>' +
                  '</tr>'
              : '';
          }).join('');

          return data ? $('<table/>').append(data) : false;
        },
      },
    },
  });

  // Fixed header
  new $.fn.dataTable.FixedHeader(datatable);

  // Neutralise accents
  $('#activityDataTable_filter label input').on('focus', function() {
    this.setAttribute('id', 'datatableSearchInput');

    // Remove accented character from search input as well
    $('#datatableSearchInput').keyup(function() {
      datatable.search(jQuery.fn.DataTable.ext.type.search.string(this.value)).draw();
    });
  });
}

/**
 * Render datatable title column
 * @param {*} data
 * @param {*} type
 * @param {*} row
 * @param {*} meta
 */
function renderTitleColumn(title, type, row, meta) {
  return `<div class="ns-title-column">${title}</div>`;
}

/**
 * Render datatable date column
 * @param {*} data
 * @param {*} type
 * @param {*} row
 * @param {*} meta
 */
function renderDateColumn(date, type, row, meta) {
  return `<div class="ns-date-column" title="${formatDate4Title(date, true)}">${formatFullDate(date)}</div>`;
}

/**
 * Render datatable duration column
 * @param {*} data
 * @param {*} type
 * @param {*} row
 * @param {*} meta
 */
function renderDurationColumn(duration, type, row, meta) {
  return `<div class="ns-duration-column">${duration}</div>`;
}

/**
 * Render datatable type column
 * @param {*} data
 * @param {*} type
 * @param {*} row
 * @param {*} meta
 */
function renderTypeColumn(titleType, type, row, meta) {
  return `<div class="ns-type-column">${titleType}</div>`;
}
