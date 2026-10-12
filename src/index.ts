import 'dotenv/config';
import express, { Request, Response } from 'express';
import { prisma } from './db';
import { LANGUAGES, WELCOME, languageMenu } from './messages';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// For now this only prints the reply. Later it will send it through the WhatsApp API.
async function sendReply(to: string, text: string) {
  console.log(`>> Reply to ${to}:\n${text}\n`);
}

app.get('/', (_req: Request, res: Response) => {
  res.send('WhatsApp Marketplace server is running');
});

// Meta calls this once to verify your webhook
app.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(String(challenge));
  }
  res.sendStatus(403);
});

// WhatsApp sends incoming messages here
app.post('/webhook', async (req: Request, res: Response) => {
  // Reply to Meta immediately so it does not retry
  res.sendStatus(200);

  try {
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) return; // not a message (for example a delivery status)

    const phone: string = message.from;
    const name: string | undefined = value?.contacts?.[0]?.profile?.name;
    const text: string = (message.text?.body ?? '').trim();

    console.log('Message from:', phone, '| text:', text);

    const existing = await prisma.user.findUnique({ where: { phone } });

    // New customer: save them and ask for a language
    if (!existing) {
      await prisma.user.create({ data: { phone, name } });
      await sendReply(phone, languageMenu());
      return;
    }

    // Customer chose a language (1 to 5)
    const chosen = LANGUAGES[text];
    if (chosen) {
      await prisma.user.update({
        where: { phone },
        data: { language: chosen.code },
      });
      await sendReply(phone, WELCOME[chosen.code]);
      return;
    }

    // Customer wants to change language
    if (text.toUpperCase() === 'LANG') {
      await sendReply(phone, languageMenu());
      return;
    }

    // Anything else (products come in a later step)
    await sendReply(phone, WELCOME[existing.language] ?? WELCOME.en);
  } catch (err) {
    console.error('Webhook error:', err);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});