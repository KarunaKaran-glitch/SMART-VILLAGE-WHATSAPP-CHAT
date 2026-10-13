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
};

export function ct(language: string) {
  return CART_EDIT_TEXT[language as keyof typeof CART_EDIT_TEXT] ?? CART_EDIT_TEXT.en;
}