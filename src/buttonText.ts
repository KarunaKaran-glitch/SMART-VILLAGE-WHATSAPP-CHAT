import { byLang } from './lang';

// Texts for tap buttons and lists (WhatsApp limits: button 20 characters, list row 24)
export const BUTTON_TEXT = {
  en: {
    products: 'Products',
    cart: 'Cart',
    menu: 'Menu',
    myOrders: 'My orders',
    language: 'Language',
    address: 'Delivery address',
    sell: 'Sell your products',
    sellerMenu: 'Seller menu',
    adminMenu: 'Admin menu',
    cancel: 'Cancel',
    showQr: 'Show QR code',
    paid: 'I have paid',
    cancelOrder: 'Cancel order',
    noSuchShop: (code: string) =>
      `Sorry, there is no shop with the code ${code}. Please check the number with your seller and try again (for example: Hi 1234).`,
    noShop:
      'Welcome! 😀\nTo shop, open the shop link your seller sent you, or send "Hi" and the shop code (for example: Hi KARNA).',
    shopNow: 'Shop now 🛍️',
    moreOptions: 'More options',
    clickHere: 'Click here',
    shopWelcome: (shop: string) =>
      `😀 Hello!\n\nWelcome to ${shop} 🛍️\nHandmade products, straight from the maker.\n\nPlease choose one of the options below 👇`,
    clickBelow: (shop: string) => `Click on the below link to select ${shop} products 👇`,
    whatNext: 'What would you like to do?',
    payTapHint: 'Pay in your UPI app, then tap "I have paid". Prefer scanning? Tap "Show QR code".',
    qrSellerBody: (id: number, shop: string, total: number) =>
      `Scan to pay ${shop}. Enter the amount ₹${total} and write "Order ${id}" in the note. Then tap "I have paid".`,
    qrAutoBody: (id: number, shop: string, total: number) =>
      `Scan to pay ₹${total} to ${shop}. The amount and the note "Order ${id}" are already filled in. Then tap "I have paid".`,
    ordersBody: 'Your latest orders. Tap "Choose" to see one.',
    noProducts: 'No products are available right now. Please check again later.',
    categoriesButton: 'Categories',
    itemCount: (n: number) => `${n} products`,
  },
  hi: {
    products: 'उत्पाद',
    cart: 'कार्ट',
    menu: 'मेनू',
    myOrders: 'मेरे ऑर्डर',
    language: 'भाषा',
    address: 'डिलीवरी पता',
    sell: 'अपना सामान बेचें',
    sellerMenu: 'विक्रेता मेनू',
    adminMenu: 'एडमिन मेनू',
    cancel: 'रद्द करें',
    showQr: 'QR दिखाएँ',
    paid: 'मैंने भुगतान किया',
    cancelOrder: 'ऑर्डर रद्द करें',
    noSuchShop: (code: string) =>
      `माफ़ करें, ${code} कोड की कोई दुकान नहीं है। अपने विक्रेता से नंबर जाँचकर फिर कोशिश करें (जैसे: Hi 1234)।`,
    noShop:
      'स्वागत है! 😀\nखरीदारी के लिए अपने विक्रेता का भेजा हुआ दुकान लिंक खोलें, या "Hi" और दुकान कोड भेजें (जैसे: Hi KARNA)।',
    shopNow: 'अभी खरीदें 🛍️',
    moreOptions: 'और विकल्प',
    clickHere: 'यहाँ क्लिक करें',
    shopWelcome: (shop: string) =>
      `😀 नमस्ते!\n\n${shop} में आपका स्वागत है 🛍️\nहाथ से बने उत्पाद, सीधे बनाने वाले से।\n\nकृपया नीचे दिए विकल्पों में से एक चुनें 👇`,
    clickBelow: (shop: string) => `${shop} के उत्पाद चुनने के लिए नीचे दिए लिंक पर क्लिक करें 👇`,
    whatNext: 'आप क्या करना चाहेंगे?',
    payTapHint:
      'अपने UPI ऐप में भुगतान करें, फिर "मैंने भुगतान किया" पर टैप करें। स्कैन करना है? "QR दिखाएँ" पर टैप करें।',
    qrSellerBody: (id: number, shop: string, total: number) =>
      `${shop} को भुगतान के लिए स्कैन करें। राशि ₹${total} डालें और नोट में "Order ${id}" लिखें। फिर "मैंने भुगतान किया" पर टैप करें।`,
    qrAutoBody: (id: number, shop: string, total: number) =>
      `${shop} को ₹${total} भुगतान के लिए स्कैन करें। राशि और नोट "Order ${id}" पहले से भरे हैं। फिर "मैंने भुगतान किया" पर टैप करें।`,
    ordersBody: 'आपके हाल के ऑर्डर। देखने के लिए "चुनें" पर टैप करें।',
    noProducts: 'अभी कोई उत्पाद उपलब्ध नहीं है। कृपया बाद में फिर देखें।',
    categoriesButton: 'श्रेणियाँ',
    itemCount: (n: number) => `${n} उत्पाद`,
  },
  or: {
    products: 'ଉତ୍ପାଦ',
    cart: 'କାର୍ଟ',
    menu: 'ମେନୁ',
    myOrders: 'ମୋ ଅର୍ଡର',
    language: 'ଭାଷା',
    address: 'ଡେଲିଭରି ଠିକଣା',
    sell: 'ଆପଣଙ୍କ ଜିନିଷ ବିକନ୍ତୁ',
    sellerMenu: 'ବିକ୍ରେତା ମେନୁ',
    adminMenu: 'ଆଡମିନ ମେନୁ',
    cancel: 'ବାତିଲ କରନ୍ତୁ',
    showQr: 'QR ଦେଖାନ୍ତୁ',
    paid: 'ମୁଁ ପଇସା ଦେଲି',
    cancelOrder: 'ଅର୍ଡର ବାତିଲ',
    noSuchShop: (code: string) =>
      `ଦୁଃଖିତ, ${code} କୋଡ୍‌ର କୌଣସି ଦୋକାନ ନାହିଁ। ଆପଣଙ୍କ ବିକ୍ରେତାଙ୍କ ସହ ନମ୍ବର ମିଳାଇ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ (ଯେପରି: Hi 1234)।`,
    noShop:
      'ସ୍ୱାଗତ! 😀\nକିଣିବା ପାଇଁ ଆପଣଙ୍କ ବିକ୍ରେତା ପଠାଇଥିବା ଦୋକାନ ଲିଙ୍କ ଖୋଲନ୍ତୁ, କିମ୍ବା "Hi" ଓ ଦୋକାନ କୋଡ୍ ପଠାନ୍ତୁ (ଯେପରି: Hi KARNA)।',
    shopNow: 'ବର୍ତ୍ତମାନ କିଣନ୍ତୁ 🛍️',
    moreOptions: 'ଆହୁରି ବିକଳ୍ପ',
    clickHere: 'ଏଠାରେ କ୍ଲିକ୍ କରନ୍ତୁ',
    shopWelcome: (shop: string) =>
      `😀 ନମସ୍କାର!\n\n${shop}କୁ ସ୍ୱାଗତ 🛍️\nହାତତିଆରି ଉତ୍ପାଦ, ସିଧାସଳଖ ତିଆରିକାରୀଙ୍କଠାରୁ।\n\nଦୟାକରି ତଳେ ଥିବା ବିକଳ୍ପ ମଧ୍ୟରୁ ଗୋଟିଏ ବାଛନ୍ତୁ 👇`,
    clickBelow: (shop: string) => `${shop}ର ଉତ୍ପାଦ ବାଛିବା ପାଇଁ ତଳ ଲିଙ୍କରେ କ୍ଲିକ୍ କରନ୍ତୁ 👇`,
    whatNext: 'ଆପଣ କ\'ଣ କରିବାକୁ ଚାହାଁନ୍ତି?',
    payTapHint:
      'ଆପଣଙ୍କ UPI ଆପରେ ପଇସା ଦିଅନ୍ତୁ, ତା\'ପରେ "ମୁଁ ପଇସା ଦେଲି" ଟ୍ୟାପ୍ କରନ୍ତୁ। ସ୍କାନ କରିବେ? "QR ଦେଖାନ୍ତୁ" ଟ୍ୟାପ୍ କରନ୍ତୁ।',
    qrSellerBody: (id: number, shop: string, total: number) =>
      `${shop} କୁ ପଇସା ଦେବା ପାଇଁ ସ୍କାନ କରନ୍ତୁ। ରାଶି ₹${total} ଦିଅନ୍ତୁ ଏବଂ ନୋଟରେ "Order ${id}" ଲେଖନ୍ତୁ। ତା\'ପରେ "ମୁଁ ପଇସା ଦେଲି" ଟ୍ୟାପ୍ କରନ୍ତୁ।`,
    qrAutoBody: (id: number, shop: string, total: number) =>
      `${shop} କୁ ₹${total} ଦେବା ପାଇଁ ସ୍କାନ କରନ୍ତୁ। ରାଶି ଏବଂ ନୋଟ "Order ${id}" ପୂର୍ବରୁ ଭରା ହୋଇଛି। ତା\'ପରେ "ମୁଁ ପଇସା ଦେଲି" ଟ୍ୟାପ୍ କରନ୍ତୁ।`,
    ordersBody: 'ଆପଣଙ୍କ ସାମ୍ପ୍ରତିକ ଅର୍ଡର। ଦେଖିବା ପାଇଁ "ବାଛନ୍ତୁ" ଟ୍ୟାପ୍ କରନ୍ତୁ।',
    noProducts: 'ଏବେ କୌଣସି ଉତ୍ପାଦ ଉପଲବ୍ଧ ନାହିଁ। ଦୟାକରି ପରେ ପୁଣି ଦେଖନ୍ତୁ।',
    categoriesButton: 'ବର୍ଗ',
    itemCount: (n: number) => `${n}ଟି ଉତ୍ପାଦ`,
  },
  as: {
    products: 'সামগ্ৰী',
    cart: 'কাৰ্ট',
    menu: 'মেনু',
    myOrders: 'মোৰ অৰ্ডাৰ',
    language: 'ভাষা',
    address: 'ডেলিভাৰী ঠিকনা',
    sell: 'আপোনাৰ সামগ্ৰী বেচক',
    sellerMenu: 'বিক্ৰেতা মেনু',
    adminMenu: 'এডমিন মেনু',
    cancel: 'বাতিল কৰক',
    showQr: 'QR দেখুৱাওক',
    paid: 'মই ধন দিলোঁ',
    cancelOrder: 'অৰ্ডাৰ বাতিল',
    noSuchShop: (code: string) =>
      `দুঃখিত, ${code} ক'ডৰ কোনো দোকান নাই। আপোনাৰ বিক্ৰেতাৰ পৰা নম্বৰটো মিলাই আকৌ চেষ্টা কৰক (যেনে: Hi 1234)।`,
    noShop:
      'স্বাগতম! 😀\nকিনিবলৈ আপোনাৰ বিক্ৰেতাই পঠোৱা দোকানৰ লিংক খোলক, নহয় "Hi" আৰু দোকানৰ ক\'ড পঠিয়াওক (যেনে: Hi KARNA)।',
    shopNow: 'এতিয়াই কিনক 🛍️',
    moreOptions: 'আৰু বিকল্প',
    clickHere: 'ইয়াত ক্লিক কৰক',
    shopWelcome: (shop: string) =>
      `😀 নমস্কাৰ!\n\n${shop}লৈ স্বাগতম 🛍️\nহাতে বনোৱা সামগ্ৰী, পোনপটীয়াকৈ নিৰ্মাতাৰ পৰা।\n\nঅনুগ্ৰহ কৰি তলৰ বিকল্পবোৰৰ এটা বাছক 👇`,
    clickBelow: (shop: string) => `${shop}ৰ সামগ্ৰী বাছিবলৈ তলৰ লিংকত ক্লিক কৰক 👇`,
    whatNext: 'আপুনি কি কৰিব বিচাৰে?',
    payTapHint:
      'আপোনাৰ UPI এপত ধন দিয়ক, তাৰ পিছত "মই ধন দিলোঁ" টিপক। স্কেন কৰিব বিচাৰে? "QR দেখুৱাওক" টিপক।',
    qrSellerBody: (id: number, shop: string, total: number) =>
      `${shop} ক ধন দিবলৈ স্কেন কৰক। ₹${total} পৰিমাণ দিয়ক আৰু টোকাত "Order ${id}" লিখক। তাৰ পিছত "মই ধন দিলোঁ" টিপক।`,
    qrAutoBody: (id: number, shop: string, total: number) =>
      `${shop} ক ₹${total} দিবলৈ স্কেন কৰক। পৰিমাণ আৰু টোকা "Order ${id}" আগতেই ভৰোৱা আছে। তাৰ পিছত "মই ধন দিলোঁ" টিপক।`,
    ordersBody: 'আপোনাৰ শেহতীয়া অৰ্ডাৰ। চাবলৈ "বাছক" টিপক।',
    noProducts: 'এতিয়া কোনো সামগ্ৰী উপলব্ধ নাই। অনুগ্ৰহ কৰি পিছত আকৌ চাওক।',
    categoriesButton: 'শ্ৰেণী',
    itemCount: (n: number) => `${n}টা সামগ্ৰী`,
  },
};

export function bt(language: string) {
  return BUTTON_TEXT[language as keyof typeof BUTTON_TEXT] ?? BUTTON_TEXT.en;
}

// Seller and admin button labels, in the language of the person who gets them (see lang.ts)
export const STAFF_BUTTONS = byLang({
  en: {
    received: 'Received',
    notReceived: 'Not received',
    confirm: 'Confirm order',
    ship: 'Mark shipped',
    deliver: 'Mark delivered',
    approve: 'Approve',
    reject: 'Reject',
  },
  hi: {
    received: 'मिल गया',
    notReceived: 'नहीं मिला',
    confirm: 'ऑर्डर पक्का करें',
    ship: 'भेज दिया',
    deliver: 'डिलीवर हो गया',
    approve: 'मंज़ूर',
    reject: 'नामंज़ूर',
  },
  or: {
    received: 'ମିଳିଲା',
    notReceived: 'ମିଳିନାହିଁ',
    confirm: 'ଅର୍ଡର ନିଶ୍ଚିତ',
    ship: 'ପଠାଗଲା',
    deliver: 'ଡେଲିଭରି ହେଲା',
    approve: 'ଅନୁମୋଦନ',
    reject: 'ପ୍ରତ୍ୟାଖ୍ୟାନ',
  },
  as: {
    received: 'পালোঁ',
    notReceived: 'পোৱা নাই',
    confirm: 'অৰ্ডাৰ নিশ্চিত',
    ship: "পঠিওৱা হ'ল",
    deliver: "ডেলিভাৰী হ'ল",
    approve: 'অনুমোদন',
    reject: 'নাকচ',
  },
});
