export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("OK");
  }

  const { product, price, delivery, city, payment } = req.body;

  const message = `
🛒 NOUVELLE COMMANDE

📦 Produit : ${product}
💰 Prix : ${price} €
🚚 Livraison : ${delivery}
📍 Ville : ${city}
💳 Paiement : ${payment}
  `;

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  const url = https://api.telegram.org/bot${BOT_TOKEN}/sendMessage;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
    }),
  });

  res.status(200).json({ success: true });
}
