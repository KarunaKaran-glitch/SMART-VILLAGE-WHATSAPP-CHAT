export const STOCK_TEXT = {
  en: {
    onlyLeft: (name: string, n: number) =>
      `Only ${n} of "${name}" available. Please send a smaller number, or CANCEL.`,
    unavailable: (name: string) =>
      `"${name}" is no longer available. Send CART, then REMOVE it from your cart.`,
    notEnough: (name: string, n: number) =>
      `Only ${n} of "${name}" left. Send CART and change your cart.`,
  },
  ta: {
    onlyLeft: (name: string, n: number) =>
      `"${name}" ${n} மட்டுமே உள்ளது. சிறிய எண்ணை அனுப்பவும், அல்லது CANCEL.`,
    unavailable: (name: string) =>
      `"${name}" இனி கிடைக்காது. CART என்று அனுப்பி, அதை கார்ட்டிலிருந்து REMOVE செய்யவும்.`,
    notEnough: (name: string, n: number) =>
      `"${name}" ${n} மட்டுமே மீதம் உள்ளது. CART என்று அனுப்பி கார்ட்டை மாற்றவும்.`,
  },
  hi: {
    onlyLeft: (name: string, n: number) =>
      `"${name}" केवल ${n} उपलब्ध हैं। कृपया छोटी संख्या भेजें, या CANCEL।`,
    unavailable: (name: string) =>
      `"${name}" अब उपलब्ध नहीं है। CART भेजकर इसे कार्ट से REMOVE करें।`,
    notEnough: (name: string, n: number) =>
      `"${name}" केवल ${n} बचे हैं। CART भेजकर अपना कार्ट बदलें।`,
  },
  te: {
    onlyLeft: (name: string, n: number) =>
      `"${name}" ${n} మాత్రమే ఉన్నాయి. దయచేసి చిన్న సంఖ్య పంపండి, లేదా CANCEL.`,
    unavailable: (name: string) =>
      `"${name}" ఇక అందుబాటులో లేదు. CART పంపి, దాన్ని కార్ట్ నుండి REMOVE చేయండి.`,
    notEnough: (name: string, n: number) =>
      `"${name}" ${n} మాత్రమే మిగిలి ఉన్నాయి. CART పంపి మీ కార్ట్ మార్చండి.`,
  },
  ml: {
    onlyLeft: (name: string, n: number) =>
      `"${name}" ${n} മാത്രമേ ലഭ്യമുള്ളൂ. ദയവായി ചെറിയ സംഖ്യ അയയ്ക്കുക, അല്ലെങ്കിൽ CANCEL.`,
    unavailable: (name: string) =>
      `"${name}" ഇനി ലഭ്യമല്ല. CART അയച്ച്, ഇത് കാർട്ടിൽ നിന്ന് REMOVE ചെയ്യുക.`,
    notEnough: (name: string, n: number) =>
      `"${name}" ${n} മാത്രമേ ബാക്കിയുള്ളൂ. CART അയച്ച് നിങ്ങളുടെ കാർട്ട് മാറ്റുക.`,
  },
};

export function st(language: string) {
  return STOCK_TEXT[language as keyof typeof STOCK_TEXT] ?? STOCK_TEXT.en;
}