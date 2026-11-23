// Monastery sections: the hero with today's cycle of services, the abbot,
// the patron saint, the daily cycle, the schedule views and visiting hours.
import { html, raw, attrs, cx } from '../lib/html.mjs';
import { calendarData } from '../lib/context.mjs';
import * as cal from '../lib/calendar.mjs';
import { sectionHead, actions, figure, image, icon, eyebrow, cross, art, button } from './primitives.mjs';

// Build-time "now" (monastery time zone) so the page reads correctly
// without JavaScript; site.js refreshes these panels on load.
const buildNow = (ctx) => cal.nowAt(ctx.site.timezone, process.env.BUILD_DATE ? new Date(process.env.BUILD_DATE) : new Date());

function todayPanel(ctx, { heading, compact = false } = {}) {
  const data = calendarData(ctx);
  const now = buildNow(ctx);
  const { contact } = ctx.site;
  return html`<div class="${cx('today', compact && 'today--compact')}" data-today>
    <div class="today__head">${cross('today__cross')}<h2 class="today__heading">${heading || ctx.t('calendar.today')}</h2></div>
    <div class="today__body" data-today-body>${raw(cal.todayHtml(data, now))}</div>
    <div class="today__actions">
      ${contact.directionsUrl ? html`<a class="btn btn--secondary" href="${contact.directionsUrl}" target="_blank" rel="noopener">${icon('pin', 'btn__icon')}<span>${ctx.t('visit.directions')}</span></a>` : ''}
      ${ctx.content.index.pages.services ? html`<a class="btn btn--link" href="${ctx.pagePath('services', { anchor: 'schedule' })}"><span>${ctx.t('calendar.fullSchedule')}</span>${icon('arrow', 'btn__icon btn__icon--end flip-rtl')}</a>` : ''}
    </div>
  </div>`;
}

export function heroToday(p, ctx) {
  return html`<section class="hero" id="${p.id}" data-section-type="hero-today">
    <div class="hero__media">${image(p.image, ctx, { className: 'hero__img', priority: true, sizes: '100vw' })}</div>
    <div class="hero__shade"></div>
    <div class="container hero__inner">
      <div class="hero__text">
        ${eyebrow(ctx.l(p.eyebrow))}
        <h1 class="hero__title">${ctx.text(p.title || ctx.site.name)}</h1>
        ${p.lead ? html`<div class="hero__lead">${ctx.md(p.lead)}</div>` : ''}
        ${actions(p.actions, ctx, 'hero__actions')}
      </div>
      ${todayPanel(ctx, { heading: ctx.l(p.todayTitle) })}
    </div>
    ${p.image?.src && ctx.credit(p.image.src) ? html`<p class="hero__credit">${ctx.text(ctx.credit(p.image.src).caption)}</p>` : ''}
  </section>`;
}

export function today(p, ctx) {
  const style = ctx.content.services.calendar;
  return html`<div class="today-section">
    <div class="today-section__text">${sectionHead(p, ctx)}<div class="prose">${ctx.md(style.note)}</div></div>
    ${todayPanel(ctx, { heading: ctx.l(p.panelTitle), compact: true })}
  </div>`;
}

export function person(p, ctx) {
  return html`<div class="person">
    <div class="person__media reveal">${figure(p.image || { art: 'portrait', alt: p.name }, ctx, { shape: 'arch' })}</div>
    <div class="person__text">
      ${sectionHead(p, ctx)}
      <p class="person__name">${ctx.text(p.name)}</p>
      ${p.role ? html`<p class="person__role">${ctx.text(p.role)}</p>` : ''}
      <div class="prose">${ctx.md(p.body)}</div>
      ${actions(p.actions, ctx)}
    </div>
  </div>`;
}

export function patron(p, ctx) {
  const iconImg = p.icon || (ctx.site.logo.icon ? { src: ctx.site.logo.icon, alt: p.name } : { art: 'patron-icon', alt: p.iconAlt || p.name });
  return html`<div class="patron">
    <div class="patron__kiot reveal">
      <div class="kiot">
        ${cross('kiot__cross')}
        <div class="kiot__case"><div class="kiot__window">${image(iconImg, ctx, { className: 'kiot__icon' })}</div></div>
        <div class="kiot__ledge"></div>
      </div>
      ${p.iconCaption ? html`<p class="patron__caption">${ctx.text(p.iconCaption)}</p>` : ''}
    </div>
    <div class="patron__text">
      ${sectionHead(p, ctx)}
      <p class="patron__name">${ctx.text(p.name)}</p>
      ${p.feastDay ? html`<p class="patron__feast">${icon('calendar')}${ctx.text(p.feastDay)}</p>` : ''}
      <div class="prose">${ctx.md(p.body)}</div>
      ${p.treasures?.length
        ? html`<h3 class="patron__subhead">${ctx.text(p.treasuresTitle)}</h3><ul class="treasures">${p.treasures.map(
            (t) => html`<li class="treasures__item">${icon(t.icon || 'candle')}<div><p class="treasures__title">${ctx.text(t.title)}</p><div class="treasures__text">${ctx.md(t.text)}</div></div></li>`
          )}</ul>`
        : ''}
    </div>
  </div>`;
}

export function dailyCycle(p, ctx) {
  const { services, week } = ctx.content.services;
  const data = calendarData(ctx);
  const day = week[p.timesFrom || 'tue'] || [];
  return html`${sectionHead(p, ctx, { align: 'center' })}<ol class="cycle">${p.services.map((id, i) => {
    const s = services[id];
    const entry = day.find((d) => d.service === id);
    return html`<li class="cycle__item reveal" style="--i:${i}">
      <span class="cycle__hour">${entry ? cal.fmtTime(data, entry.time) : ''}</span>
      <h3 class="cycle__name">${ctx.text(s.name)}</h3>
      <p class="cycle__about">${ctx.text(s.about)}</p>
    </li>`;
  })}</ol>${p.note ? html`<p class="cycle__note">${ctx.text(p.note)}</p>` : ''}`;
}

const DAY_ORDER = (start) => Array.from({ length: 7 }, (_, i) => cal.DAY_KEYS[(start + i) % 7]);

function weekTable(ctx, data) {
  const { week } = ctx.content.services;
  const names = data.services;
  return html`<div class="week">${DAY_ORDER(data.weekStart).map((key) => {
    const ref = cal.civilDate(2024, 1, 7 + cal.DAY_KEYS.indexOf(key));
    return html`<div class="${cx('week__day', key === 'sun' && 'is-sunday')}"><h3 class="week__name">${cal.fmtDate(data, ref, { weekday: 'long' })}</h3><ul class="week__list">${(week[key] || []).map(
      (s) => html`<li><time datetime="${s.time}">${cal.fmtTime(data, s.time)}</time><span>${names[s.service]}${s.note ? html` <small>${ctx.text(s.note)}</small>` : ''}</span></li>`
    )}</ul></div>`;
  })}</div>`;
}

export function schedule(p, ctx) {
  const data = calendarData(ctx);
  const now = buildNow(ctx);
  const y = now.dt.getUTCFullYear();
  const m = now.dt.getUTCMonth() + 1;
  const iso = cal.isoDate(now.dt);
  return html`${sectionHead(p, ctx)}
  <div class="schedule" data-schedule>
    <div class="tabs" role="tablist" aria-label="${ctx.l(p.title)}">
      <button type="button" role="tab" id="tab-week" aria-controls="panel-week" aria-selected="true" class="tabs__tab">${ctx.t('schedule.week')}</button>
      <button type="button" role="tab" id="tab-month" aria-controls="panel-month" aria-selected="false" class="tabs__tab" tabindex="-1">${ctx.t('schedule.month')}</button>
    </div>
    <div class="schedule__panel" role="tabpanel" id="panel-week" aria-labelledby="tab-week">${weekTable(ctx, data)}
      <p class="schedule__note">${ctx.text(ctx.content.services.weekNote)}</p></div>
    <div class="schedule__panel" role="tabpanel" id="panel-month" aria-labelledby="tab-month" hidden>
      <div class="month" data-month data-year="${y}" data-month-num="${m}">
        <div class="month__nav">
          <button type="button" class="month__step" data-month-step="-1" aria-label="${ctx.t('schedule.prevMonth')}">${icon('chevron', 'icon month__prev')}</button>
          <h3 class="month__title" data-month-title aria-live="polite">${cal.fmtDate(data, cal.civilDate(y, m, 1), { month: 'long', year: 'numeric' })}</h3>
          <button type="button" class="month__step" data-month-step="1" aria-label="${ctx.t('schedule.nextMonth')}">${icon('chevron', 'icon month__next')}</button>
        </div>
        <div data-month-grid>${raw(cal.monthHtml(data, y, m, iso, iso))}</div>
        <div class="day-details" data-day-details aria-live="polite">${raw(cal.dayDetailsHtml(data, now.dt))}</div>
        <p class="month__legend"><span class="month__key month__key--great"></span>${ctx.t('schedule.legendFeast')}${data.style === 'julian' ? html` <span class="month__key month__key--church">10</span>${ctx.t('schedule.legendChurch')}` : ''}</p>
      </div>
    </div>
  </div>`;
}

export function feastList(p, ctx) {
  const data = calendarData(ctx);
  const items = cal.upcomingFeasts(data, buildNow(ctx).dt, p.limit || 6);
  return html`${sectionHead(p, ctx)}<div data-feasts data-limit="${p.limit || 6}">${raw(cal.feastListHtml(data, items))}</div>${actions(p.actions, ctx)}`;
}

export function livestream(p, ctx) {
  const url = ctx.site.livestream?.url;
  return html`<div class="livestream">
    <div class="livestream__text">${sectionHead(p, ctx)}</div>
    ${url
      ? html`<div class="livestream__frame"><iframe src="${url}" title="${ctx.l(p.title)}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`
      : html`<div class="livestream__placeholder">${icon('play', 'icon livestream__play')}<p>${ctx.text(p.placeholder)}</p></div>`}
  </div>`;
}

export function visitingHours(p, ctx) {
  const data = calendarData(ctx);
  const { visiting, contact } = ctx.site;
  return html`<div class="visiting">
    <div class="visiting__hours">
      ${sectionHead(p, ctx)}
      <table class="hours-table"><tbody>${DAY_ORDER(data.weekStart).map((key) => {
        const ref = cal.civilDate(2024, 1, 7 + cal.DAY_KEYS.indexOf(key));
        const ranges = visiting.hours[key] || [];
        return html`<tr data-day="${key}"><th scope="row">${cal.fmtDate(data, ref, { weekday: 'long' })}</th><td>${ranges.length ? ranges.map(([a, b]) => ctx.t('calendar.range', { from: cal.fmtTime(data, a), to: cal.fmtTime(data, b) })).join(', ') : ctx.t('calendar.closedToday')}</td></tr>`;
      })}</tbody></table>
      <p class="visiting__note">${ctx.text(visiting.note)}</p>
    </div>
    <div class="visiting__directions">
      <h3 class="visiting__subhead">${ctx.text(p.directionsTitle)}</h3>
      <p class="visiting__address">${icon('pin')}${ctx.text(contact.address)}</p>
      <div class="prose">${ctx.md(p.directions)}</div>
      ${contact.directionsUrl ? html`<a class="btn btn--primary" href="${contact.directionsUrl}" target="_blank" rel="noopener">${icon('pin', 'btn__icon')}<span>${ctx.t('visit.directions')}</span></a>` : ''}
    </div>
  </div>`;
}

export const metas = {
  'hero-today': { bare: true },
  today: {},
  person: {},
  patron: {},
  'daily-cycle': {},
  schedule: {},
  'feast-list': {},
  livestream: {},
  'visiting-hours': {}
};

export { attrs, art, button };
