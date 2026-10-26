export const STOCK_TEXT = {
  en: {
    unavailable: (name: string) =>
      `"${name}" is no longer available. Please remove it and tap Continue again.`,
    notEnough: (name: string, n: number) =>
      `Only ${n} of "${name}" left. Please choose ${n} or fewer and tap Continue again.`,
  },
  hi: {
    unavailable: (name: string) =>
      `"${name}" अब उपलब्ध नहीं है। कृपया इसे हटाकर फिर से "आगे बढ़ें" दबाएँ।`,
    notEnough: (name: string, n: number) =>
      `"${name}" केवल ${n} बचे हैं। कृपया ${n} या कम चुनकर फिर से "आगे बढ़ें" दबाएँ।`,
  },
  or: {
    unavailable: (name: string) =>
      `"${name}" ଆଉ ଉପଲବ୍ଧ ନାହିଁ। ଦୟାକରି ଏହାକୁ ହଟାଇ ପୁଣି "ଆଗକୁ ବଢ଼ନ୍ତୁ" ଦବାନ୍ତୁ।`,
    notEnough: (name: string, n: number) =>
      `"${name}" କେବଳ ${n}ଟି ବାକି ଅଛି। ଦୟାକରି ${n}ଟି ବା କମ୍ ବାଛି ପୁଣି "ଆଗକୁ ବଢ଼ନ୍ତୁ" ଦବାନ୍ତୁ।`,
  },
  as: {
    unavailable: (name: string) =>
      `"${name}" আৰু উপলব্ধ নহয়। অনুগ্ৰহ কৰি ইয়াক আঁতৰাই আকৌ "আগবাঢ়ক" টিপক।`,
    notEnough: (name: string, n: number) =>
      `"${name}" মাত্ৰ ${n}টা বাকী আছে। অনুগ্ৰহ কৰি ${n}টা বা কম বাছি আকৌ "আগবাঢ়ক" টিপক।`,
  },
};

export function st(language: string) {
  return STOCK_TEXT[language as keyof typeof STOCK_TEXT] ?? STOCK_TEXT.en;
}
