export const CART_EDIT_TEXT = {
  en: {
    hint: 'Send REMOVE 1 to remove line 1, CLEAR to empty the cart, or ORDER to place the order.',
    removed: 'Item removed.',
    cleared: 'Your cart is now empty. Reply MENU to see products.',
    invalidLine: 'There is no such line in your cart. Send CART to see the line numbers.',
  },
  hi: {
    hint: 'लाइन 1 हटाने के लिए REMOVE 1, कार्ट खाली करने के लिए CLEAR, ऑर्डर के लिए ORDER भेजें।',
    removed: 'आइटम हटा दिया गया।',
    cleared: 'आपका कार्ट अब खाली है। उत्पाद देखने के लिए MENU भेजें।',
    invalidLine: 'कार्ट में ऐसी कोई लाइन नहीं है। लाइन नंबर देखने के लिए CART भेजें।',
  },
  or: {
    hint: 'ଲାଇନ 1 ହଟାଇବା ପାଇଁ REMOVE 1, କାର୍ଟ ଖାଲି କରିବା ପାଇଁ CLEAR, ଅର୍ଡର ପାଇଁ ORDER ପଠାନ୍ତୁ।',
    removed: 'ଜିନିଷଟି ହଟାଗଲା।',
    cleared: 'ଆପଣଙ୍କ କାର୍ଟ ଏବେ ଖାଲି। ଉତ୍ପାଦ ଦେଖିବା ପାଇଁ MENU ପଠାନ୍ତୁ।',
    invalidLine: 'କାର୍ଟରେ ଏପରି କୌଣସି ଲାଇନ ନାହିଁ। ଲାଇନ ନମ୍ବର ଦେଖିବା ପାଇଁ CART ପଠାନ୍ତୁ।',
  },
  as: {
    hint: 'শাৰী 1 আঁতৰাবলৈ REMOVE 1, কাৰ্ট খালী কৰিবলৈ CLEAR, অৰ্ডাৰৰ বাবে ORDER পঠিয়াওক।',
    removed: 'সামগ্ৰীটো আঁতৰোৱা হ\'ল।',
    cleared: 'আপোনাৰ কাৰ্ট এতিয়া খালী। সামগ্ৰী চাবলৈ MENU পঠিয়াওক।',
    invalidLine: 'কাৰ্টত তেনে কোনো শাৰী নাই। শাৰীৰ নম্বৰ চাবলৈ CART পঠিয়াওক।',
  },
};

export function ct(language: string) {
  return CART_EDIT_TEXT[language as keyof typeof CART_EDIT_TEXT] ?? CART_EDIT_TEXT.en;
}
