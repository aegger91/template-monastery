# Orthodox monastery website template

Sample site for an Orthodox monastery or convent (**Holy St. Example Monastery**). Clients pick it in the Project Orthodox website builder; the builder edits the JSON under `content/` and toggles or reorders sections in `content/layout.json`.

This is layout and sample data only. Body copy is short placeholders. Visiting guidelines, dress notes and other how-to text are left for each monastery to add.

## Run locally

```bash
npm install
npm run build
npm run serve          # http://localhost:4747
npm run dev            # build + watch
```

Optional checks (with the server running for fit and screenshots):

```bash
npm run validate
npm run check-orthodox
npm run check-fit
npm run screenshots
```

The production build is fully static under `dist/` and works on any static host. No Vercel-specific setup and no third-party CMS.

## Edit content

| File | What it controls |
| --- | --- |
| `content/site.json` | Name, locales, logo style (`kiot` / `seal` / `square` / `wordmark`), contact, visiting hours, forms and payments |
| `content/navigation.json` | Header, Donate button, footer |
| `content/layout.json` | Section order and on/off per page (e.g. Visiting info, fund progress) |
| `content/pages/*.json` | One file per page; any new JSON file becomes a page |
| `content/services.json` | Week schedule, feast pattern, calendar style (`julian` / `revised-julian`) |
| `content/menaion.json` | Day commemorations by church date |
| `content/shop.json`, `donate.json`, `news.json`, `gallery.json` | Shop, gifts, news, gallery |
| `content/ui.json` | UI strings (nav, forms, cart) for every locale |
| `theme/tokens.json` | Colors, type, space |

Locales are listed in `site.locales`. Each field falls back on its own through that locale’s `fallback` list, then `sourceLocale`. Demo languages: English, Russian, Greek.

## Payments and OrthodoxConnect

- Forms post JSON to `site.forms.endpoint`. With no endpoint, the browser shows a sample confirmation.
- Shop, commemorations and gifts go through `site.payments` (`none` / `stripe` / `authorizenet`). See `integrations/payments.mjs`.
- Optional `fund-progress` (off by default in `layout.json`) fills from `site.integrations.fundTotals`, never by hand. See `integrations/fund-totals.mjs`.
- Work days and pilgrimages use `site.integrations.orthodoxconnect` deep-link placeholders.

## What makes this template distinct

Quiet monastic layout (stone, charcoal, beeswax gold, forest), a sticky header that condenses on scroll, the daily cycle of services with today’s times on the Julian or Revised Julian calendar, guest-house and spiritual-father request forms, zapiski-style commemorations, a shop cart, and OrthodoxConnect hooks, without parish-style chatter or catechesis copy.
