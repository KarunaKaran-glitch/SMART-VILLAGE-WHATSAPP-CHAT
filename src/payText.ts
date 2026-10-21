export const PAY_TEXT = {
  en: {
    header: 'Your order(s) are placed. Please pay each seller by UPI:',
    block: (id: number, shop: string, total: number, upi: string) =>
      `Order #${id} - ${shop}\nAmount: ₹${total}\nPay to UPI ID: ${upi}\nWrite "Order ${id}" in the payment note.`,
    footer:
      'After paying, send PAID <order number> <transaction number>, for example: PAID 8 123456789012. The seller ships after confirming the money.',
    noUpi: (shop: string) =>
      `The seller "${shop}" has not set up payment yet, so this order cannot be placed. Send CART and REMOVE their items, or try again later.`,
  },
  hi: {
    header: 'आपके ऑर्डर दर्ज हो गए। कृपया हर विक्रेता को UPI से भुगतान करें:',
    block: (id: number, shop: string, total: number, upi: string) =>
      `ऑर्डर #${id} - ${shop}\nराशि: ₹${total}\nUPI ID: ${upi}\nभुगतान के नोट में "Order ${id}" लिखें।`,
    footer:
      'भुगतान के बाद PAID <ऑर्डर नंबर> <ट्रांजैक्शन नंबर> भेजें, जैसे: PAID 8 123456789012। पैसे की पुष्टि के बाद विक्रेता सामान भेजेगा।',
    noUpi: (shop: string) =>
      `विक्रेता "${shop}" ने अभी भुगतान सेटअप नहीं किया है, इसलिए यह ऑर्डर दर्ज नहीं हो सकता। CART भेजकर उनके आइटम REMOVE करें, या बाद में कोशिश करें।`,
  },
  or: {
    header: 'ଆପଣଙ୍କ ଅର୍ଡର ହୋଇଗଲା। ଦୟାକରି ପ୍ରତ୍ୟେକ ବିକ୍ରେତାଙ୍କୁ UPI ରେ ପଇସା ଦିଅନ୍ତୁ:',
    block: (id: number, shop: string, total: number, upi: string) =>
      `ଅର୍ଡର #${id} - ${shop}\nରାଶି: ₹${total}\nUPI ID: ${upi}\nପେମେଣ୍ଟ ନୋଟରେ "Order ${id}" ଲେଖନ୍ତୁ।`,
    footer:
      'ପଇସା ଦେବା ପରେ PAID <ଅର୍ଡର ନମ୍ବର> ପଠାନ୍ତୁ, ଉଦାହରଣ: PAID 8। ପଇସା ମିଳିବା ନିଶ୍ଚିତ ହେବା ପରେ ବିକ୍ରେତା ପଠାଇବେ।',
    noUpi: (shop: string) =>
      `ବିକ୍ରେତା "${shop}" ଏପର୍ଯ୍ୟନ୍ତ ପେମେଣ୍ଟ ସେଟଅପ କରିନାହାନ୍ତି, ତେଣୁ ଏହି ଅର୍ଡର ହୋଇପାରିବ ନାହିଁ। CART ପଠାଇ ତାଙ୍କ ଜିନିଷ REMOVE କରନ୍ତୁ, କିମ୍ବା ପରେ ଚେଷ୍ଟା କରନ୍ତୁ।`,
  },
  as: {
    header: 'আপোনাৰ অৰ্ডাৰ দিয়া হ\'ল। অনুগ্ৰহ কৰি প্ৰতিজন বিক্ৰেতাক UPI ৰে ধন দিয়ক:',
    block: (id: number, shop: string, total: number, upi: string) =>
      `অৰ্ডাৰ #${id} - ${shop}\nপৰিমাণ: ₹${total}\nUPI ID: ${upi}\nপৰিশোধৰ টোকাত "Order ${id}" লিখক।`,
    footer:
      'ধন দিয়াৰ পিছত PAID <অৰ্ডাৰ নম্বৰ> পঠিয়াওক, উদাহৰণ: PAID 8। ধন পোৱা নিশ্চিত হোৱাৰ পিছত বিক্ৰেতাই পঠিয়াব।',
    noUpi: (shop: string) =>
      `বিক্ৰেতা "${shop}" এ এতিয়াও পৰিশোধৰ ব্যৱস্থা কৰা নাই, সেয়েহে এই অৰ্ডাৰ দিব নোৱাৰি। CART পঠিয়াই তেওঁৰ সামগ্ৰী REMOVE কৰক, নহয় পিছত চেষ্টা কৰক।`,
  },
};

export function pay(language: string) {
  return PAY_TEXT[language as keyof typeof PAY_TEXT] ?? PAY_TEXT.en;
}
