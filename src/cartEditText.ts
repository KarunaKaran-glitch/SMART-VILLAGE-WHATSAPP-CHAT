export const CART_EDIT_TEXT = {
  en: {
    hint: 'Send REMOVE 1 to remove line 1, CLEAR to empty the cart, or ORDER to place the order.',
    removed: 'Item removed.',
    cleared: 'Your cart is now empty. Reply MENU to see products.',
    invalidLine: 'There is no such line in your cart. Send CART to see the line numbers.',
  },
  ta: {
    hint: 'வரி 1 ஐ நீக்க REMOVE 1, கார்ட்டை காலி செய்ய CLEAR, ஆர்டர் செய்ய ORDER என்று அனுப்பவும்.',
    removed: 'பொருள் நீக்கப்பட்டது.',
    cleared: 'உங்கள் கார்ட் இப்போது காலியாக உள்ளது. பொருட்களைப் பார்க்க MENU என்று அனுப்பவும்.',
    invalidLine: 'கார்ட்டில் அந்த வரி இல்லை. வரி எண்களைப் பார்க்க CART என்று அனுப்பவும்.',
  },
  hi: {
    hint: 'लाइन 1 हटाने के लिए REMOVE 1, कार्ट खाली करने के लिए CLEAR, ऑर्डर के लिए ORDER भेजें।',
    removed: 'आइटम हटा दिया गया।',
    cleared: 'आपका कार्ट अब खाली है। उत्पाद देखने के लिए MENU भेजें।',
    invalidLine: 'कार्ट में ऐसी कोई लाइन नहीं है। लाइन नंबर देखने के लिए CART भेजें।',
  },
  te: {
    hint: 'లైన్ 1 తొలగించడానికి REMOVE 1, కార్ట్ ఖాళీ చేయడానికి CLEAR, ఆర్డర్ చేయడానికి ORDER పంపండి.',
    removed: 'వస్తువు తొలగించబడింది.',
    cleared: 'మీ కార్ట్ ఇప్పుడు ఖాళీగా ఉంది. ఉత్పత్తులు చూడటానికి MENU పంపండి.',
    invalidLine: 'మీ కార్ట్‌లో ఆ లైన్ లేదు. లైన్ నంబర్లు చూడటానికి CART పంపండి.',
  },
  ml: {
    hint: 'വരി 1 നീക്കം ചെയ്യാൻ REMOVE 1, കാർട്ട് ഒഴിവാക്കാൻ CLEAR, ഓർഡർ ചെയ്യാൻ ORDER അയയ്ക്കുക.',
    removed: 'ഇനം നീക്കം ചെയ്തു.',
    cleared: 'നിങ്ങളുടെ കാർട്ട് ഇപ്പോൾ ശൂന്യമാണ്. ഉൽപ്പന്നങ്ങൾ കാണാൻ MENU അയയ്ക്കുക.',
    invalidLine: 'കാർട്ടിൽ അങ്ങനെയൊരു വരി ഇല്ല. വരി നമ്പറുകൾ കാണാൻ CART അയയ്ക്കുക.',
  },
};

export function ct(language: string) {
  return CART_EDIT_TEXT[language as keyof typeof CART_EDIT_TEXT] ?? CART_EDIT_TEXT.en;
}