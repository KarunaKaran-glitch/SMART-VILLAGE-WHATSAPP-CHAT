const STATUS_LABELS: Record<string, Record<string, string>> = {
  en: {
    CONFIRMED: 'confirmed by the seller',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
  },
  ta: {
    CONFIRMED: 'விற்பனையாளரால் உறுதி செய்யப்பட்டது',
    SHIPPED: 'அனுப்பப்பட்டது',
    DELIVERED: 'டெலிவரி செய்யப்பட்டது',
  },
  hi: {
    CONFIRMED: 'विक्रेता ने पुष्टि की',
    SHIPPED: 'भेज दिया गया',
    DELIVERED: 'पहुँचा दिया गया',
  },
};

export const ORDER_TEXT = {
  en: {
    placed: (id: number, total: number) =>
      `Order #${id} placed. Total: ₹${total}. Thank you! Reply MENU to shop more.`,
    status: (id: number, s: string) =>
      `Order #${id} update: ${STATUS_LABELS.en[s] ?? s}.`,
  },
  ta: {
    placed: (id: number, total: number) =>
      `ஆர்டர் #${id} பதிவு செய்யப்பட்டது. மொத்தம்: ₹${total}. நன்றி! மேலும் வாங்க MENU என்று அனுப்பவும்.`,
    status: (id: number, s: string) =>
      `ஆர்டர் #${id}: ${STATUS_LABELS.ta[s] ?? s}.`,
  },
  hi: {
    placed: (id: number, total: number) =>
      `ऑर्डर #${id} दर्ज हो गया। कुल: ₹${total}। धन्यवाद! और खरीदारी के लिए MENU भेजें।`,
    status: (id: number, s: string) =>
      `ऑर्डर #${id}: ${STATUS_LABELS.hi[s] ?? s}।`,
  },
};

export function ot(language: string) {
  return ORDER_TEXT[language as keyof typeof ORDER_TEXT] ?? ORDER_TEXT.en;
}