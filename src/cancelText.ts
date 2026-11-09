import { byLang } from './lang';

export const CANCEL_TEXT = {
  en: {
    notFound: (id: number) => `Order #${id} was not found in your orders. Send MYORDERS to see them.`,
    cannot: (id: number) =>
      `Order #${id} cannot be cancelled here. It is already cancelled, or the seller has started working on it.`,
    cancelled: (id: number) => `Order #${id} has been cancelled.`,
  },
  hi: {
    notFound: (id: number) => `ऑर्डर #${id} आपके ऑर्डर में नहीं मिला। देखने के लिए MYORDERS भेजें।`,
    cannot: (id: number) =>
      `ऑर्डर #${id} यहाँ रद्द नहीं हो सकता। वह पहले ही रद्द हो चुका है, या विक्रेता ने उस पर काम शुरू कर दिया है।`,
    cancelled: (id: number) => `ऑर्डर #${id} रद्द कर दिया गया।`,
  },
  or: {
    notFound: (id: number) => `ଅର୍ଡର #${id} ଆପଣଙ୍କ ଅର୍ଡରରେ ମିଳିଲା ନାହିଁ। ଦେଖିବା ପାଇଁ MYORDERS ପଠାନ୍ତୁ।`,
    cannot: (id: number) =>
      `ଅର୍ଡର #${id} ଏଠାରେ ବାତିଲ କରାଯାଇପାରିବ ନାହିଁ। ଏହା ପୂର୍ବରୁ ବାତିଲ ହୋଇଛି, କିମ୍ବା ବିକ୍ରେତା ଏହା ଉପରେ କାମ ଆରମ୍ଭ କରିଛନ୍ତି।`,
    cancelled: (id: number) => `ଅର୍ଡର #${id} ବାତିଲ ହେଲା।`,
  },
  as: {
    notFound: (id: number) => `অৰ্ডাৰ #${id} আপোনাৰ অৰ্ডাৰত পোৱা নগ'ল। চাবলৈ MYORDERS পঠিয়াওক।`,
    cannot: (id: number) =>
      `অৰ্ডাৰ #${id} ইয়াত বাতিল কৰিব নোৱাৰি। ইতিমধ্যে বাতিল হৈছে, নহয় বিক্ৰেতাই কাম আৰম্ভ কৰিছে।`,
    cancelled: (id: number) => `অৰ্ডাৰ #${id} বাতিল কৰা হ'ল।`,
  },
};

export function cn(language: string) {
  return CANCEL_TEXT[language as keyof typeof CANCEL_TEXT] ?? CANCEL_TEXT.en;
}

// Notices to the seller, in the seller's language (built inside inLang, see lang.ts)
const SELLER_CANCEL = byLang({
  en: {
    byCustomer: (id: number) => `Order #${id} was cancelled by the customer. Please do not prepare it.`,
  },
  hi: {
    byCustomer: (id: number) => `ऑर्डर #${id} ग्राहक ने रद्द कर दिया। कृपया इसे तैयार न करें।`,
  },
  or: {
    byCustomer: (id: number) => `ଅର୍ଡର #${id} ଗ୍ରାହକ ବାତିଲ କରିଛନ୍ତି। ଦୟାକରି ଏହା ପ୍ରସ୍ତୁତ କରନ୍ତୁ ନାହିଁ।`,
  },
  as: {
    byCustomer: (id: number) => `অৰ্ডাৰ #${id} গ্ৰাহকে বাতিল কৰিলে। অনুগ্ৰহ কৰি ইয়াক সাজু নকৰিব।`,
  },
});

export function sellerCancelNotice(orderId: number): string {
  return SELLER_CANCEL.byCustomer(orderId);
}
