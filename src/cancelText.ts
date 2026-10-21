export const CANCEL_TEXT = {
  en: {
    notFound: (id: number) => `Order #${id} was not found in your orders. Send MYORDERS to see them.`,
    cannot: (id: number) =>
      `Order #${id} cannot be cancelled here. It is already cancelled, or the seller has started working on it.`,
    cancelled: (id: number) => `Order #${id} has been cancelled.`,
    byAdmin: (id: number) =>
      `Sorry, order #${id} was cancelled by the marketplace. You do not need to pay for it.`,
    byAdminPaid: (id: number) =>
      `Sorry, order #${id} was cancelled by the marketplace. You have already paid, so we will contact you about your refund.`,
  },
  hi: {
    notFound: (id: number) => `ऑर्डर #${id} आपके ऑर्डर में नहीं मिला। देखने के लिए MYORDERS भेजें।`,
    cannot: (id: number) =>
      `ऑर्डर #${id} यहाँ रद्द नहीं हो सकता। वह पहले ही रद्द हो चुका है, या विक्रेता ने उस पर काम शुरू कर दिया है।`,
    cancelled: (id: number) => `ऑर्डर #${id} रद्द कर दिया गया।`,
    byAdmin: (id: number) =>
      `क्षमा करें, ऑर्डर #${id} मार्केटप्लेस द्वारा रद्द कर दिया गया। आपको इसका भुगतान नहीं करना है।`,
    byAdminPaid: (id: number) =>
      `क्षमा करें, ऑर्डर #${id} मार्केटप्लेस द्वारा रद्द कर दिया गया। आप भुगतान कर चुके हैं, इसलिए हम रिफंड के बारे में आपसे संपर्क करेंगे।`,
  },
  or: {
    notFound: (id: number) => `ଅର୍ଡର #${id} ଆପଣଙ୍କ ଅର୍ଡରରେ ମିଳିଲା ନାହିଁ। ଦେଖିବା ପାଇଁ MYORDERS ପଠାନ୍ତୁ।`,
    cannot: (id: number) =>
      `ଅର୍ଡର #${id} ଏଠାରେ ବାତିଲ କରାଯାଇପାରିବ ନାହିଁ। ଏହା ପୂର୍ବରୁ ବାତିଲ ହୋଇଛି, କିମ୍ବା ବିକ୍ରେତା ଏହା ଉପରେ କାମ ଆରମ୍ଭ କରିଛନ୍ତି।`,
    cancelled: (id: number) => `ଅର୍ଡର #${id} ବାତିଲ ହେଲା।`,
    byAdmin: (id: number) =>
      `କ୍ଷମା କରନ୍ତୁ, ଅର୍ଡର #${id} ମାର୍କେଟପ୍ଲେସ୍ ଦ୍ୱାରା ବାତିଲ କରାଗଲା। ଆପଣଙ୍କୁ ଏହା ପାଇଁ ପଇସା ଦେବାକୁ ପଡ଼ିବ ନାହିଁ।`,
    byAdminPaid: (id: number) =>
      `କ୍ଷମା କରନ୍ତୁ, ଅର୍ଡର #${id} ମାର୍କେଟପ୍ଲେସ୍ ଦ୍ୱାରା ବାତିଲ କରାଗଲା। ଆପଣ ପୂର୍ବରୁ ପଇସା ଦେଇସାରିଛନ୍ତି, ତେଣୁ ରିଫଣ୍ଡ ବିଷୟରେ ଆମେ ଆପଣଙ୍କ ସହ ଯୋଗାଯୋଗ କରିବୁ।`,
  },
  as: {
    notFound: (id: number) => `অৰ্ডাৰ #${id} আপোনাৰ অৰ্ডাৰত পোৱা নগ'ল। চাবলৈ MYORDERS পঠিয়াওক।`,
    cannot: (id: number) =>
      `অৰ্ডাৰ #${id} ইয়াত বাতিল কৰিব নোৱাৰি। ইতিমধ্যে বাতিল হৈছে, নহয় বিক্ৰেতাই কাম আৰম্ভ কৰিছে।`,
    cancelled: (id: number) => `অৰ্ডাৰ #${id} বাতিল কৰা হ'ল।`,
    byAdmin: (id: number) =>
      `ক্ষমা কৰিব, অৰ্ডাৰ #${id} মাৰ্কেটপ্লেচে বাতিল কৰিলে। আপুনি ইয়াৰ বাবে ধন দিব নালাগে।`,
    byAdminPaid: (id: number) =>
      `ক্ষমা কৰিব, অৰ্ডাৰ #${id} মাৰ্কেটপ্লেচে বাতিল কৰিলে। আপুনি ইতিমধ্যে ধন দিছে, সেয়েহে ধন ঘূৰাই দিয়াৰ বিষয়ে আমি আপোনাৰ সৈতে যোগাযোগ কৰিম।`,
  },
};

export function cn(language: string) {
  return CANCEL_TEXT[language as keyof typeof CANCEL_TEXT] ?? CANCEL_TEXT.en;
}

// Message to the seller (English for now)
export function sellerCancelNotice(orderId: number): string {
  return `Order #${orderId} was cancelled by the customer. Please do not prepare it.`;
}

export function sellerAdminCancelNotice(orderId: number, paid: boolean): string {
  return (
    `Order #${orderId} was cancelled by the marketplace admin. Please do not prepare or ship it.` +
    (paid ? ' The customer already paid you by UPI; the admin will contact you about the refund.' : '')
  );
}
