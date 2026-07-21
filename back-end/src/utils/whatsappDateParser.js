"use strict";

const pad = (n) => String(n).padStart(2, "0");

const toDateString = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDate = (input, now = new Date()) => {
  if (!input) return null;
  const text = String(input).trim().toLowerCase();

  if (["today", "now", "tonight"].includes(text)) {
    return toDateString(now);
  }
  if (text === "tomorrow" || text === "tmr" || text === "tmrw") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return toDateString(d);
  }
  if (text === "day after tomorrow" || text === "day after" || text === "overmorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    return toDateString(d);
  }
  if (text === "next week") {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return toDateString(d);
  }

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    if (!Number.isNaN(date.getTime())) return toDateString(date);
  }

  const dmyMatch = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmyMatch) {
    let [, dd, mm, yy] = dmyMatch;
    dd = parseInt(dd);
    mm = parseInt(mm);
    yy = parseInt(yy);
    if (yy < 100) yy += 2000;
    const date = new Date(yy, mm - 1, dd);
    if (!Number.isNaN(date.getTime())) return toDateString(date);
  }

  const mdyMatch = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (mdyMatch) {
    let [, mm, dd, yy] = mdyMatch;
    mm = parseInt(mm);
    dd = parseInt(dd);
    yy = parseInt(yy);
    const date = new Date(yy, mm - 1, dd);
    if (!Number.isNaN(date.getTime())) return toDateString(date);
  }

  const weekdayMap = {
    sunday: 0, sun: 0,
    monday: 1, mon: 1,
    tuesday: 2, tue: 2, tues: 2,
    wednesday: 3, wed: 3,
    thursday: 4, thu: 4, thurs: 4,
    friday: 5, fri: 5,
    saturday: 6, sat: 6,
  };
  const nextMatch = text.match(/^next\s+(\w+)$/);
  const weekdayKey = nextMatch ? nextMatch[1] : text;
  if (weekdayMap[weekdayKey] !== undefined) {
    const targetDay = weekdayMap[weekdayKey];
    const d = new Date(now);
    const currentDay = d.getDay();
    let diff = targetDay - currentDay;
    if (nextMatch || diff <= 0) {
      diff = diff <= 0 ? diff + 7 : diff;
      if (nextMatch && diff === 0) diff = 7;
    }
    d.setDate(d.getDate() + diff);
    return toDateString(d);
  }

  return null;
};

const parseTime = (input) => {
  if (!input) return null;
  const text = String(input).trim().toLowerCase().replace(/\s+/g, "");

  const ampmMatch = text.match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm)$/);
  if (ampmMatch) {
    let [, hh, mm, period] = ampmMatch;
    hh = parseInt(hh);
    mm = mm ? parseInt(mm) : 0;
    if (period === "pm" && hh < 12) hh += 12;
    if (period === "am" && hh === 12) hh = 0;
    if (hh > 23 || mm > 59) return null;
    return `${pad(hh)}:${pad(mm)}:00`;
  }

  const colonMatch = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (colonMatch) {
    let [, hh, mm, ss] = colonMatch;
    hh = parseInt(hh);
    mm = parseInt(mm);
    ss = ss ? parseInt(ss) : 0;
    if (hh > 23 || mm > 59 || ss > 59) return null;
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  }

  const bareHourMatch = text.match(/^(\d{1,2})$/);
  if (bareHourMatch) {
    const hh = parseInt(bareHourMatch[1]);
    if (hh > 23) return null;
    return `${pad(hh)}:00:00`;
  }

  const militaryMatch = text.match(/^(\d{3,4})$/);
  if (militaryMatch) {
    const digits = militaryMatch[1];
    const hh = parseInt(digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2));
    const mm = parseInt(digits.length === 3 ? digits.slice(1) : digits.slice(2));
    if (hh > 23 || mm > 59) return null;
    return `${pad(hh)}:${pad(mm)}:00`;
  }

  return null;
};

module.exports = {
  parseDate,
  parseTime,
  toDateString,
};
