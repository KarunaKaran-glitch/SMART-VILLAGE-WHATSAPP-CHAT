const STATUS_LABELS: Record<string, Record<string, string>> = {
  en: {
    CONFIRMED: 'confirmed by the seller',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
  },
  hi: {
    CONFIRMED: 'विक्रेता ने पुष्टि की',
    SHIPPED: 'भेज दिया गया',
    DELIVERED: 'पहुँचा दिया गया',
  },
  or: {
    CONFIRMED: 'ବିକ୍ରେତା ନିଶ୍ଚିତ କଲେ',
    SHIPPED: 'ପଠାଯାଇଛି',
    DELIVERED: 'ଡେଲିଭରି ହୋଇଗଲା',
  },
  as: {
    CONFIRMED: 'বিক্ৰেতাই নিশ্চিত কৰিলে',
    SHIPPED: 'পঠিওৱা হ\'ল',
    DELIVERED: 'ডেলিভাৰী হ\'ল',
  },
};

export const ORDER_TEXT = {
  en: {
    status: (id: number, s: string) =>
      `Order #${id} update: ${STATUS_LABELS.en[s] ?? s}.`,
  },
  hi: {
    status: (id: number, s: string) =>
      `ऑर्डर #${id}: ${STATUS_LABELS.hi[s] ?? s}।`,
  },
  or: {
    status: (id: number, s: string) =>
      `ଅର୍ଡର #${id}: ${STATUS_LABELS.or[s] ?? s}।`,
  },
  as: {
    status: (id: number, s: string) =>
      `অৰ্ডাৰ #${id}: ${STATUS_LABELS.as[s] ?? s}।`,
  },
};

export function ot(language: string) {
  return ORDER_TEXT[language as keyof typeof ORDER_TEXT] ?? ORDER_TEXT.en;
}
