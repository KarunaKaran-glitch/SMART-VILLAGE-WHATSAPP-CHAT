export const ORDER_TEXT = {
  en: {
    placed: (id: number, total: number) =>
      `Order #${id} placed. Total: ₹${total}. Thank you! Reply MENU to shop more.`,
  },
  ta: {
    placed: (id: number, total: number) =>
      `ஆர்டர் #${id} பதிவு செய்யப்பட்டது. மொத்தம்: ₹${total}. நன்றி! மேலும் வாங்க MENU என்று அனுப்பவும்.`,
  },
  hi: {
    placed: (id: number, total: number) =>
      `ऑर्डर #${id} दर्ज हो गया। कुल: ₹${total}। धन्यवाद! और खरीदारी के लिए MENU भेजें।`,
  },
};

export function ot(language: string) {
  return ORDER_TEXT[language as keyof typeof ORDER_TEXT] ?? ORDER_TEXT.en;
}