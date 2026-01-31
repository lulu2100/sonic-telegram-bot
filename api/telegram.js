module.exports = async (req, res) => {
  try {
    // Test simple dans Safari
    if (req.method === "GET") {
      return res.status(200).send("OK");
    }

    // Optionnel: gérer le preflight CORS si besoin
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // On accepte uniquement POST pour envoyer la commande
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { product, price, delivery, city, payment } = req.body || {};

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    // Sécurité : si variables manquantes, on répond proprement
    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({ error: "Missing BOT_TOKEN or CHAT_ID in Vercel env" });
    }

    const message = `🛒 NOUVELLE COMMANDE

📦 Produit : ${product || "-"}
💰 Prix : ${price || "-"} €
🚚 Livraison : ${delivery || "-"}
📍 Ville : ${city || "-"}
💳 Paiement : ${payment || "-"}`;

    const url = https://api.telegram.org/bot${BOT_TOKEN}/sendMessage;

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    });

    const data = await r.json();

    if (!data.ok) {
      return res.status(500).json({ error: "Telegram API error", data });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "crash", details: String(e) });
  }
};
