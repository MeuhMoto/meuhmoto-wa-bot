const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ENV VARS (vamos configurar no Render)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;          // você escolhe (ex: "meuhmoto123")
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;      // token da Meta (NÃO compartilhar)
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;    // phone_number_id (da tela da Meta)

// 1) Verificação do webhook (Meta faz um GET aqui)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 2) Receber mensagens (Meta faz um POST aqui)
app.post("/webhook", async (req, res) => {
  try {
    // Sempre responder 200 rápido pra Meta não tentar reenviar
    res.sendStatus(200);

    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    const message = value?.messages?.[0];
    if (!message) return; // pode chegar status/updates sem mensagem

    const from = message.from; // número do cliente (com DDI, sem +)
    const text = message?.text?.body || "";

    // Exemplo básico: responder tudo que chegar
    await sendText(from, `Recebi sua mensagem: "${text}"\n\nMeuhMoto 🤝`);
  } catch (err) {
    console.error("Erro no webhook:", err?.response?.data || err.message);
  }
});

async function sendText(to, body) {
  // envia mensagem via Cloud API
  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body }
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Bot rodando na porta", PORT));
