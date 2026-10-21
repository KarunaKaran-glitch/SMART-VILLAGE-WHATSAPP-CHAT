// The languages customers can choose (number = position in the language list)
export const LANGUAGES: Record<string, { code: string; label: string }> = {
  '1': { code: 'en', label: 'English' },
  '2': { code: 'hi', label: 'हिन्दी' },
  '3': { code: 'or', label: 'ଓଡ଼ିଆ' },
  '4': { code: 'as', label: 'অসমীয়া' },
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
  or: {
    productsTitle: 'ଆମର ଉତ୍ପାଦ:',
    productsHint: 'କାର୍ଟରେ ଯୋଡ଼ିବା ପାଇଁ ଉତ୍ପାଦ ନମ୍ବର ପଠାନ୍ତୁ।',
    askQty: (name: string) =>
      `"${name}" କେତୋଟି ଦରକାର? ଏକ ସଂଖ୍ୟା (1-99) ପଠାନ୍ତୁ, କିମ୍ବା CANCEL।`,
    added: (name: string, qty: number) =>
      `${qty} x ${name} କାର୍ଟରେ ଯୋଡ଼ାଗଲା। ଦେଖିବା ପାଇଁ CART, ଆଉ କିଣିବା ପାଇଁ MENU ପଠାନ୍ତୁ।`,
    cartTitle: 'ଆପଣଙ୍କ କାର୍ଟ:',
    cartTotal: 'ମୋଟ',
    emptyCart: 'ଆପଣଙ୍କ କାର୍ଟ ଖାଲି ଅଛି। ଉତ୍ପାଦ ଦେଖିବା ପାଇଁ MENU ପଠାନ୍ତୁ।',
    invalidProduct: 'ଦୟାକରି ଠିକ୍ ଉତ୍ପାଦ ନମ୍ବର ପଠାନ୍ତୁ, କିମ୍ବା ତାଲିକା ପାଇଁ MENU।',
    invalidQty: 'ଦୟାକରି 1 ରୁ 99 ମଧ୍ୟରେ ଏକ ସଂଖ୍ୟା ପଠାନ୍ତୁ, କିମ୍ବା CANCEL।',
    cancelled: 'ବାତିଲ ହେଲା। ଉତ୍ପାଦ ଦେଖିବା ପାଇଁ MENU ପଠାନ୍ତୁ।',
    help: 'ଉତ୍ପାଦ ପାଇଁ MENU, କାର୍ଟ ପାଇଁ CART, ଭାଷା ବଦଳାଇବା ପାଇଁ LANG ପଠାନ୍ତୁ।',
  },
  as: {
    productsTitle: 'আমাৰ সামগ্ৰী:',
    productsHint: 'কাৰ্টত যোগ কৰিবলৈ সামগ্ৰীৰ নম্বৰ পঠিয়াওক।',
    askQty: (name: string) =>
      `"${name}" কিমানটা লাগে? এটা সংখ্যা (1-99) পঠিয়াওক, নহয় CANCEL।`,
    added: (name: string, qty: number) =>
      `${qty} x ${name} কাৰ্টত যোগ কৰা হ'ল। চাবলৈ CART, আৰু কিনিবলৈ MENU পঠিয়াওক।`,
    cartTitle: 'আপোনাৰ কাৰ্ট:',
    cartTotal: 'মুঠ',
    emptyCart: 'আপোনাৰ কাৰ্ট খালী। সামগ্ৰী চাবলৈ MENU পঠিয়াওক।',
    invalidProduct: 'অনুগ্ৰহ কৰি সঠিক সামগ্ৰীৰ নম্বৰ পঠিয়াওক, নহয় তালিকাৰ বাবে MENU।',
    invalidQty: 'অনুগ্ৰহ কৰি 1 ৰ পৰা 99 লৈ এটা সংখ্যা পঠিয়াওক, নহয় CANCEL।',
    cancelled: 'বাতিল কৰা হ\'ল। সামগ্ৰী চাবলৈ MENU পঠিয়াওক।',
    help: 'সামগ্ৰীৰ বাবে MENU, কাৰ্টৰ বাবে CART, ভাষা সলনি কৰিবলৈ LANG পঠিয়াওক।',
  },
};

export function t(language: string) {
  return TEXT[language as keyof typeof TEXT] ?? TEXT.en;
}
