// Trade backend for market.html. This exists because placing real Binance
// orders needs a secret API key with trading permission, and a GitHub
// Pages static site has no server to keep that secret out of the browser.
// These Cloud Functions hold it instead, using Firebase Auth (the same
// sign-in already used across the site) to gate access to a single admin.

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();

const ADMIN_EMAIL = "pyaephyoaung@skybridge-businesssolution.com";

const BINANCE_API_KEY = defineSecret("BINANCE_API_KEY");
const BINANCE_API_SECRET = defineSecret("BINANCE_API_SECRET");

// Defaults to Binance's testnet (fake money, real market data) so a
// misconfigured key can't touch real funds. Switch to
// https://api.binance.com only once you've verified everything end to end.
const BINANCE_BASE_URL = defineString("BINANCE_BASE_URL", {
  default: "https://testnet.binance.vision",
});

function assertAdmin(auth) {
  if (!auth || auth.token.email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Only the site admin can use the trade panel.");
  }
}

function sign(params, secret) {
  const query = new URLSearchParams(params).toString();
  const signature = crypto.createHmac("sha256", secret).update(query).digest("hex");
  return `${query}&signature=${signature}`;
}

async function binanceRequest(method, path, params, apiKey, apiSecret, baseUrl) {
  const signedQuery = sign({ ...params, timestamp: Date.now(), recvWindow: 5000 }, apiSecret);
  const res = await fetch(`${baseUrl}${path}?${signedQuery}`, {
    method,
    headers: { "X-MBX-APIKEY": apiKey },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new HttpsError("failed-precondition", data.msg || `Binance request failed (${res.status})`);
  }
  return data;
}

exports.getBinanceAccount = onCall(
  { secrets: [BINANCE_API_KEY, BINANCE_API_SECRET] },
  async (request) => {
    assertAdmin(request.auth);
    const data = await binanceRequest(
      "GET",
      "/api/v3/account",
      {},
      BINANCE_API_KEY.value(),
      BINANCE_API_SECRET.value(),
      BINANCE_BASE_URL.value()
    );
    const balances = (data.balances || []).filter(
      (b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
    );
    return { balances, canTrade: data.canTrade, baseUrl: BINANCE_BASE_URL.value() };
  }
);

exports.placeBinanceOrder = onCall(
  { secrets: [BINANCE_API_KEY, BINANCE_API_SECRET] },
  async (request) => {
    assertAdmin(request.auth);
    const { symbol, side, type, quantity, price } = request.data || {};

    if (!symbol || !side || !type || !quantity) {
      throw new HttpsError("invalid-argument", "symbol, side, type, and quantity are required");
    }
    if (!["BUY", "SELL"].includes(side)) {
      throw new HttpsError("invalid-argument", "side must be BUY or SELL");
    }
    if (!["MARKET", "LIMIT"].includes(type)) {
      throw new HttpsError("invalid-argument", "type must be MARKET or LIMIT");
    }

    const params = { symbol, side, type, quantity };
    if (type === "LIMIT") {
      if (!price) throw new HttpsError("invalid-argument", "price is required for LIMIT orders");
      params.price = price;
      params.timeInForce = "GTC";
    }

    const baseUrl = BINANCE_BASE_URL.value();
    const order = await binanceRequest(
      "POST",
      "/api/v3/order",
      params,
      BINANCE_API_KEY.value(),
      BINANCE_API_SECRET.value(),
      baseUrl
    );

    await db.collection("trades").add({
      ...order,
      placedBy: request.auth.token.email,
      placedAt: new Date(),
      baseUrl,
    });

    return order;
  }
);

exports.cancelBinanceOrder = onCall(
  { secrets: [BINANCE_API_KEY, BINANCE_API_SECRET] },
  async (request) => {
    assertAdmin(request.auth);
    const { symbol, orderId } = request.data || {};
    if (!symbol || !orderId) {
      throw new HttpsError("invalid-argument", "symbol and orderId are required");
    }
    return binanceRequest(
      "DELETE",
      "/api/v3/order",
      { symbol, orderId },
      BINANCE_API_KEY.value(),
      BINANCE_API_SECRET.value(),
      BINANCE_BASE_URL.value()
    );
  }
);
