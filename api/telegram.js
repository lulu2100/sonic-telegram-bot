export default async function handler(req, res) {
  try {
    // 1) On refuse GET (Safari) => doit renvoyer 405
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // 2) Variables Vercel
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({
        error: "Missing BOT_TOKEN or CHAT_ID in Vercel env",
      });
    }

    // 3) Données envoyées depuis ton site (POST JSON)
    const { product, price, delivery, city, payment } = req.body || {};

    const message =
      `🛒 NOUVELLE COMMANDE\n\n` +
      `📦 Produit : ${product || "-"}\n` +
      `💰 Prix : ${price || "-"} €\n` +
      `🚚 Livraison : ${delivery || "-"}\n` +
      `📍 Ville : ${city || "-"}\n` +
      `💳 Paiement : ${payment || "-"}\n`;

    // ✅ IMPORTANT: backticks + URL correcte
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(500).json({ error: "Telegram API error", data });
    }

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: "Server crashed", details: String(e) });
  }
}
