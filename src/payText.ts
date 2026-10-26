export const PAY_TEXT = {
  en: {
    block: (id: number, shop: string, total: number, upi: string) =>
      `Order #${id} - ${shop}\nAmount: ₹${total}\nPay to UPI ID: ${upi}\nWrite "Order ${id}" in the payment note.`,
    noUpi: (shop: string) =>
      `The seller "${shop}" has not set up payment yet, so this order cannot be placed. Please try again later.`,
  },
  hi: {
    block: (id: number, shop: string, total: number, upi: string) =>
      `ऑर्डर #${id} - ${shop}\nराशि: ₹${total}\nUPI ID: ${upi}\nभुगतान के नोट में "Order ${id}" लिखें।`,
    noUpi: (shop: string) =>
      `विक्रेता "${shop}" ने अभी भुगतान सेटअप नहीं किया है, इसलिए यह ऑर्डर दर्ज नहीं हो सकता। कृपया बाद में फिर कोशिश करें।`,
  },
  or: {
    block: (id: number, shop: string, total: number, upi: string) =>
      `ଅର୍ଡର #${id} - ${shop}\nରାଶି: ₹${total}\nUPI ID: ${upi}\nପେମେଣ୍ଟ ନୋଟରେ "Order ${id}" ଲେଖନ୍ତୁ।`,
    noUpi: (shop: string) =>
      `ବିକ୍ରେତା "${shop}" ଏପର୍ଯ୍ୟନ୍ତ ପେମେଣ୍ଟ ସେଟଅପ କରିନାହାନ୍ତି, ତେଣୁ ଏହି ଅର୍ଡର ହୋଇପାରିବ ନାହିଁ। ଦୟାକରି ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।`,
  },
  as: {
    block: (id: number, shop: string, total: number, upi: string) =>
      `অৰ্ডাৰ #${id} - ${shop}\nপৰিমাণ: ₹${total}\nUPI ID: ${upi}\nপৰিশোধৰ টোকাত "Order ${id}" লিখক।`,
    noUpi: (shop: string) =>
      `বিক্ৰেতা "${shop}" এ এতিয়াও পৰিশোধৰ ব্যৱস্থা কৰা নাই, সেয়েহে এই অৰ্ডাৰ দিব নোৱাৰি। অনুগ্ৰহ কৰি পিছত আকৌ চেষ্টা কৰক।`,
  },
};

export function pay(language: string) {
  return PAY_TEXT[language as keyof typeof PAY_TEXT] ?? PAY_TEXT.en;
}
