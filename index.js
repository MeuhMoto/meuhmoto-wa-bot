// index.js
const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ENV
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // precisa ser IGUAL ao "Verificar token" no Meta
const PORT = process.env.PORT || 3000;

// ===================================
// 1) GET /webhook  (verificação do Meta)
// ===================================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado com sucesso");
    return res.status(200).send(challenge);
  }

  console.log("❌ Falha na verificação do webhook");
  return res.sendStatus(403);
});

// ===================================
// 2) POST /webhook  (recebe mensagens)
// ===================================
app.post("/webhook", async (req, res) => {
  try {
    console.log("📩 Evento recebido:", JSON.stringify(req.body, null, 2));

    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    // Se não é mensagem (pode ser status, etc), só confirma OK pro Meta
    if (!message) return res.sendStatus(200);

    const from = message.from; // telefone do cliente (wa_id)
    const text = message.text?.body || "";

    console.log("📨 Mensagem de:", from, "| Texto:", text);

    // Envia resposta
    await axios.post(
      `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: {
          body: "Olá! Sou o bot da MeuhMoto 🚀",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Resposta enviada com sucesso");
    return res.sendStatus(200);
  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error.response?.data || error.message);
    // IMPORTANTE: sempre 200 pro Meta não ficar reenviando em loop
    return res.sendStatus(200);
  }
});

// ===================================
// START
// ===================================
app.listen(PORT, () => {
  console.log(`🚀 Bot rodando na porta ${PORT}`);
});
