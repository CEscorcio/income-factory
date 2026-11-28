# Income Factory

A personal dividend-portfolio dashboard that runs entirely in the browser and installs as an app (PWA) on phone or computer.

**Live:** https://cescorcio.github.io/income-factory/

It tracks positions and transactions, dividends, taxes (Portuguese rules), quality scores, investment theses and family net worth (PPR, Certificados de Aforro, deposits). The interface is in Portuguese.

## Features

| Area | What it does |
|---|---|
| Dashboard | Value, P&L, income, XIRR/CAGR returns, goals |
| Holdings | Active positions, Quality Score, income, editable holdings |
| Dividends | Yield, calendar, DRIP, Chowder Rule, slowdown signals |
| Transactions | Buy/sell log per position; source of truth for shares and average cost (FIFO) |
| Analytics | Allocation pies, benchmarks, dividend snowball projection |
| Teses | Written investment thesis per position |
| Net Worth | PPR, Certificados de Aforro, deposits, interest, by owner |
| Tax | Capital gains (FIFO, holding-period rates), dividend tax, tax harvesting |
| Config | Settings, EUR/USD from the ECB, online prices, broker CSV, import/export |

How each number is calculated: [`app-guide.md`](app-guide.md).

## Your data

- Data stays **in your browser** (localStorage). Nothing is sent to a server, except price and exchange-rate requests to the providers you choose.
- Back up and move data with **one file**, `income-factory.json` (Config → Exportar / Importar). The format is documented in [`data-schema.md`](data-schema.md).
- Old files (`portfolio.json`, `metrics.json`, `config.json`, `wealth.json`, `teses.json`, the old full backup) still import; select them all at once, then export a new `income-factory.json`.
- **Never commit your data file.** This repository is public and the file holds financial details (and API keys, if you choose to include them). `.gitignore` blocks the usual file names.

## Prices and exchange rates

| Source | Covers | Key |
|---|---|---|
| ECB reference rates (via Frankfurter) | EUR/USD and other currencies | none |
| Twelve Data (free plan) | US exchanges | free, 800 requests/day |
| Alpha Vantage (free plan), used as fallback | US, London, Xetra, Frankfurt, Amsterdam, Lisbon | free, 25 requests/day |
| Finnhub (free plan), last fallback | US exchanges | free, 60 requests/minute |
| Broker CSV | anything | — |

Config → **Cotações online** tests every active ticker, converts to the position's currency and shows the result before applying. Prices that are not live (typed by hand, from CSV, or older than 4 days) are marked with an amber ●.

API keys are stored only in the browser, unless you tick "Incluir as chaves no income-factory.json".

## Install on a phone

1. Open the live link.
2. iPhone (Safari): Share → *Add to Home Screen*. Android (Chrome): menu → *Install app*.
3. The start screen shows "Última release: DD/MM/AAAA · #N", so you can check which version you have. If an update doesn't show, close and reopen the app.

## Project structure

```
index.html            the whole app: React 18 + Tailwind, inlined, no build step
sw.js                 service worker (offline cache)
manifest.webmanifest  PWA manifest
icons/                app icons
data-schema.md        format of income-factory.json
app-guide.md          pages and calculations
CLAUDE.md             instructions for Claude Code
.claude/              Claude Code agents and commands
```

## Development

There is no build. Edit `index.html` and open it in a browser (a file opened locally keeps its own separate data).

Publishing a change:

1. Bump the release in **both** places, with the same value:
   - `window.APP_RELEASE` in `index.html` (`AAAA-MM-DD`, or `AAAA-MM-DD.N` for several releases on one day);
   - `CACHE` in `sw.js` (`income-factory-<same value>`), so installed apps download the new version.
2. Merge into `master`. GitHub Pages publishes `master` automatically.

With Claude Code, `/release` does step 1.
