import 'dotenv/config';
import express, { Request, Response } from 'express';
import { prisma } from './db';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

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

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, name },
    });

    console.log('Message from:', user.phone, '| text:', message.text?.body);
  } catch (err) {
    console.error('Webhook error:', err);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});