// Church calendar and service schedule, shared by the build and the browser.
// This file must stay dependency-free: the build inlines it into site.js
// (with "export" removed), so the hero's "today" panel, the monthly view
// and the feast list stay correct between rebuilds.
//
// Dates are civil dates held as UTC noon Date objects. Fixed feasts and the
// menaion are keyed by CHURCH date "MM-DD":
//   calendar style "julian"          church date = civil date - 13 days (1900 to 2099)
//   calendar style "revised-julian"  church date = civil date
// Movable feasts are keyed by days from Pascha, which is always computed on
// the Julian calendar (Orthodox Paschalion), whatever the calendar style.

export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const VIGIL_RANKS = ['great', 'vigil', 'patronal'];

export function civilDate(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d, 12));
}
export function addDays(dt, n) {
  return new Date(dt.getTime() + n * 86400000);
}
export function isoDate(dt) {
  return dt.toISOString().slice(0, 10);
}
export function fromIso(s) {
  const [y, m, d] = s.split('-').map(Number);
  return civilDate(y, m, d);
}
const pad = (n) => String(n).padStart(2, '0');
const mmdd = (dt) => `${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;

export function julianOffset(year) {
  return Math.floor(year / 100) - Math.floor(year / 400) - 2;
}

// Orthodox Pascha (Meeus' Julian algorithm), returned as a civil date.
export function pascha(year) {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return addDays(civilDate(year, month, day), julianOffset(year));
}

export function churchDay(cal, dt) {
  return cal.style === 'julian' ? addDays(dt, -julianOffset(dt.getUTCFullYear())) : dt;
}

export function feastsOn(cal, dt) {
  const key = mmdd(churchDay(cal, dt));
  const fromPascha = Math.round((dt - pascha(dt.getUTCFullYear())) / 86400000);
  return cal.feasts.filter((f) => (f.date ? f.date === key : f.offset === fromPascha));
}

const byTime = (a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0);
const EVENING = '15:00';

function feastDay(cal, f) {
  return f.services || (VIGIL_RANKS.includes(f.rank) ? cal.feastPattern.day : null);
}
function feastEve(cal, f) {
  return f.eve || (VIGIL_RANKS.includes(f.rank) ? cal.feastPattern.eve : null);
}

export function servicesFor(cal, dt) {
  let list = (cal.week[DAY_KEYS[dt.getUTCDay()]] || []).slice();
  const today = feastsOn(cal, dt).find((f) => feastDay(cal, f));
  if (today) {
    const day = feastDay(cal, today);
    list = today.replaceDay ? day.slice() : list.filter((s) => s.time >= EVENING).concat(day.filter((s) => s.time < EVENING));
  }
  const tomorrow = feastsOn(cal, addDays(dt, 1)).find((f) => feastEve(cal, f));
  if (tomorrow) list = list.filter((s) => s.time < EVENING).concat(feastEve(cal, tomorrow));
  return list.sort(byTime);
}

export function dayInfo(cal, dt) {
  const church = churchDay(cal, dt);
  const feasts = feastsOn(cal, dt);
  const menaion = cal.menaion[mmdd(church)] || '';
  const names = feasts.map((f) => f.name).filter((n) => n && !menaion.includes(n));
  return {
    dt,
    iso: isoDate(dt),
    church,
    feasts,
    great: feasts.some((f) => f.rank === 'great' || f.rank === 'patronal'),
    commemoration: [...names, menaion].filter(Boolean).join('; '),
    services: servicesFor(cal, dt)
  };
}

export function upcomingFeasts(cal, from, count, ranks = ['great', 'patronal']) {
  const out = [];
  for (let i = 0; i < 420 && out.length < count; i++) {
    const dt = addDays(from, i);
    for (const f of feastsOn(cal, dt)) {
      if (!ranks.includes(f.rank)) continue;
      out.push({ dt, feast: f, eve: feastEve(cal, f) || [], day: servicesFor(cal, dt).filter((s) => s.time < EVENING) });
    }
  }
  return out.slice(0, count);
}

// Current civil date and HH:MM at the monastery, whatever the visitor's zone.
export function nowAt(tz, date = new Date()) {
  const parts = {};
  for (const p of new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date)) {
    parts[p.type] = p.value;
  }
  return { dt: civilDate(+parts.year, +parts.month, +parts.day), hm: `${parts.hour}:${parts.minute}` };
}

// ---- formatting -----------------------------------------------------------

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const e = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ESC[c]);
const cap = (s) => (s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s);
const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));

export function fmtDate(cal, dt, opts) {
  return cap(new Intl.DateTimeFormat(cal.locale, { ...opts, timeZone: 'UTC' }).format(dt));
}

export function fmtTime(cal, hm) {
  const [h, m] = hm.split(':').map(Number);
  return new Intl.DateTimeFormat(cal.locale, { hour: 'numeric', minute: '2-digit', hour12: cal.hour12, timeZone: 'UTC' }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}

const serviceName = (cal, s) => cal.services[s.service] || s.service;

export function churchDateLine(cal, dt) {
  if (cal.style !== 'julian') return '';
  return fill(cal.s.churchDate, { date: fmtDate(cal, churchDay(cal, dt), { month: 'long', day: 'numeric' }) });
}

export function serviceListHtml(cal, services, nowHm) {
  if (!services.length) return `<p class="muted">${e(cal.s.noServices)}</p>`;
  const nextIndex = nowHm ? services.findIndex((s) => s.time >= nowHm) : -1;
  return `<ol class="service-list">${services
    .map((s, i) => {
      const state = nowHm ? (i === nextIndex ? ' is-next' : i < nextIndex || nextIndex === -1 ? ' is-past' : '') : '';
      const badge = state === ' is-next' ? `<span class="service-list__badge">${e(cal.s.next)}</span>` : '';
      const note = s.note ? `<span class="service-list__note">${e(s.note)}</span>` : '';
      return `<li class="service-list__item${state}"><span class="service-list__name">${e(serviceName(cal, s))}${note}</span>${badge}<time class="service-list__time" datetime="${e(s.time)}">${e(fmtTime(cal, s.time))}</time></li>`;
    })
    .join('')}</ol>`;
}

export function visitingLine(cal, dt) {
  const ranges = cal.visiting[DAY_KEYS[dt.getUTCDay()]] || [];
  if (!ranges.length) return cal.s.closedToday;
  return ranges.map(([a, b]) => fill(cal.s.range, { from: fmtTime(cal, a), to: fmtTime(cal, b) })).join(', ');
}

export function todayHtml(cal, now) {
  const info = dayInfo(cal, now.dt);
  const church = churchDateLine(cal, now.dt);
  const saint = info.commemoration
    ? `<p class="today__saint">${e(info.commemoration)}</p>`
    : `<p class="today__saint today__saint--none">${e(cal.s.noCommemoration)}${cal.fullCalendarUrl ? ` <a href="${e(cal.fullCalendarUrl)}" target="_blank" rel="noopener">${e(cal.s.fullCalendar)}</a>` : ''}</p>`;
  return `<p class="today__date">${e(fmtDate(cal, now.dt, { weekday: 'long', month: 'long', day: 'numeric' }))}</p>${church ? `<p class="today__church">${e(church)}</p>` : ''}
<div class="today__block"><p class="today__label">${e(cal.s.commemorated)}</p>${saint}</div>
<div class="today__block"><p class="today__label">${e(cal.s.servicesToday)}</p>${serviceListHtml(cal, info.services, now.hm)}</div>
<div class="today__block today__block--visiting"><p class="today__label">${e(cal.s.visitingToday)}</p><p class="today__visiting">${e(visitingLine(cal, now.dt))}</p></div>`;
}

export function dayDetailsHtml(cal, dt) {
  const info = dayInfo(cal, dt);
  const church = churchDateLine(cal, dt);
  return `<h3 class="day-details__title">${e(fmtDate(cal, dt, { weekday: 'long', month: 'long', day: 'numeric' }))}</h3>${church ? `<p class="day-details__church">${e(church)}</p>` : ''}${info.commemoration ? `<p class="day-details__saint${info.great ? ' is-great' : ''}">${e(info.commemoration)}</p>` : ''}${serviceListHtml(cal, info.services)}`;
}

export function monthHtml(cal, year, month, selectedIso, todayIso) {
  const first = civilDate(year, month, 1);
  const start = (first.getUTCDay() - cal.weekStart + 7) % 7;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const heads = [];
  for (let i = 0; i < 7; i++) {
    const dt = civilDate(2024, 1, 7 + ((cal.weekStart + i) % 7)); // 2024-01-07 is a Sunday
    heads.push(`<span class="month__dow" aria-hidden="true">${e(fmtDate(cal, dt, { weekday: 'short' }))}</span>`);
  }
  const cells = [];
  for (let i = 0; i < start; i++) cells.push('<span class="month__pad"></span>');
  for (let d = 1; d <= days; d++) {
    const dt = civilDate(year, month, d);
    const iso = isoDate(dt);
    const info = dayInfo(cal, dt);
    const church = cal.style === 'julian' ? churchDay(cal, dt).getUTCDate() : '';
    const feast = info.feasts.find((f) => f.rank === 'great' || f.rank === 'patronal');
    const cls = ['month__day', info.great && 'is-great', iso === todayIso && 'is-today', iso === selectedIso && 'is-selected', dt.getUTCDay() === 0 && 'is-sunday'].filter(Boolean).join(' ');
    const label = `${fmtDate(cal, dt, { weekday: 'long', month: 'long', day: 'numeric' })}${feast ? `. ${feast.name}` : ''}`;
    cells.push(
      `<button type="button" class="${cls}" data-date="${iso}" aria-pressed="${iso === selectedIso}" aria-label="${e(label)}"><span class="month__num">${d}</span>${church ? `<span class="month__church" aria-hidden="true">${church}</span>` : ''}${feast ? `<span class="month__feast" aria-hidden="true">${e(feast.short || feast.name)}</span>` : ''}</button>`
    );
  }
  return `<div class="month__grid" role="group">${heads.join('')}${cells.join('')}</div>`;
}

export function feastListHtml(cal, items) {
  if (!items.length) return `<p class="muted">${e(cal.s.noFeasts)}</p>`;
  return `<ol class="feast-list">${items
    .map(({ dt, feast, eve, day }) => {
      const church = churchDateLine(cal, dt);
      const eveText = eve.map((s) => `${serviceName(cal, s)} ${fmtTime(cal, s.time)}`).join(', ');
      const dayText = day.map((s) => `${serviceName(cal, s)} ${fmtTime(cal, s.time)}`).join(', ');
      return `<li class="feast-list__item${feast.rank === 'patronal' ? ' is-patronal' : ''}" data-date="${isoDate(dt)}">
<div class="feast-list__date"><span class="feast-list__day">${dt.getUTCDate()}</span><span class="feast-list__month">${e(fmtDate(cal, dt, { month: 'short' }).replace('.', ''))}</span></div>
<div class="feast-list__body"><h3 class="feast-list__name">${e(feast.name)}</h3><p class="feast-list__when">${e(fmtDate(cal, dt, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}${church ? ` · ${e(church)}` : ''}</p>${eveText ? `<p class="feast-list__services"><span>${e(cal.s.eve)}</span> ${e(eveText)}</p>` : ''}${dayText ? `<p class="feast-list__services"><span>${e(cal.s.feastDay)}</span> ${e(dayText)}</p>` : ''}</div></li>`;
    })
    .join('')}</ol>`;
}
