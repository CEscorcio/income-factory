# Yahoo Finance proxy (Cloudflare Worker)

Yahoo Finance has quotes for every exchange the app uses (US, London, Xetra, Amsterdam, Lisbon, Paris, Milan, Madrid…), with no key and no known daily limit. But it sends no CORS headers, so a web page can't read it directly. This Worker, in your own free Cloudflare account, forwards the request and adds the headers. It only forwards Yahoo's chart endpoint, so it can't be used as a general proxy.

Yahoo has no official public API: it can change or stop working without notice. Keep Twelve Data / Alpha Vantage as the main providers and Yahoo as the last fallback.

## Set up (about 5 minutes)

1. Create a free account at https://dash.cloudflare.com/sign-up.
2. In the dashboard: **Workers & Pages → Create → Create Worker**. Give it a name (e.g. `yahoo-quotes`) and click **Deploy**.
3. Click **Edit code**, replace everything with the contents of [`worker.js`](worker.js), and click **Deploy**.
   If you open the app from an address other than `https://cescorcio.github.io`, add it to `ALLOWED_ORIGINS` first.
4. Copy the Worker's address, e.g. `https://yahoo-quotes.<your-subdomain>.workers.dev`.
   Check it in the browser: `https://yahoo-quotes.<your-subdomain>.workers.dev/v8/finance/chart/KO?range=5d&interval=1d` should show JSON with `"symbol":"KO"`.
5. In the app: **Config → Cotações online**, choose **Yahoo Finance** in **Por último, tentar** and paste the address in the field next to it.
6. Click **Testar cotações**. Tickers the first two providers can't price are asked to Yahoo (shown as `YF`); review and apply as usual.

The free Workers plan allows 100 000 requests per day, far more than the app needs. Friends can use your Worker's address too, or deploy their own.
