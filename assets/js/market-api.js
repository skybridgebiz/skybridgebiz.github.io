// Trader Market API — a client-side wrapper around free, CORS-enabled market
// data providers. GitHub Pages has no server, so every call runs in the
// visitor's browser and only ever talks to public endpoints that don't
// require a secret key (crypto, forex). Stock quotes need a personal
// Finnhub API key, supplied by the caller at runtime — never hardcode one
// here since this file ships to every visitor.

const CRYPTO_ENDPOINT = "https://api.coingecko.com/api/v3/simple/price";
const FOREX_ENDPOINT = "https://api.frankfurter.app/latest";
const STOCK_ENDPOINT = "https://finnhub.io/api/v1/quote";

const cache = new Map();

async function cachedFetch(url, ttlMs) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.time < ttlMs) {
    return hit.data;
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Market API request failed (${res.status}): ${url}`);
  }
  const data = await res.json();
  cache.set(url, { data, time: Date.now() });
  return data;
}

/**
 * Live crypto prices via CoinGecko.
 * @param {string[]} ids e.g. ["bitcoin", "ethereum"]
 * @param {string} vsCurrency e.g. "usd"
 * @returns {Promise<Array<{id, price, changePercent24h, currency, source, timestamp}>>}
 */
export async function getCryptoQuotes(ids, vsCurrency = "usd") {
  const params = new URLSearchParams({
    ids: ids.join(","),
    vs_currencies: vsCurrency,
    include_24hr_change: "true",
  });
  const data = await cachedFetch(`${CRYPTO_ENDPOINT}?${params}`, 15_000);
  return ids.map((id) => ({
    id,
    price: data[id]?.[vsCurrency] ?? null,
    changePercent24h: data[id]?.[`${vsCurrency}_24h_change`] ?? null,
    currency: vsCurrency.toUpperCase(),
    source: "coingecko",
    timestamp: Date.now(),
  }));
}

/**
 * Live forex reference rates via Frankfurter (ECB reference rates).
 * @param {string} base e.g. "USD"
 * @param {string[]} symbols e.g. ["EUR", "THB", "JPY"]
 * @returns {Promise<{base, rates, date, source}>}
 */
export async function getForexRates(base, symbols) {
  const params = new URLSearchParams({ base, symbols: symbols.join(",") });
  const data = await cachedFetch(`${FOREX_ENDPOINT}?${params}`, 60_000);
  return {
    base: data.base,
    rates: data.rates,
    date: data.date,
    source: "frankfurter",
  };
}

/**
 * Live stock quote via Finnhub. Requires a free API key from
 * https://finnhub.io — pass it in, never commit it to source.
 * @param {string} symbol e.g. "AAPL"
 * @param {string} apiKey
 * @returns {Promise<{symbol, price, change, changePercent, high, low, open, previousClose, source, timestamp}>}
 */
export async function getStockQuote(symbol, apiKey) {
  if (!apiKey) {
    throw new Error("getStockQuote requires a Finnhub API key");
  }
  const params = new URLSearchParams({ symbol, token: apiKey });
  const data = await cachedFetch(`${STOCK_ENDPOINT}?${params}`, 15_000);
  return {
    symbol,
    price: data.c,
    change: data.d,
    changePercent: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    previousClose: data.pc,
    source: "finnhub",
    timestamp: Date.now(),
  };
}
