const rewire = require('rewire');
const formatModule = rewire('../src/utils/format');
const secondsToYdhms = formatModule.__get__('secondsToYdhms');
const secondsToHoursMinutesSeconds = formatModule.__get__(
  'secondsToHoursMinutesSeconds'
);
const formatNumber = formatModule.__get__('formatNumber');
const formatFullDate = formatModule.__get__('formatFullDate');
const formatDate = formatModule.__get__('formatDate');
const formatDate4Title = formatModule.__get__('formatDate4Title');

describe('Formatters', () => {
  const WEEK_DAYS = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  };
  const MONTHS = {
    0: 'January',
    1: 'February',
    2: 'March',
    3: 'April',
    4: 'May',
    5: 'June',
    6: 'July',
    7: 'August',
    8: 'September',
    9: 'October',
    10: 'November',
    11: 'December',
  };

  beforeEach(() => {
    setLanguage('en');

    formatModule.__set__('WEEK_DAYS', WEEK_DAYS);
    formatModule.__set__('MONTHS', MONTHS);
  });

  it('should format a number of seconds into years, days, hours, minutes and seconds', async () => {
    let time = secondsToYdhms(0);
    expect(time).toEqual('0 seconds');

    time = secondsToYdhms(10);
    expect(time).toEqual('10 seconds');
    
    time = secondsToYdhms(75);
    expect(time).toEqual('1 minute, 15 seconds');

    time = secondsToYdhms(120);
    expect(time).toEqual('2 minutes, 0 seconds');

    time = secondsToYdhms(3600);
    expect(time).toEqual('1 hour, 0 minutes, 0 seconds');

    time = secondsToYdhms(3601);
    expect(time).toEqual('1 hour, 0 minutes, 1 second');

    time = secondsToYdhms(3660);
    expect(time).toEqual('1 hour, 1 minute, 0 seconds');
    
    time = secondsToYdhms(5726);
    expect(time).toEqual('1 hour, 35 minutes, 26 seconds');

    time = secondsToYdhms(86401);
    expect(time).toEqual('1 day, 0 hours, 0 minutes, 1 second');

    time = secondsToYdhms(31536000);
    expect(time).toEqual('1 year, 0 days, 0 hours, 0 minutes, 0 seconds');

    time = secondsToYdhms('31719845');
    expect(time).toEqual('1 year, 2 days, 3 hours, 4 minutes, 5 seconds');

    time = secondsToYdhms('63439690');
    expect(time).toEqual('2 years, 4 days, 6 hours, 8 minutes, 10 seconds');

    setLanguage('es');
    time = secondsToYdhms(0);
    expect(time).toEqual('0 segundos');

    time = secondsToYdhms(10);
    expect(time).toEqual('10 segundos');
    
    time = secondsToYdhms(75);
    expect(time).toEqual('1 minuto, 15 segundos');

    time = secondsToYdhms(120);
    expect(time).toEqual('2 minutos, 0 segundos');

    time = secondsToYdhms(3600);
    expect(time).toEqual('1 hora, 0 minutos, 0 segundos');

    time = secondsToYdhms(3601);
    expect(time).toEqual('1 hora, 0 minutos, 1 segundo');

    time = secondsToYdhms(3660);
    expect(time).toEqual('1 hora, 1 minuto, 0 segundos');
    
    time = secondsToYdhms(5726);
    expect(time).toEqual('1 hora, 35 minutos, 26 segundos');

    time = secondsToYdhms(86401);
    expect(time).toEqual('1 día, 0 horas, 0 minutos, 1 segundo');

    time = secondsToYdhms(31536000);
    expect(time).toEqual('1 año, 0 días, 0 horas, 0 minutos, 0 segundos');

    time = secondsToYdhms('31719845');
    expect(time).toEqual('1 año, 2 días, 3 horas, 4 minutos, 5 segundos');

    time = secondsToYdhms('63439690');
    expect(time).toEqual('2 años, 4 días, 6 horas, 8 minutos, 10 segundos');
  });

  it('should format a number of seconds hours, minutes and seconds', async () => {
    let time = secondsToHoursMinutesSeconds('86400');
    expect(time).toEqual('24:00:00');

    time = secondsToHoursMinutesSeconds('5025');
    expect(time).toEqual('01:23:45');

    time = secondsToHoursMinutesSeconds('1930');
    expect(time).toEqual('32:10');

    time = secondsToHoursMinutesSeconds('56');
    expect(time).toEqual('00:56');

    time = secondsToHoursMinutesSeconds(0);
    expect(time).toEqual('N/A');

    time = secondsToHoursMinutesSeconds(0, true);
    expect(time).toEqual('0');
  });

  it('should format a number with thousands separator', async () => {
    let number = formatNumber('123456789');
    expect(number).toEqual('123,456,789');

    setLanguage('es');

    number = formatNumber('123456789');
    expect(number).toEqual('123.456.789');
  });

  it('should format a date in milliseconds into a full date', async () => {
    let date = formatFullDate(1567872000000);
    expect(date).toEqual('9/7/19 18:00:00');

    setLanguage('es');

    date = formatFullDate(1567872000000);
    expect(date).toEqual('7/9/19 18:00:00');
  });

  it('should format a date in milliseconds into a date', async () => {
    let date = formatDate(1183334400000);
    expect(date).toEqual('7/2/07');

    setLanguage('es');

    date = formatDate(1183334400000);
    expect(date).toEqual('2/7/07');
  });

  it('should format a date in milliseconds into a full date for titles', async () => {
    let date = formatDate4Title(1183334400000);
    expect(date).toEqual('Monday, 02 July 2007');

    date = formatDate4Title(1567872000000, true);
    expect(date).toEqual('Saturday, 07 September 2019 18:00:00');

    setLanguage('es');

    date = formatDate4Title(1183334400000);
    expect(date).toEqual('Lunes, 02 Julio 2007');

    date = formatDate4Title(1567872000000, true);
    expect(date).toEqual('Sábado, 07 Septiembre 2019 18:00:00');
  });


  // Private functions
  function setLanguage(language) {
    translations = {
      "second": "segundo",
      "minute": "minuto",
      "hour": "hora",
      "day": "día",
      "year": "año",
      "Monday": "Lunes",
      "Tuesday": "Martes",
      "Wednesday": "Miércoles",
      "Thursday": "Jueves",
      "Friday": "Viernes",
      "Saturday": "Sábado",
      "Sunday": "Domingo",
      "January": "Enero",
      "February": "Febrero",
      "March": "Marzo",
      "April": "Abril",
      "May": "Mayo",
      "June": "Junio",
      "July": "Julio",
      "August": "Agosto",
      "September": "Septiembre",
      "October": "Octubre",
      "November": "Noviembre",
      "December": "Deciembre"
    };

    formatModule.__set__('chrome', {
      i18n: {
        getMessage: label => {
          return language === 'en' ? label : translations[label];
        },
        getUILanguage: () => {
          return language;
        },
      },
    });
  };
  
});
