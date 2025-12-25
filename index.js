const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// =========================
// VARIÁVEIS DE AMBIENTE
// =========================
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// =========================
// GET — VERIFICAÇÃO WEBHOOK
// =========================
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

// =========================
// POST — RECEBER MENSAGENS
// =========================
app.post("/webhook", async (req, res) => {
  try {
    console.log("📩 Evento recebido:");
    console.log(JSON.stringify(req.body, null, 2));

    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    // Se não for mensagem (ex: status), só confirma
    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from; // telefone do cliente
    const text = message.text?.body || "";

    console.log(`📨 Mensagem de ${from}: ${text}`);

    // =========================
    // ENVIAR RESPOSTA
    // =========================
    await axios.post(
      `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: {
          body: "👋 Olá! Sou o bot da MeuhMoto 🚀\nEm breve vamos te atender automaticamente."
        }
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Resposta enviada com sucesso");
    res.sendStatus(200);

  } catch (error) {
    console.error("❌ Erro ao processar mensagem:");
    console.error(error.response?.data || error.message);
    res.sendStatus(200);
  }
});

// =========================
// START SERVER — RENDER OK
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Bot rodando na porta ${PORT}`);
});
