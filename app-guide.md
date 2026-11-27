# Income Factory — App Guide

Single-file React app (`index.html`), installable as a PWA. Data lives in the browser's localStorage and is moved in and out with one file, `income-factory.json` (see `data-schema.md`). Interface text is in Portuguese; numbers use pt-PT formatting.

## 1. Pages (top tabs)

| Tab | What it does |
|---|---|
| **Dashboard** | Portfolio summary: value, P&L, income, XIRR/CAGR returns (1Y, 3Y, 5Y), goals. Shown first. |
| **Holdings** | Active positions grouped by Stocks / ETFs. Includes the **Quality Score** table, the **Income** tab and editable holdings. |
| **Dividends** | Yield per ticker, income per position, closed-position dividends, dividend calendar, **DRIP**, **Chowder Rule** and **Desaceleração** (slowdown) tables. |
| **Transactions** | Full buy/sell log, with a Broker column. This is the source of truth for shares and average cost. |
| **Analytics** | Allocation pies (asset, stock/ETF, currency, country, sector, broker), benchmarks and the **Dividend Snowball Projection**. |
| **Teses** | Written investment thesis per active position, plus Factores / Sinais / Qualidade do Dividendo / Fundamentais blocks. |
| **Net Worth** (`patrimonio`) | PPR, Certificados de Aforro, term deposits, interest and the Claudia/Carlos investments, by owner. |
| **Tax** | Capital Gains (FIFO), Dividend Tax, Juros, Tax Harvesting, double-taxation refund, holding-period reduction, withholding by country, tax paid per year. |
| **Config** | Tax rate, monthly capital, target yield, expenses, WHT-by-country table, EUR/USD (with the **BCE** button), **Cotações online**, broker CSV, import/export of `income-factory.json`. |

## 2. Core calculations

### 2.1 Average cost and shares (FIFO)
`n` and the average price are **derived from the transactions**, not stored.
- A **buy** creates a lot. A fee is folded into the per-share price: `effPrice = price + fee / n`.
- A **sell** consumes the oldest lots first (First In, First Out).
- Sell proceeds are `n × price − fee`. Realised P&L is `proceeds − cost of the consumed lots`.
- Remaining shares = unconsumed lot shares. Average cost = their weighted average price.
- A fully closed position uses the weighted average of all its buys.
- A sell larger than the shares available is rejected on import.

### 2.2 Capital gains tax (Tax page)
Tax rate depends on how long **each lot** was held (CIRS Art. 43º reduction):

| Holding period | Rate |
|---|---|
| < 2 years | 28% |
| 2 – < 5 years | 25.2% |
| 5 – < 8 years | 22.4% |
| ≥ 8 years | 19.6% |

- Only lots with a **gain** are taxed, at the rate for their own holding period. Lot losses are not netted inside a sale.
- USD positions are converted to EUR with `cfg.fxEurUsd`.
- The Capital Gains table lists each sale with its FIFO lots (columns: date, ticker, shares, prices, proceeds, cost, fee, P&L). It no longer shows Taxa/Imposto columns.
- **Tax Harvesting** is a quick estimate: realised gains minus realised losses per year. Positive net is taxed at a flat 28% (`net × 0.28`). It is marked "Equilibrado" when the net is within 10% of total gains.
- **Menos-valias** (realised losses) offset gains of the same year.
- **Dividend tax**: gross dividend, less withholding at source (`cfg.whtByCountry[country].treaty`), then the PT rate (`cfg.taxRate`, default 28%) on the net, with a foreign tax credit.

### 2.3 Chowder Rule
`Chowder = Dividend Yield + 5-year dividend growth (DGR 5Y)` using `dy + g5`.
- Passes when **> 12%** (the app's cut-off for stocks).
- Score bands and colour tiers:

| Chowder | Points | Colour |
|---|---|---|
| ≤ 8% | 0 | red |
| 8 – 10% | 2 | orange |
| 10 – 12% | 4 | yellow |
| 12 – 15% | 5 | light green |
| > 15% | 6 | green |

- In the Teses **Factores** block it appears as a tile: green ≥ 12%, yellow ≥ 10%, red below.

### 2.4 Shareholder Yield
`Shareholder Yield = Dividend Yield + Buyback Yield` (`dy + buyback`; a missing value counts as 0).
Used for the **Sh.Yield%** column and, with the same bands, to colour the **Yield%** and **Buyback %** columns.

| Shareholder Yield | Points | Colour |
|---|---|---|
| < 0.5% | 0 | dark red |
| 0.5 – 1.5% | 1 | red |
| 1.5 – 2.5% | 2 | orange |
| 2.5 – 3.5% | 4 | yellow |
| 3.5 – 4.5% | 6 | light green |
| 4.5 – 8% | 8 | green |
| > 8% | (8) | red, flagged as a possible **yield trap** |

### 2.5 Quality Score (0 – 103)
Sum of 12 metrics from the `quality` section. A missing value scores **0**. Values are decimals (0.05 = 5%) except `debt`.

| Metric (field) | Max | Bands (lower bound → points) |
|---|---|---|
| Payout Ratio (`py`) — lower is better | 10 | > 92% → 0 · > 75% → 3 · > 60% → 6 · > 50% → 8 · ≤ 50% → 10 |
| Shareholder Yield (`dy+buyback`) | 8 | see 2.4 |
| Chowder (`dy+g5`) | 6 | see 2.3 |
| Dividend growth 3Y (`g3`) | 10 | < 0 → 0 · < 2% → 2 · < 5% → 4 · < 8% → 6 · < 12% → 8 · ≥ 12% → 10 |
| Dividend growth 5Y (`g5`) | 10 | < 1% → 0 · < 2% → 1 · < 4% → 3 · < 8% → 6 · < 10% → 8 · ≥ 10% → 10 |
| Dividend growth 10Y (`g10`) | 3 | < 0 → 0 · < 3% → 1 · < 6% → 2 · ≥ 6% → 3 |
| EPS growth (`eps`) | 8 | < 0 → 0 · < 2% → 1 · < 5% → 3 · < 10% → 6 · ≥ 10% → 8 |
| Debt / EBITDA (`debt`) — lower is better | 6 | < 1.5 → 6 · < 2.5 → 5 · < 3.5 → 4 · < 5 → 1 · ≥ 5 → 0 |
| ROIC (`roic`) | 14 | < 2% → 1 · < 6% → 3 · < 9% → 5 · < 12% → 7 · < 15% → 9 · < 20% → 11 · < 25% → 13 · ≥ 25% → 14 |
| FCF (`fcf`) | 10 | < 3% → 1 · < 5% → 3 · < 8% → 6 · ≥ 8% → 10 |
| Revenue growth (`revgr`) | 10 | < 0 → 0 · < 2% → 1 · < 5% → 3 · < 8% → 5 · < 12% → 7 · < 18% → 9 · ≥ 18% → 10 |
| Operating margin (`opmar`) | 8 | < 5% → 0 · < 10% → 1 · < 15% → 3 · < 20% → 5 · < 30% → 7 · ≥ 30% → 8 |

Score colour bands (proportional to 103): **< 21** red · **< 42** orange · **< 62** yellow · **< 83** green · **≥ 83** dark green.
The score is recalculated on every import; any stored `sc` or `yoc` is ignored.

Notes:
- `fcf` is scored higher-is-better but is labelled "FCF %" in the table and "FCF Payout" in the Teses block. Treat it as an FCF-based ratio.
- Scoring is a fixed ruleset in `calcScore`, so changing a band means editing the code.

### 2.6 Other table metrics
- **YoC (yield on cost)** = `dy × current price ÷ average cost`. Colour: < 2% red · < 3% orange · < 6% gold · ≥ 6% green.
- **Sinais (signal)**: DGR 1Y ≤ 0 → "Corte / Congelamento"; DGR 1Y < 50% of DGR 5Y (both > 0) → "Desaceleração"; otherwise "Crescimento saudável".
- **Factores tiles** (Teses): Yield (green ≥ 3%, yellow ≥ 1.5%), DGR 5Y (≥ 5% / ≥ 0), Chowder (≥ 12% / ≥ 10%), Payout (≤ 60% / ≤ 92%), Streak (≥ 10 years / ≥ 1), Debt/EBITDA (≤ 3 / ≤ 5).

### 2.6b Annual dividend bars (Dividends page)
One chart per currency (USD; EUR + ETF), from 2023 to the current year, including closed positions.
- **Current year**: solid part = received so far; hatched part = rest of the year's estimate (`dy × shares × price` per position).
- **Rendimento por Posição table**: *Est. current year* = `dy × shares × price` per position; *Est. next year* = that × (1 + `cfg.divGrowth`). The totals match the bars.
- **Next year (prev.)**: hatched bar = current-year estimate × (1 + `cfg.divGrowth`), the same formula as "Est. next year" in the income table. The % above it is that growth rate.

### 2.7 DRIP (Dividends page)
For each active position: `estimated annual dividend = dy × shares × price`; `DRIP units = dividend ÷ price`. The progress bar shows the fractional part (progress toward the next whole share).

### 2.8 Dividend Snowball (Analytics)
Three sliders: **monthly contribution** (starts at `cfg.monthlyCapital`), **dividend growth**, **stock price growth**, plus inflation and an income goal. Horizon 30 years.

```
base      = dividends received last year (falls back to dy × value, then to the annual contribution)
nominal(y)= base·(1+dg)^y + C·yield·(1+dg)^y · Σ_{j=0}^{y-1} 1/(1+sg)^j
real(y)   = nominal(y) / (1+inflation)^y
```
`C` = 12 × monthly contribution, `yield` = `cfg.targetYield` on new capital, `dg` = dividend growth, `sg` = stock growth. It reports the year the nominal line crosses the goal, and the goal net of `cfg.taxRate`.

## 3. Practical notes
- **Quote refresh**: three ways to update prices (`cv`):
  - **Cotações online** (Config): Twelve Data for US listings, Alpha Vantage as fallback for London, Xetra, Frankfurt, Amsterdam and Lisbon. Prices are converted to the position currency with ECB rates and reviewed before applying.
  - **Broker CSV** (Config): template download + import.
  - **By hand** in the Transactions page.
- **Investments outside the portfolio** (Claudia Investimentos): their current price comes from an active position with the same ticker, otherwise from `cfg.refPrices`. Cotações online also fetches these tickers (marked "(ref.)") and stores the price there.
- **Live vs not live**: a price is live when it came from an online provider and is at most 4 days old (`cvSource`, `cvAsOf`). Every other price shows an amber ● in Holdings and Transactions; hover it to see the source and date.
- **EUR/USD**: the **BCE** button fetches the European Central Bank reference rate (no key) and adds the day to `fxHistory`.
- **Brokers**: configured per transaction via the optional `broker` field; the Analytics "Corretora" pie shows shares per broker.
- **Currency**: position `cat` is `USD`, `EUR` or `ETF`. USD amounts are converted with `cfg.fxEurUsd`.
- **Teses currency**: the symbol follows the position currency unless `meta.currency` is set (e.g. `£`).
- **Saving**: changes are saved automatically to localStorage (the Guardar button forces it; a dot shows unsaved changes). Export `income-factory.json` regularly as backup, keep it out of the repository, and tick "Incluir as chaves…" only if you want the API keys inside it.
- **Release**: the start screen shows "Última release: DD/MM/AAAA · #N" from `window.APP_RELEASE`, so you can tell which version is installed.
