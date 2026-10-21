export const STOCK_TEXT = {
  en: {
    onlyLeft: (name: string, n: number) =>
      `Only ${n} of "${name}" available. Please send a smaller number, or CANCEL.`,
    unavailable: (name: string) =>
      `"${name}" is no longer available. Send CART, then REMOVE it from your cart.`,
    notEnough: (name: string, n: number) =>
      `Only ${n} of "${name}" left. Send CART and change your cart.`,
  },
  hi: {
    onlyLeft: (name: string, n: number) =>
      `"${name}" केवल ${n} उपलब्ध हैं। कृपया छोटी संख्या भेजें, या CANCEL।`,
    unavailable: (name: string) =>
      `"${name}" अब उपलब्ध नहीं है। CART भेजकर इसे कार्ट से REMOVE करें।`,
    notEnough: (name: string, n: number) =>
      `"${name}" केवल ${n} बचे हैं। CART भेजकर अपना कार्ट बदलें।`,
  },
  or: {
    onlyLeft: (name: string, n: number) =>
      `"${name}" କେବଳ ${n}ଟି ଉପଲବ୍ଧ। ଦୟାକରି ଛୋଟ ସଂଖ୍ୟା ପଠାନ୍ତୁ, କିମ୍ବା CANCEL।`,
    unavailable: (name: string) =>
      `"${name}" ଆଉ ଉପଲବ୍ଧ ନାହିଁ। CART ପଠାଇ ଏହାକୁ କାର୍ଟରୁ REMOVE କରନ୍ତୁ।`,
    notEnough: (name: string, n: number) =>
      `"${name}" କେବଳ ${n}ଟି ବାକି ଅଛି। CART ପଠାଇ ଆପଣଙ୍କ କାର୍ଟ ବଦଳାନ୍ତୁ।`,
  },
  as: {
    onlyLeft: (name: string, n: number) =>
      `"${name}" মাত্ৰ ${n}টা উপলব্ধ। অনুগ্ৰহ কৰি সৰু সংখ্যা পঠিয়াওক, নহয় CANCEL।`,
    unavailable: (name: string) =>
      `"${name}" আৰু উপলব্ধ নহয়। CART পঠিয়াই ইয়াক কাৰ্টৰ পৰা REMOVE কৰক।`,
    notEnough: (name: string, n: number) =>
      `"${name}" মাত্ৰ ${n}টা বাকী আছে। CART পঠিয়াই আপোনাৰ কাৰ্ট সলনি কৰক।`,
  },
};

export function st(language: string) {
  return STOCK_TEXT[language as keyof typeof STOCK_TEXT] ?? STOCK_TEXT.en;
}
