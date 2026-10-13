export const LANGUAGES: Record<string, { code: string; label: string }> = {
  '1': { code: 'en', label: 'English' },
  '2': { code: 'ta', label: 'தமிழ்' },
  '3': { code: 'hi', label: 'हिन्दी' },
  '4': { code: 'te', label: 'తెలుగు' },
  '5': { code: 'ml', label: 'മലയാളം' },
};

export function languageMenu(): string {
  const lines = Object.entries(LANGUAGES).map(
    ([num, l]) => `${num}. ${l.label}`
  );
  return `Welcome! Please choose your language:\n${lines.join('\n')}`;
}

export const WELCOME: Record<string, string> = {
  en: 'Language set to English. Reply MENU to see products.',
  ta: 'மொழி தமிழாக அமைக்கப்பட்டது. பொருட்களைப் பார்க்க MENU என்று அனுப்பவும்.',
  hi: 'भाषा हिन्दी सेट हो गई। उत्पाद देखने के लिए MENU भेजें।',
  te: 'భాష తెలుగుకు సెట్ చేయబడింది. ఉత్పత్తులు చూడటానికి MENU పంపండి.',
  ml: 'ഭാഷ മലയാളത്തിലേക്ക് സജ്ജമാക്കി. ഉൽപ്പന്നങ്ങൾ കാണാൻ MENU അയയ്ക്കുക.',
};

export const TEXT = {
  en: {
    productsTitle: 'Our products:',
    productsHint: 'Reply with a product number to add it to your cart.',
    askQty: (name: string) =>
      `How many of "${name}" do you want? Reply with a number (1-99), or CANCEL.`,
    added: (name: string, qty: number) =>
      `Added ${qty} x ${name} to your cart. Reply CART to view it or MENU to continue shopping.`,
    cartTitle: 'Your cart:',
    cartTotal: 'Total',
    emptyCart: 'Your cart is empty. Reply MENU to see products.',
    invalidProduct: 'Please reply with a valid product number, or MENU to see the list.',
    invalidQty: 'Please reply with a number from 1 to 99, or CANCEL.',
    cancelled: 'Cancelled. Reply MENU to see products.',
    help: 'Reply MENU for products, CART for your cart, LANG to change language.',
  },
  ta: {
    productsTitle: 'எங்கள் பொருட்கள்:',
    productsHint: 'கார்ட்டில் சேர்க்க பொருள் எண்ணை அனுப்பவும்.',
    askQty: (name: string) =>
      `"${name}" எத்தனை வேண்டும்? எண்ணை (1-99) அனுப்பவும், அல்லது CANCEL.`,
    added: (name: string, qty: number) =>
      `${qty} x ${name} கார்ட்டில் சேர்க்கப்பட்டது. பார்க்க CART, தொடர்ந்து வாங்க MENU என்று அனுப்பவும்.`,
    cartTitle: 'உங்கள் கார்ட்:',
    cartTotal: 'மொத்தம்',
    emptyCart: 'உங்கள் கார்ட் காலியாக உள்ளது. பொருட்களைப் பார்க்க MENU என்று அனுப்பவும்.',
    invalidProduct: 'சரியான பொருள் எண்ணை அனுப்பவும், அல்லது பட்டியலுக்கு MENU.',
    invalidQty: '1 முதல் 99 வரை எண்ணை அனுப்பவும், அல்லது CANCEL.',
    cancelled: 'ரத்து செய்யப்பட்டது. பொருட்களைப் பார்க்க MENU என்று அனுப்பவும்.',
    help: 'பொருட்களுக்கு MENU, கார்ட்டுக்கு CART, மொழி மாற்ற LANG என்று அனுப்பவும்.',
  },
  hi: {
    productsTitle: 'हमारे उत्पाद:',
    productsHint: 'कार्ट में जोड़ने के लिए उत्पाद नंबर भेजें।',
    askQty: (name: string) =>
      `"${name}" कितना चाहिए? संख्या (1-99) भेजें, या CANCEL।`,
    added: (name: string, qty: number) =>
      `${qty} x ${name} कार्ट में जोड़ा गया। देखने के लिए CART, खरीदारी जारी रखने के लिए MENU भेजें।`,
    cartTitle: 'आपका कार्ट:',
    cartTotal: 'कुल',
    emptyCart: 'आपका कार्ट खाली है। उत्पाद देखने के लिए MENU भेजें।',
    invalidProduct: 'कृपया सही उत्पाद नंबर भेजें, या सूची के लिए MENU।',
    invalidQty: 'कृपया 1 से 99 के बीच संख्या भेजें, या CANCEL।',
    cancelled: 'रद्द किया गया। उत्पाद देखने के लिए MENU भेजें।',
    help: 'उत्पादों के लिए MENU, कार्ट के लिए CART, भाषा बदलने के लिए LANG भेजें।',
  },
  te: {
    productsTitle: 'మా ఉత్పత్తులు:',
    productsHint: 'కార్ట్‌లో చేర్చడానికి ఉత్పత్తి నంబర్ పంపండి.',
    askQty: (name: string) =>
      `"${name}" ఎన్ని కావాలి? సంఖ్య (1-99) పంపండి, లేదా CANCEL.`,
    added: (name: string, qty: number) =>
      `${qty} x ${name} కార్ట్‌లో చేర్చబడింది. చూడటానికి CART, షాపింగ్ కొనసాగించడానికి MENU పంపండి.`,
    cartTitle: 'మీ కార్ట్:',
    cartTotal: 'మొత్తం',
    emptyCart: 'మీ కార్ట్ ఖాళీగా ఉంది. ఉత్పత్తులు చూడటానికి MENU పంపండి.',
    invalidProduct: 'దయచేసి సరైన ఉత్పత్తి నంబర్ పంపండి, లేదా జాబితా కోసం MENU.',
    invalidQty: 'దయచేసి 1 నుండి 99 మధ్య సంఖ్య పంపండి, లేదా CANCEL.',
    cancelled: 'రద్దు చేయబడింది. ఉత్పత్తులు చూడటానికి MENU పంపండి.',
    help: 'ఉత్పత్తుల కోసం MENU, కార్ట్ కోసం CART, భాష మార్చడానికి LANG పంపండి.',
  },
  ml: {
    productsTitle: 'ഞങ്ങളുടെ ഉൽപ്പന്നങ്ങൾ:',
    productsHint: 'കാർട്ടിലേക്ക് ചേർക്കാൻ ഉൽപ്പന്ന നമ്പർ അയയ്ക്കുക.',
    askQty: (name: string) =>
      `"${name}" എത്ര വേണം? ഒരു സംഖ്യ (1-99) അയയ്ക്കുക, അല്ലെങ്കിൽ CANCEL.`,
    added: (name: string, qty: number) =>
      `${qty} x ${name} കാർട്ടിൽ ചേർത്തു. കാണാൻ CART, ഷോപ്പിംഗ് തുടരാൻ MENU അയയ്ക്കുക.`,
    cartTitle: 'നിങ്ങളുടെ കാർട്ട്:',
    cartTotal: 'ആകെ',
    emptyCart: 'നിങ്ങളുടെ കാർട്ട് ശൂന്യമാണ്. ഉൽപ്പന്നങ്ങൾ കാണാൻ MENU അയയ്ക്കുക.',
    invalidProduct: 'ദയവായി ശരിയായ ഉൽപ്പന്ന നമ്പർ അയയ്ക്കുക, അല്ലെങ്കിൽ പട്ടികയ്ക്ക് MENU.',
    invalidQty: 'ദയവായി 1 മുതൽ 99 വരെയുള്ള സംഖ്യ അയയ്ക്കുക, അല്ലെങ്കിൽ CANCEL.',
    cancelled: 'റദ്ദാക്കി. ഉൽപ്പന്നങ്ങൾ കാണാൻ MENU അയയ്ക്കുക.',
    help: 'ഉൽപ്പന്നങ്ങൾക്ക് MENU, കാർട്ടിന് CART, ഭാഷ മാറ്റാൻ LANG അയയ്ക്കുക.',
  },
};

export function t(language: string) {
  return TEXT[language as keyof typeof TEXT] ?? TEXT.en;
}