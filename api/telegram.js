// /api/telegram.js
export default async function handler(req, res) {
  try {
    // --- CORS (mini-app -> bot API) ---
res.setHeader(
  "Access-Control-Allow-Origin",
  "https://sonic-mini-app.vercel.app"
);
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

// Répondre aux requêtes preflight (obligatoire pour fetch depuis la mini-app)
if (req.method === "OPTIONS") {
  return res.status(200).end();
}
    // Telegram envoie en POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID; // ton chat_id (ex: 5002592045)
    const MINIAPP_URL = process.env.MINIAPP_URL;     // https://sonic-mini-app.vercel.app
    const CHANNEL_URL = process.env.CHANNEL_URL;     // https://t.me/sonic_officiel_coffee
    const SNAP_URL = process.env.SNAP_URL;           // https://snapchat.com/t/9Q5706HB
    const CONTACT_URL = process.env.CONTACT_URL;     // https://t.me/SonicShop_Officiel (sans @)
    const RETOURS_URL = process.env.RETOURS_URL || ""; // tu mettras plus tard

    if (!BOT_TOKEN || !ADMIN_CHAT_ID || !MINIAPP_URL || !CHANNEL_URL || !SNAP_URL || !CONTACT_URL) {
      return res.status(500).json({
        error: "Missing env vars in Vercel",
        required: ["BOT_TOKEN","ADMIN_CHAT_ID","MINIAPP_URL","CHANNEL_URL","SNAP_URL","CONTACT_URL"],
      });
    }

    const body = req.body || {};

    // ---------- Helpers ----------
    const tg = async (method, payload) => {
      const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(`${method} failed: ${JSON.stringify(data)}`);
      return data;
    };

    const buildMenuKeyboard = () => {
      const rows = [
        [
          { text: "Informations ℹ️", url: CHANNEL_URL },
          { text: "Contact 💬", url: CONTACT_URL },
        ],
        [
          { text: "Sonic mini-app 📱", web_app: { url: MINIAPP_URL } },
        ],
        [
          { text: "Canal 📣", url: CHANNEL_URL },
          { text: "Snapchat 👻", url: SNAP_URL },
        ],
      ];

      if (RETOURS_URL) {
        rows.push([{ text: "Vos Retours 📦", url: RETOURS_URL }]);
      }

      return { inline_keyboard: rows };
    };

    const sendStartMenu = async (chatId) => {
      const text =
        "👋 Bienvenue chez Sonic Coffee.\n\n" +
        "➡️ Ouvre la mini-app pour voir les produits et commander.\n" +
        "📣 Infos + liens juste en dessous.";

     await tg("sendVideo", {
  chat_id: chatId,
  video: process.env.WELCOME_VIDEO_URL,
  caption: text,
  reply_markup: buildMenuKeyboard(),
});
    };

    // ---------- 1) Cas Telegram webhook (update) ----------
    if (body.message || body.callback_query) {
      const msg = body.message || body.callback_query?.message;
      const chatId = msg?.chat?.id;

      // si pas de chatId, on répond ok pour pas casser le webhook
      if (!chatId) return res.status(200).json({ ok: true });

      const text = body.message?.text || "";

      // /start ou /menu => on renvoie le menu
      if (text.startsWith("/start") || text.startsWith("/menu")) {
        await sendStartMenu(chatId);
      }

      // IMPORTANT: toujours répondre 200 sinon Telegram re-tente => spam + logs rouges
      return res.status(200).json({ ok: true });
    }

    // ---------- 2) Cas mini-app (commande) ----------
    // Ta mini-app doit POST ici un JSON genre:
    // { product, price, qty, delivery, city, address, payment, customer_name, customer_phone }
    const {
  products = [],
  delivery,
  city,
  address,
  payment,
  customer_name,
  customer_phone,
  note,
} = body;

    // Si c'est pas une commande valide, on ignore proprement
   if (!products || products.length === 0) {
  return res.status(200).json({ ok: true, ignored: true });
}

   const productsText = (products || [])
  .map(p => `• ${p.product ?? "-"} — ${p.qty ?? "-"} — ${p.price ?? "-"}€`)
  .join("\n");

const orderText =
  `🛒 NOUVELLE COMMANDE\n\n` +
  `📦 Produits :\n${productsText || "-"}\n\n` +
  `🚚 Livraison : ${delivery ?? "-"}\n` +
  `🏙️ Ville : ${city ?? "-"}\n` +
  `📍 Adresse : ${address ?? "-"}\n` +
  `💳 Paiement : ${payment ?? "-"}\n` +
  `👤 Nom : ${customer_name ?? "-"}\n` +
  `📞 Téléphone : ${customer_phone ?? "-"}\n` +
  `📝 Note : ${note ?? "-"}`;

    await tg("sendMessage", {
      chat_id: ADMIN_CHAT_ID,
      text: orderText,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    // Répondre 200 à Telegram évite les retries infinis,
    // mais tu veux voir l'erreur dans Vercel:
    console.error("ERROR /api/telegram:", e);
    return res.status(500).json({ error: "Server crashed", details: String(e?.message || e) });
  }
}
