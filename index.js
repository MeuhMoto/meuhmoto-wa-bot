import express from "express";

const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// 🔹 GET de verificação do webhook (ESSENCIAL)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado com sucesso");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// 🔹 POST para receber mensagens
app.post("/webhook", (req, res) => {
  console.log("📩 Webhook recebido:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot rodando na porta ${PORT}`);
});
