const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ✅ Variáveis de ambiente (você vai configurar no Render)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "meuhmoto_verify";
const GRAPH_TOKEN = process.env.WHATSAPP_TOKEN; // token do WhatsApp (NÃO coloque aqui no código)
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; // id do número (vem do WhatsApp Manager / Cloud API)

// ✅ Healthcheck (pra Render)
app.get("/", (req, res) => {
  res.status(200).send("MeuHMoto WA Bot OK ✅");
});

// ✅ Verificação do Webhook (Meta chama isso)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ✅ Recebe mensagens do WhatsApp
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.object) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      const messages = value?.messages;
      if (messages && messages.length > 0) {
        const msg = messages[0];
        const from = msg.from; // número do cliente
        const text = msg?.text?.body?.trim() || "";

        // Resposta simples (vamos melhorar depois)
        let reply = "Olá! Sou o bot da MeuHMoto. 😊\nDigite:\n1) Planos\n2) Documentos\n3) Suporte";

        if (text === "1" || text.toLowerCase().includes("plano")) {
          reply =
            "📌 Planos MeuHMoto:\n\nA) Locou, Rodou, Ficou\nB) Locou, Rodou, Lucrou\n\nDigite A ou B.";
        } else if (text === "a") {
          reply =
            "✅ Locou, Rodou, Ficou:\n- Pagamento semanal\n- Sem caução (em alguns casos)\n- Uso ilimitado com raio gratuito (ex: 60km)\n\nQuer simular? Digite: SIMULAR";
        } else if (text === "b") {
          reply =
            "✅ Locou, Rodou, Lucrou:\n- Contrato 6 ou 12 meses\n- Com caução (ex: R$700)\n\nQuer detalhes? Digite: 6 ou 12";
        } else if (text === "2" || text.toLowerCase().includes("document")) {
          reply = "📄 Documentos:\n- CNH\n- Comprovante de residência\n- Selfie com documento\n\nQuer falar com um atendente? Digite: HUMANO";
        } else if (text === "3" || text.toLowerCase().includes("suporte")) {
          reply = "🛠️ Suporte:\nMe diga seu problema em 1 frase que eu encaminho. 😊";
        }

        // Envia resposta
        await sendWhatsAppMessage(from, reply);
      }

      return res.sendStatus(200);
    }

    return res.sendStatus(404);
  } catch (err) {
    console.error("Webhook error:", err?.response?.data || err.message);
    return res.sendStatus(500);
  }
});

// ✅ Função de envio
async function sendWhatsAppMessage(to, message) {
  if (!GRAPH_TOKEN || !PHONE_NUMBER_ID) {
    console.log("Faltando WHATSAPP_TOKEN ou PHONE_NUMBER_ID nas variáveis de ambiente.");
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${GRAPH_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Rodando na porta ${PORT}`));

