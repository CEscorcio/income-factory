# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

Income Factory: a personal dividend-portfolio PWA, published from `master` by GitHub Pages at https://cescorcio.github.io/income-factory/. See `README.md` for the feature list, `app-guide.md` for how every number is calculated, and `data-schema.md` for the data file format.

## Architecture

- **One file app.** `index.html` holds everything: minified React 18 and Tailwind inlined at the top (do not edit those), then the app code in plain JavaScript using `h=React.createElement` (no JSX, no build step, no npm).
- **State and storage.** `App()` owns the state (`pos`, `sold`, `qual`, `cfg`, `wealth`, `teses`) and autosaves each to localStorage under `if_fp`, `if_fs`, `if_fq`, `if_fc`, `if_fw`, `if_ft`; valuation history is `if_vh`. API keys are `if_pricekey_<provider>`.
- **Pages** (top tabs, rendered in `App`): `Dash`, `Port` (Holdings), `DividendosPage`, `TransactionsPage`, `AnalyticsPage`, `TesesPage`, `PatrimonioPage`, `TaxCalcPage`, `Conf` (Config).
- **Find code by name, not line number** (the file is ~9 000 lines). Key places:
  - defaults: `DCFG`; scoring: `calcScore`, `cleanQuality`; FIFO: `fifoEngine`
  - validation: `validateImported*`, `validateTransactionHistory`
  - data file: `buildDataFile`, `readDataFile`, `readDataFileV2`, `DATA_SCHEMA_VERSION`, `DATA_MIGRATIONS`, `combineDataFiles`; app handlers `importData`, `exportData`
  - prices: `PRICE_EXCHANGES`, `PRICE_PROVIDERS`, `fetchQuote`, `fetchEcbRates`, `convertPrice`, `PricePanel`, `priceFreshness`, `StaleDot`
- **Service worker** `sw.js`: network-first for the page, cache-first for the other same-origin files. Cross-origin requests (price APIs) are not touched.

## Rules

- **Release on every user-visible change.** Bump `window.APP_RELEASE` in `index.html` and `CACHE` in `sw.js` to the same value (`AAAA-MM-DD`, or `AAAA-MM-DD.N` for more than one release that day). Use `/release`.
- **Data format changes.** Adding an optional section is fine. Changing the shape of an existing one: bump `DATA_SCHEMA_VERSION`, add a step to `DATA_MIGRATIONS` that converts the previous version, update `data-schema.md`. Old files must keep importing (`readDataFile` also reads the pre-2026 single-section files and the old full backup).
- **Never commit personal data or keys.** No `income-factory*.json`, old `portfolio/metrics/config/wealth/teses.json`, or API keys in code, commits or test fixtures. The repository is public. Use made-up data in tests.
- **Price providers must allow browser requests (CORS).** The app has no server. Before adding a provider, check from a page on another origin that `fetch` succeeds. EODHD was rejected for this reason. Yahoo Finance has no CORS either and was dropped (it would need a proxy). Twelve Data's free plan is US-only; Alpha Vantage's free plan is 25 requests/day.
- **Interface text is European Portuguese** in the spelling the app already uses (`actual`, `acções`, `transacções`, `cotações`). Code comments and docs are English.
- **Money logic needs care.** Prices are per share in the position's currency (`cat`: `USD` → USD, `EUR`/`ETF` → EUR). London quotes come in pence (`GBp`/`GBX`); `convertPrice` divides by 100. Never apply a price without the review step in `PricePanel`.
- **Commit messages** are in Portuguese, short imperative subject, body listing what changed.
- **Merging into `master`**: always a merge commit with a written message: a Portuguese title summarising the PR, and a body grouping the changes by area (e.g. Dividends, Config, Dados) and ending with the release number.

## Testing

No test suite. Verify changes in Chromium with Playwright (pre-installed: `require('playwright')`):

1. Open `file:///…/index.html`, clear localStorage, reload.
2. Import a made-up `income-factory.json` through the "Importar dados" button (`page.waitForEvent('filechooser')`).
3. Click through every tab and collect `pageerror` events; there must be none.
4. Export, clear, re-import: the stored data must be identical.
5. Mock price and FX APIs with `context.route(...)` instead of calling them.

## Agents and commands

- `.claude/agents/portfolio-manager.md`: refreshes prices and maintains positions in an `income-factory.json` the user provides.
- `.claude/agents/thesis-writer.md`: writes or updates an investment thesis in the `theses` section, following the template.
- `.claude/commands/release.md`: `/release` bumps the release in both files.
