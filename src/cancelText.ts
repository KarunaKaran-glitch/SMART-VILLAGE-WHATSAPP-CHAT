export const CANCEL_TEXT = {
  en: {
    notFound: (id: number) => `Order #${id} was not found in your orders. Send MYORDERS to see them.`,
    cannot: (id: number) =>
      `Order #${id} can no longer be cancelled here because the seller has already started working on it.`,
    cancelled: (id: number) => `Order #${id} has been cancelled.`,
  },
  ta: {
    notFound: (id: number) => `ஆர்டர் #${id} உங்கள் ஆர்டர்களில் இல்லை. பார்க்க MYORDERS என்று அனுப்பவும்.`,
    cannot: (id: number) =>
      `ஆர்டர் #${id} ஐ இனி ரத்து செய்ய முடியாது, ஏனெனில் விற்பனையாளர் ஏற்கனவே செயல்படத் தொடங்கிவிட்டார்.`,
    cancelled: (id: number) => `ஆர்டர் #${id} ரத்து செய்யப்பட்டது.`,
  },
  hi: {
    notFound: (id: number) => `ऑर्डर #${id} आपके ऑर्डर में नहीं मिला। देखने के लिए MYORDERS भेजें।`,
    cannot: (id: number) =>
      `ऑर्डर #${id} अब रद्द नहीं हो सकता, क्योंकि विक्रेता ने उस पर काम शुरू कर दिया है।`,
    cancelled: (id: number) => `ऑर्डर #${id} रद्द कर दिया गया।`,
  },
};

export function cn(language: string) {
  return CANCEL_TEXT[language as keyof typeof CANCEL_TEXT] ?? CANCEL_TEXT.en;
}

// Message to the seller (English for now)
export function sellerCancelNotice(orderId: number): string {
  return `Order #${orderId} was cancelled by the customer. Please do not prepare it.`;
}