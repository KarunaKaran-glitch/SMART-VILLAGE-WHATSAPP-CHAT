import 'dotenv/config';
import express, { Request, Response } from 'express';
import { prisma } from './db';
import { LANGUAGES, WELCOME, languageMenu } from './messages';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const PRODUCTS_TITLE: Record<string, string> = {
  en: 'Our products:',
  ta: 'எங்கள் பொருட்கள்:',
  hi: 'हमारे उत्पाद:',
  te: 'మా ఉత్పత్తులు:',
  ml: 'ഞങ്ങളുടെ ഉൽപ്പന്നങ്ങൾ:',
};

// For now this only prints the reply. Later it will send it through the WhatsApp API.
async function sendReply(to: string, text: string) {
  console.log(`>> Reply to ${to}:\n${text}\n`);
}

// Builds the product list in the customer's language
async function productList(language: string): Promise<string> {
  const products = await prisma.product.findMany({
    include: { translations: true },
    orderBy: { id: 'asc' },
  });

  if (products.length === 0) return 'No products yet.';

  const lines = products.map((p, i) => {
    const t = p.translations.find((x) => x.language === language);
    const name = t ? t.name : p.name; // fall back to the default name
    return `${i + 1}. ${name} - ₹${p.price}`;
  });

  return `${PRODUCTS_TITLE[language] ?? PRODUCTS_TITLE.en}\n${lines.join('\n')}`;
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
    const command = text.toUpperCase();

    console.log('Message from:', phone, '| text:', text);

    const existing = await prisma.user.findUnique({ where: { phone } });

    // New customer: save them and ask for a language
    if (!existing) {
      await prisma.user.create({ data: { phone, name } });
      await sendReply(phone, languageMenu());
      return;
    }

    // Customer wants to change language
    if (command === 'LANG') {
      await sendReply(phone, languageMenu());
      return;
    }

    // Customer wants to see products
    if (command === 'MENU') {
      await sendReply(phone, await productList(existing.language));
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

    // Anything else
    await sendReply(phone, WELCOME[existing.language] ?? WELCOME.en);
  } catch (err) {
    console.error('Webhook error:', err);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});