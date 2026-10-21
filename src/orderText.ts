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
    placed: (id: number, total: number) =>
      `Order #${id} placed. Total: ₹${total}. Payment: cash on delivery. Thank you! Reply MENU to shop more.`,
    status: (id: number, s: string) =>
      `Order #${id} update: ${STATUS_LABELS.en[s] ?? s}.`,
  },
  hi: {
    placed: (id: number, total: number) =>
      `ऑर्डर #${id} दर्ज हो गया। कुल: ₹${total}। भुगतान: डिलीवरी पर नकद। धन्यवाद! और खरीदारी के लिए MENU भेजें।`,
    status: (id: number, s: string) =>
      `ऑर्डर #${id}: ${STATUS_LABELS.hi[s] ?? s}।`,
  },
  or: {
    placed: (id: number, total: number) =>
      `ଅର୍ଡର #${id} ହୋଇଗଲା। ମୋଟ: ₹${total}। ପେମେଣ୍ଟ: ଡେଲିଭରି ସମୟରେ ନଗଦ। ଧନ୍ୟବାଦ! ଆଉ କିଣିବା ପାଇଁ MENU ପଠାନ୍ତୁ।`,
    status: (id: number, s: string) =>
      `ଅର୍ଡର #${id}: ${STATUS_LABELS.or[s] ?? s}।`,
  },
  as: {
    placed: (id: number, total: number) =>
      `অৰ্ডাৰ #${id} দিয়া হ'ল। মুঠ: ₹${total}। পৰিশোধ: ডেলিভাৰীৰ সময়ত নগদ। ধন্যবাদ! আৰু কিনিবলৈ MENU পঠিয়াওক।`,
    status: (id: number, s: string) =>
      `অৰ্ডাৰ #${id}: ${STATUS_LABELS.as[s] ?? s}।`,
  },
};

export function ot(language: string) {
  return ORDER_TEXT[language as keyof typeof ORDER_TEXT] ?? ORDER_TEXT.en;
}
