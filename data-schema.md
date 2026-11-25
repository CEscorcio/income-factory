# Income Factory — Data Schema

All app data lives in **one file, `income-factory.json`** (Config → Importar / Exportar). Dates are `YYYY-MM-DD`. Percentages and rates are **decimals** (0.05 = 5%) unless stated. `null` means "no data" where allowed.

```jsonc
{
  "app": "income-factory",           // required, identifies the file
  "schemaVersion": 2,                // required, see "Versions" below
  "exportedAt": "2026-11-25T12:00:00.000Z",
  "portfolio": { "positions": [ Position, ... ] },   // active and closed positions
  "quality":   [ QualityItem, ... ],                 // fundamentals for the Quality Score
  "config":    { ... },                              // thresholds and preferences
  "wealth":    { ... } | null,                       // PPR, Certificados de Aforro, deposits, interest
  "theses":    { "<TICKER>": Thesis, ... } | null,   // one written thesis per ticker
  "history":   { "valuations": [ Valuation, ... ] }  // daily portfolio value snapshots
}
```

Importing this file **replaces all data** in the app. Any section left out is imported empty (or with defaults, for `config`).

## Versions

`schemaVersion` is the version of this layout. When a future release changes the shape of a section, the version goes up and the app converts older files on import, step by step (`DATA_MIGRATIONS` in `index.html`). A file with a version newer than the app is refused with a message asking to update the app.

## Old files

The importer still reads every format the app used before, so nothing needs to be converted by hand:

| Old file | Becomes |
|---|---|
| `portfolio.json` (`positions`, `sold`) | `portfolio.positions` |
| `metrics.json` (`quality`, legacy `income`) | `quality`; `income` is merged into each position's `divByYear` |
| `config.json` | `config` |
| `wealth.json` | `wealth` |
| `teses.json` | `theses` |
| `income-factory-backup_*.json` (old "Backup completo") | the whole file |

Several old files can be selected at once; each replaces only its own section. Then press **Exportar** to get a single `income-factory.json`.

---

## 1. `portfolio.positions`

One list with every position. Closed positions carry `"status": "sold"`; anything else is active.

### Position (active)
| Field | Type | Req. | Notes |
|---|---|---|---|
| `t` | string | yes | Ticker, exactly as in `quality` (e.g. `KO`, `NN.AS`, `VWCE.DE`). Non-empty. |
| `cat` | `"USD"` \| `"EUR"` \| `"ETF"` | yes | `USD` = priced in USD (converted with `fxEurUsd`). `EUR` = euro stock. `ETF` = ETF (shown in the ETF table). |
| `cv` | number ≥ 0 | yes | Current price per share, in the position's own currency. |
| `n` | number ≥ 0 | – | Shares. **Recomputed from `transactions`** (FIFO) when transactions exist. |
| `transactions` | Transaction[] | yes in practice | Source of truth for shares and average cost. |
| `country` | string (flag emoji) | – | e.g. `🇺🇸`, `🇬🇧`, `🇵🇹`. Drives withholding tax and the country pie. Must match a key in `cfg.whtByCountry`. |
| `divByYear` | `{ "YYYY": number }` | – | Dividends actually received per year, in the position's currency. |
| `div` | number ≥ 0 | – | Total dividends received. Equal to the sum of `divByYear`. |
| `divMonths` | integer[] (1–12) | – | Payment months, used by the dividend calendar. |
| `av` | number ≥ 0 | – | Legacy average cost. Ignored when transactions exist. |
| `cvAsOf` | date | – | Date of the price in `cv`. |
| `cvSource` | string | – | Where `cv` came from: a provider name (`Twelve Data`, `Alpha Vantage`, …), `csv` (broker CSV) or `manual` (typed in the app). A price is shown as **live** only when it came from a provider and `cvAsOf` is at most 4 days old; otherwise the app marks it with an amber ●. |

### Transaction
| Field | Type | Req. | Notes |
|---|---|---|---|
| `date` | string `YYYY-MM-DD` | yes | Must be a real date. |
| `type` | `"buy"` \| `"sell"` | yes | |
| `n` | number > 0 | yes | Shares (fractions allowed). |
| `price` | number ≥ 0 | yes | Price per share in the position's currency. |
| `fee` | number ≥ 0 | – | Commission. Added to buy cost, deducted from sell proceeds. |
| `broker` | string | – | Free text. Defaults offered by the app: `Trade Republic`, `XTB`, `Interactive Brokers`, `DEGIRO`, `Trading 212`, `Amundi`. |
| `note` | string | – | Free text. |

Import checks: transactions are validated in date order. A sell may not exceed the shares held on that date, and `type`, `date`, `n`, `price`, `fee` must be valid, otherwise the file is rejected with a message naming the ticker.

### Closed position
A position with `"status": "sold"`. Same fields as an active position (`t`, `cat`, `country`, `transactions`, `divByYear`, `div`), plus:
| Field | Type | Notes |
|---|---|---|
| `name` | string | Display name. |
| `sec` | string | Sector (same values as in section 2). |
| `n` | number | Shares sold in total. |
| `sv` | number | Sale price per share (legacy; used when there are no transactions). |
| `entry`, `exit` | date | First buy and final sell dates. |
| `note` | string | Free text. |
| `f` | string | Optional emoji marker for the UI. |
| `cv` | number | Optional last price. |

---

## 2. `quality`

A list of `QualityItem`.

### QualityItem
| Field | Type | Meaning | Used in score |
|---|---|---|---|
| `t` | string | Ticker. Matching ignores exchange suffixes when unambiguous (`NN` finds `NN.AS`). | – |
| `sec` | string | Sector. Values in use: `Consumer Staples`, `Energy`, `Financials`, `Healthcare`, `Industrials`, `Materials`, `Real Estate`, `Utilities`, `ETF - Equity`, `ETF - Bonds`. | no (sector pie) |
| `dy` | number | Dividend yield | yes (Shareholder Yield, Chowder) |
| `buyback` | number | Net buyback yield (negative = dilution) | yes (Shareholder Yield) |
| `g1` | number | Dividend growth 1Y | no (Sinais, colours) |
| `g3` | number | Dividend growth 3Y | yes |
| `g5` | number | Dividend growth 5Y | yes (also Chowder) |
| `g10` | number \| null | Dividend growth 10Y | yes |
| `py` | number | Payout ratio | yes |
| `str` | number \| null | Consecutive years of dividend increases | no (Factores tile) |
| `eps` | number | EPS growth | yes |
| `debt` | number | Net debt / EBITDA, **in multiples** (2.8 = 2.8x). Negative means net cash. | yes |
| `roic` | number | Return on invested capital | yes |
| `fcf` | number | Free-cash-flow ratio, higher scores better | yes |
| `revgr` | number | Revenue growth | yes |
| `opmar` | number | Operating margin | yes |

Rules:
- Every metric may be `null` or omitted. A missing value scores 0 points.
- If provided, each metric must be a finite number, otherwise the import fails.
- `sc` (score) and `yoc` are **computed by the app**; do not include them.
- ETFs usually only carry `dy`, `g1`–`g10`, `str` and `sec`; the rest is `null`.
- Scoring bands: see Config → Quality Score in the app.

---

## 3. `config`

The scoring thresholds and preferences edited in Config (e.g. `fxEurUsd`, `whtByCountry`, `posCountry`, `etfTer`). Missing keys take the app defaults, so a partial object is fine. Each key must have the same type as its default.

Keys written by the price and exchange-rate updates:

| Key | Notes |
|---|---|
| `fxEurUsd`, `fxEurUsdAsOf` | EUR/USD rate and its date. The **BCE** button fills them with the European Central Bank reference rate and also adds that day to `fxHistory.rates`. |
| `priceProvider` | Last provider used in "Cotações online": `twelvedata`, `alphavantage`, `eodhd` or `finnhub`. |
| `priceFallback` | Provider tried for the tickers the main one can't price (same values, or `""` for none). Default `alphavantage`. |
| `priceSymbols` | `{ "<ticker>": "<symbol>" }` overrides for tickers the provider knows by another symbol, e.g. `{ "LGEN": "LGEN.L" }`. Format `TICKER` (US) or `TICKER.EXCHANGE` with `L`, `AS`, `LS`, `MI`, `DE`, `F`, `BE`, `PA`, `MC`, `CO`. |
| `quotesImportedAt`, `quotesSource` | When prices were last updated, and from where. |

The provider's **API key is never stored here** or anywhere in this file. It stays only in the browser that uses it.

---

## 4. `wealth`

An object, or `null`. When present, at least one of the five sections must exist. `ppr`, `aforro`, `depositos`, `juros` must be arrays.

### `ppr[]`
| Field | Type | Notes |
|---|---|---|
| `produto` | string | Product name. |
| `valorInvestido` | number | € invested. |
| `ganhosBrutos` | number | Gross gains, €. |
| `owner` | string | Key of `owners`. |

### `aforro[]` (Certificados de Aforro)
| Field | Type | Notes |
|---|---|---|
| `investimento` | number | € invested. |
| `serie` | `"E"` \| `"F"` \| `"CTPV"` \| `"B"` | Series. |
| `juros` | number | Interest accrued, €. |
| `owner` | string | Key of `owners`. |
| `dataConstituicao` | date \| null | Start date. |
| `endDate` | date | Optional. Overrides the computed end date. |

End date, when `endDate` is absent: `dataConstituicao` + **E 10 years · F 15 years · CTPV 7 years**. Series `B` has no automatic term; give `endDate` manually. No start date and no `endDate` means no end date is shown.

### `depositos[]` (term deposits)
| Field | Type | Notes |
|---|---|---|
| `investidor` | string | Key of `owners`. |
| `valor` | number | Principal, €. |
| `rate` | number | Annual rate (0.03 = 3%). |
| `plataforma` | string | Bank/platform. |
| `dataInicio`, `endDate` | date | `endDate` may be `null`. |
| `status` | string | `"A decorrer"` is shown green; any other value uses the default (amber) style. |
| `netProfit` | number \| null | Net profit, if known. |

### `juros[]` (interest on cash accounts)
`plataforma`, `pais` (flag), `country`, `wht` (rate), `valor` (balance), `rate`, `investidor`, plus yearly amounts as keys `"2023"`, `"2024"`, … (`null` when unknown).

### `claudiaInvestimentos`
`{ "investimentos": [ { "ticker", "valorInvestido", "precoCompra", "dataCompra" } ] }`. Lots bought outside the main portfolio (currently VWCE.DE).

### Display tables
- `owners`: `{ "<name>": { "color": "#hex", "bg": "#hex" } }`
- `statusColors`: `{ "A decorrer": {bg,color}, "default": {bg,color} }`
- `netWorthColors`: colours for the net-worth chart (CSS variables or hex).
- `pprValoresAtuais`: `{ "<product>": current value € }`.

---

## 5. `theses`

An object keyed by ticker, or `null` (`KO`, `NN.AS`, `IBE.MC` …). The only enforced rule is that each thesis is an object, so a missing section simply doesn't render. Use the template below to keep every thesis consistent.

Currently written: JPM, PEP, PG, MAIN, O, KO, XOM, TROW, COR.LS, DG.PA, NOV.DE, MCD, JNJ, VICI, MO, WM, NN.AS, BTI, AD.AS, IBE.MC, LGEN.

### Template (based on KO)
```jsonc
"KO": {
  "name": "The Coca-Cola Company",
  "meta": {
    "date": "28 setembro 2026",        // text shown as the thesis date
    "price": 87.0,                       // price when written
    "yield": 0.0241,                     // decimal
    "annualDividend": 2.12,
    "fairValue": 94,
    "score": 84,                         // 0-100
    "rating": "BUY / HOLD",
    "conviction": 4,                     // 1-5
    "currency": "£"                      // optional: overrides the symbol, otherwise taken from the position (USD → $, else €)
  },
  "thesis": "text; paragraphs separated by \n\n",
  "business": "text",
  "moat": { "rating": 5, "points": ["…", "…"] },       // rating 1-5
  "mainRisk": "text",
  "strategicResponse": ["…"],
  "financialsYears": ["2023", "2024", "2025"],
  "financials": [ { "metric": "Revenue", "values": ["$45,75B", "$46,50B", "$47,20B"] } ],   // one value per year
  "balanceSheet": "text",
  "dividendThesisText": "text",
  "dividendThesis": [ { "label": "Dividend yield", "value": "~2,4%" } ],
  "growthThesis": "text",
  "bearCase": ["…"],
  "whatWouldBreakThesis": ["…"],
  "valuation": [ { "scenario": "Bear|Base|Bull", "eps": "$2,70", "pe": "22x", "fairValue": "$59" } ],
  "decisionRanges": [ { "price": "< $65", "decision": "Strong Buy" } ],
  "scorecardTotal": "84 / 100",
  "scorecard": [ { "metric": "Payout Ratio", "score": "10 / 12" } ],     // 12 metrics; the maxima add up to 100
  "finalDecision": { "rating": "BUY / HOLD", "fairValue": "~$94", "dividendYield": "2,41%", "epsGrowth": "4–6%", "divGrowth": "4–6%", "totalReturn": "…" },
  "keyPhrase": "one-sentence summary",
  "followUpQuestion": "what to monitor, with a keep/review rule",

  // optional — dividend history chart + table (used by TROW, MCD, JNJ, VICI, MO, WM, NN.AS, BTI, AD.AS, IBE.MC, LGEN, COR.LS, DG.PA, NOV.DE)
  "dividends": {
    "currency": "USD",                  // or "GBp" for pence (LGEN)
    "source": "TradingView",             // short source note
    "periodLabel": "Ano",                // optional column label
    "history": [ { "year": 2013, "dps": 1.52, "yield": 0.0181, "payout": 0.3897 } ]   // yield/payout may be null
  }
}
```

Section order on the Teses page: 1 Tese · 2 Negócio · 3 Moat · 4 Principal Risco · 5 Resposta Estratégica · 6 Financial Quality · 7 Balance Sheet · 8 Dividend Thesis · 9 Growth Thesis · 10 Bear Case · 11 O Que Destruiria a Tese · 12 Valuation · 13 Faixas de Decisão · 14 Scorecard · 15 Decisão Final. The Factores, Sinais, Qualidade do Dividendo and Fundamentais blocks above them come from `quality`, not from the thesis.

Conventions used so far:
- Text is in European Portuguese. Numbers in strings use a decimal comma (`$2,12`, `2,41%`). Numeric fields (`price`, `yield`, `history`) use JSON numbers with a decimal point.
- Currency symbols in the strings match the listing currency (USD `$`, EUR `€`, GBP `£`).
- `scorecard` scores are strings in the form `"x / max"`.

---

## 6. `history.valuations`

Written by the app once a day; there is no need to edit it.

| Field | Type | Notes |
|---|---|---|
| `date` | date | Snapshot day. |
| `totalValueEUR` | number | Portfolio value in €. |
| `fxEurUsd` | number > 0 | EUR/USD rate used. |

---

## 7. Common import errors

| Message (summary) | Cause |
|---|---|
| "… não tem ticker" | A position or quality item without `t`. |
| "… deve ser um número finito não negativo" | `n`, `cv`, `av`, `sv` or `div` is negative or not a number. |
| "A transacção N tem data ou valores inválidos" | Bad date, type, `n ≤ 0`, negative `price` or `fee`, or `broker` not a string. |
| "A venda de … excede as acções disponíveis" | A sell is larger than the shares held on that date, or the date order is wrong. |
| "quality[i].campo deve ser numérico" | A metric is a string (e.g. `"5%"`) instead of a number. |
| "Não foram encontrados dados de património" | `wealth` has none of its five sections. |
| "… foi criado por uma versão mais recente da app" | `schemaVersion` is newer than this app. Update the app (reload it online). |
| "Escolhe só um ficheiro income-factory.json de cada vez" | Two full data files were selected together. |

Tip: when a ticker in `quality` has no match in `portfolio.positions` (or the reverse), the quality columns stay empty for that position — check the spelling and the exchange suffix first.
