// Customer messages for reporting a UPI payment (PAID) and the seller's answer
export const UPI_FLOW_TEXT = {
  en: {
    paidUsage:
      'After paying by UPI, send PAID <order number> <transaction number>, for example: PAID 8 123456789012. The transaction number is in your UPI app.',
    invalidRef:
      'That transaction number does not look right. It has 8 to 24 letters or digits (usually 12 digits). Check your UPI app and send it again.',
    notFound: (id: number) => `Order #${id} was not found. Send MYORDERS to see your orders.`,
    nothingToPay: (id: number) => `Order #${id} has no UPI payment waiting. Send MYORDERS to see its status.`,
    refUsed: 'This transaction number was already used for another order. Please check it and send again.',
    paidThanks: (id: number) =>
      `Thank you! We told the seller that you paid for order #${id}. They will check their bank app and confirm.`,
    received: (id: number) => `The seller received your payment for order #${id}. They will now prepare your order.`,
    notReceived: (id: number) =>
      `The seller has not received your payment for order #${id}. Please check your UPI app. If the money left your account, send PAID ${id} <transaction number> again.`,
    qrHint: 'Prefer a QR code? Send QR <order number>, for example: QR 8.',
  },
  hi: {
    paidUsage:
      'UPI से भुगतान के बाद PAID <ऑर्डर नंबर> <ट्रांजैक्शन नंबर> भेजें, जैसे: PAID 8 123456789012। ट्रांजैक्शन नंबर आपके UPI ऐप में मिलेगा।',
    invalidRef:
      'यह ट्रांजैक्शन नंबर सही नहीं लगता। इसमें 8 से 24 अक्षर या अंक होते हैं (आमतौर पर 12 अंक)। अपना UPI ऐप देखकर फिर से भेजें।',
    notFound: (id: number) => `ऑर्डर #${id} नहीं मिला। अपने ऑर्डर देखने के लिए MYORDERS भेजें।`,
    nothingToPay: (id: number) => `ऑर्डर #${id} का कोई UPI भुगतान बाकी नहीं है। स्थिति देखने के लिए MYORDERS भेजें।`,
    refUsed: 'यह ट्रांजैक्शन नंबर पहले ही किसी दूसरे ऑर्डर के लिए इस्तेमाल हो चुका है। कृपया जाँचकर फिर से भेजें।',
    paidThanks: (id: number) =>
      `धन्यवाद! हमने विक्रेता को बता दिया है कि आपने ऑर्डर #${id} का भुगतान किया है। वे अपने बैंक ऐप में देखकर पुष्टि करेंगे।`,
    received: (id: number) => `विक्रेता को ऑर्डर #${id} का आपका भुगतान मिल गया है। अब वे आपका ऑर्डर तैयार करेंगे।`,
    notReceived: (id: number) =>
      `विक्रेता को ऑर्डर #${id} का आपका भुगतान नहीं मिला है। कृपया अपना UPI ऐप देखें। अगर पैसे आपके खाते से कट गए हैं, तो PAID ${id} <ट्रांजैक्शन नंबर> फिर से भेजें।`,
    qrHint: 'QR कोड चाहिए? QR <ऑर्डर नंबर> भेजें, जैसे: QR 8।',
  },
  or: {
    paidUsage:
      'UPI ରେ ପଇସା ଦେବା ପରେ PAID <ଅର୍ଡର ନମ୍ବର> ପଠାନ୍ତୁ, କିମ୍ବା "ମୁଁ ପଇସା ଦେଲି" ଟ୍ୟାପ୍ କରନ୍ତୁ। ଉଦାହରଣ: PAID 8',
    invalidRef:
      'ଏହି ଟ୍ରାନଜାକସନ ନମ୍ବର ଠିକ୍ ଲାଗୁନାହିଁ। ଏଥିରେ 8 ରୁ 24 ଅକ୍ଷର ବା ଅଙ୍କ ଥାଏ (ସାଧାରଣତଃ 12 ଅଙ୍କ)। ଆପଣଙ୍କ UPI ଆପ ଦେଖି ପୁଣି ପଠାନ୍ତୁ।',
    notFound: (id: number) => `ଅର୍ଡର #${id} ମିଳିଲା ନାହିଁ। ଆପଣଙ୍କ ଅର୍ଡର ଦେଖିବା ପାଇଁ MYORDERS ପଠାନ୍ତୁ।`,
    nothingToPay: (id: number) => `ଅର୍ଡର #${id} ପାଇଁ କୌଣସି UPI ପେମେଣ୍ଟ ବାକି ନାହିଁ। ସ୍ଥିତି ଦେଖିବା ପାଇଁ MYORDERS ପଠାନ୍ତୁ।`,
    refUsed: 'ଏହି ଟ୍ରାନଜାକସନ ନମ୍ବର ପୂର୍ବରୁ ଅନ୍ୟ ଅର୍ଡର ପାଇଁ ବ୍ୟବହାର ହୋଇଛି। ଦୟାକରି ଯାଞ୍ଚ କରି ପୁଣି ପଠାନ୍ତୁ।',
    paidThanks: (id: number) =>
      `ଧନ୍ୟବାଦ! ଆପଣ ଅର୍ଡର #${id} ପାଇଁ ପଇସା ଦେଇଛନ୍ତି ବୋଲି ବିକ୍ରେତାଙ୍କୁ ଜଣାଇଦେଲୁ। ସେମାନେ ବ୍ୟାଙ୍କ ଆପ ଦେଖି ନିଶ୍ଚିତ କରିବେ।`,
    received: (id: number) => `ଅର୍ଡର #${id} ପାଇଁ ଆପଣଙ୍କ ପଇସା ବିକ୍ରେତାଙ୍କ ପାଖରେ ପହଞ୍ଚିଗଲା। ସେମାନେ ଏବେ ଆପଣଙ୍କ ଅର୍ଡର ପ୍ରସ୍ତୁତ କରିବେ।`,
    notReceived: (id: number) =>
      `ଅର୍ଡର #${id} ପାଇଁ ଆପଣଙ୍କ ପଇସା ବିକ୍ରେତାଙ୍କ ପାଖରେ ପହଞ୍ଚିନାହିଁ। ଦୟାକରି ଆପଣଙ୍କ UPI ଆପ ଦେଖନ୍ତୁ। ପଇସା ଆପଣଙ୍କ ଖାତାରୁ କଟିଥିଲେ, ପୁଣି "ମୁଁ ପଇସା ଦେଲି" ଟ୍ୟାପ୍ କରନ୍ତୁ।`,
    qrHint: 'QR କୋଡ୍ ଦରକାର? QR <ଅର୍ଡର ନମ୍ବର> ପଠାନ୍ତୁ, ଉଦାହରଣ: QR 8।',
  },
  as: {
    paidUsage:
      'UPI ৰে ধন দিয়াৰ পিছত PAID <অৰ্ডাৰ নম্বৰ> পঠিয়াওক, নহয় "মই ধন দিলোঁ" টিপক। উদাহৰণ: PAID 8',
    invalidRef:
      'এই লেনদেন নম্বৰটো শুদ্ধ যেন লগা নাই। ইয়াত 8 ৰ পৰা 24 টা আখৰ বা অংক থাকে (সাধাৰণতে 12 টা অংক)। আপোনাৰ UPI এপ চাই আকৌ পঠিয়াওক।',
    notFound: (id: number) => `অৰ্ডাৰ #${id} পোৱা নগ'ল। আপোনাৰ অৰ্ডাৰ চাবলৈ MYORDERS পঠিয়াওক।`,
    nothingToPay: (id: number) => `অৰ্ডাৰ #${id} ৰ বাবে কোনো UPI পৰিশোধ বাকী নাই। অৱস্থা চাবলৈ MYORDERS পঠিয়াওক।`,
    refUsed: 'এই লেনদেন নম্বৰটো ইতিমধ্যে আন এটা অৰ্ডাৰৰ বাবে ব্যৱহাৰ হৈছে। অনুগ্ৰহ কৰি পৰীক্ষা কৰি আকৌ পঠিয়াওক।',
    paidThanks: (id: number) =>
      `ধন্যবাদ! আপুনি অৰ্ডাৰ #${id} ৰ ধন দিছে বুলি বিক্ৰেতাক জনালোঁ। তেওঁ বেংক এপ চাই নিশ্চিত কৰিব।`,
    received: (id: number) => `অৰ্ডাৰ #${id} ৰ বাবে আপোনাৰ ধন বিক্ৰেতাই পালে। তেওঁ এতিয়া আপোনাৰ অৰ্ডাৰ সাজু কৰিব।`,
    notReceived: (id: number) =>
      `অৰ্ডাৰ #${id} ৰ বাবে আপোনাৰ ধন বিক্ৰেতাই পোৱা নাই। অনুগ্ৰহ কৰি আপোনাৰ UPI এপ চাওক। ধন আপোনাৰ একাউণ্টৰ পৰা কাটিলে, আকৌ "মই ধন দিলোঁ" টিপক।`,
    qrHint: 'QR ক\'ড লাগে? QR <অৰ্ডাৰ নম্বৰ> পঠিয়াওক, উদাহৰণ: QR 8।',
  },
};

export function uf(language: string) {
  return UPI_FLOW_TEXT[language as keyof typeof UPI_FLOW_TEXT] ?? UPI_FLOW_TEXT.en;
}
