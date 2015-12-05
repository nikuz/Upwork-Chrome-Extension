'use strict';

var templates = {
  prefix: '',
  suffix: ' ago',
  seconds: 'less than a minute',
  minute: 'about a minute',
  minutes: '%d minutes',
  hour: 'about an hour',
  hours: 'about %d hours',
  day: 'a day',
  days: '%d days',
  month: 'about a month',
  months: '%d months',
  year: 'about a year',
  years: '%d years'
};

var templateGet = function(t, n) {
  return templates[t] && templates[t].replace(/%d/i, Math.abs(Math.round(n)));
};

var timeAgo = function(time) {
  if (!time) return;
  time = time
    .replace(/\.\d+/, '')
    .replace('-', '/')
    .replace('-', '/')
    .replace('T', ' ')
    .replace('Z', ' UTC')
    .replace(/([\+\-]\d\d)\:?(\d\d)/, ' $1$2'); // -04:00 -> -0400

  time = new Date(time * 1000 || time);

  var now = new Date(),
    seconds = ((now.getTime() - time) * .001) >> 0,
    minutes = seconds / 60,
    hours = minutes / 60,
    days = hours / 24,
    years = days / 365;

  return templates.prefix + (seconds < 45 && templateGet('seconds', seconds) || seconds < 90 && templateGet('minute', 1) || minutes < 45 && templateGet('minutes', minutes) || minutes < 90 && templateGet('hour', 1) || hours < 24 && templateGet('hours', hours) || hours < 42 && templateGet('day', 1) || days < 30 && templateGet('days', days) || days < 45 && templateGet('month', 1) || days < 365 && templateGet('months', days / 30) || years < 1.5 && templateGet('year', 1) || templateGet('years', years)) + templates.suffix;
};

export default timeAgo;
