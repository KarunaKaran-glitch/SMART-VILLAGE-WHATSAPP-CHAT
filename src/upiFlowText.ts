// Customer messages for reporting a UPI payment (PAID) and the seller's answer
export const UPI_FLOW_TEXT = {
  en: {
    paidUsage: 'To report a payment, send MYORDERS, choose your order and open its payment page. There you upload the payment screenshot.',
    invalidRef:
      'That transaction number does not look right. It has 8 to 24 letters or digits (usually 12 digits). Check your UPI app and send it again.',
    notFound: (id: number) => `Order #${id} was not found. Send MYORDERS to see your orders.`,
    nothingToPay: (id: number) => `Order #${id} has no UPI payment waiting. Send MYORDERS to see its status.`,
    refUsed: 'This transaction number was already used for another order. Please check it and send again.',
    paidThanks: (id: number) =>
      `Thank you! We told the seller that you paid for order #${id}. They will check their bank app and confirm.`,
    received: (id: number) => `The seller received your payment for order #${id}. They will now prepare your order.`,
    sentToAdmin: 'Your payment screenshot has gone to the Smart Village admin, who will check it.',
    disputePaid: (id: number) => `The Smart Village admin checked your payment for order #${id} and accepted it. The seller will now prepare your order.`,
    disputeNotPaid: (id: number) => `The Smart Village admin checked your payment for order #${id} and could not confirm it. If you have not paid, please pay again. If money left your account, please contact your bank.`,
    notReceived: (id: number) =>
      `The seller has not received your payment for order #${id}. Please check your UPI app. If the money left your account, tap Pay again and upload your payment screenshot.`,
    qrHint: 'Prefer a QR code? Send QR <order number>, for example: QR 8.',
    payAgainBtn: 'Pay again',
    openPayPage: 'Open payment page',
    payOnPage: (id: number) => `To report your payment for order #${id}, open the payment page, upload your payment screenshot and tap I have paid.`,
  },
  hi: {
    paidUsage: 'भुगतान बताने के लिए MYORDERS भेजें, अपना ऑर्डर चुनें और उसका भुगतान पेज खोलें। वहाँ भुगतान का स्क्रीनशॉट अपलोड करें।',
    invalidRef:
      'यह ट्रांजैक्शन नंबर सही नहीं लगता। इसमें 8 से 24 अक्षर या अंक होते हैं (आमतौर पर 12 अंक)। अपना UPI ऐप देखकर फिर से भेजें।',
    notFound: (id: number) => `ऑर्डर #${id} नहीं मिला। अपने ऑर्डर देखने के लिए MYORDERS भेजें।`,
    nothingToPay: (id: number) => `ऑर्डर #${id} का कोई UPI भुगतान बाकी नहीं है। स्थिति देखने के लिए MYORDERS भेजें।`,
    refUsed: 'यह ट्रांजैक्शन नंबर पहले ही किसी दूसरे ऑर्डर के लिए इस्तेमाल हो चुका है। कृपया जाँचकर फिर से भेजें।',
    paidThanks: (id: number) =>
      `धन्यवाद! हमने विक्रेता को बता दिया है कि आपने ऑर्डर #${id} का भुगतान किया है। वे अपने बैंक ऐप में देखकर पुष्टि करेंगे।`,
    received: (id: number) => `विक्रेता को ऑर्डर #${id} का आपका भुगतान मिल गया है। अब वे आपका ऑर्डर तैयार करेंगे।`,
    sentToAdmin: 'आपके भुगतान का स्क्रीनशॉट Smart Village एडमिन को भेज दिया गया है, वे इसकी जाँच करेंगे।',
    disputePaid: (id: number) => `Smart Village एडमिन ने ऑर्डर #${id} के आपके भुगतान की जाँच करके उसे स्वीकार किया। विक्रेता अब आपका ऑर्डर तैयार करेगा।`,
    disputeNotPaid: (id: number) => `Smart Village एडमिन ने ऑर्डर #${id} के आपके भुगतान की जाँच की, पर उसकी पुष्टि नहीं हो सकी। अगर आपने भुगतान नहीं किया है, तो कृपया फिर से भुगतान करें। अगर आपके खाते से पैसा कट गया है, तो कृपया अपने बैंक से संपर्क करें।`,
    notReceived: (id: number) =>
      `विक्रेता को ऑर्डर #${id} का आपका भुगतान नहीं मिला है। कृपया अपना UPI ऐप देखें। अगर पैसे आपके खाते से कट गए हैं, तो "फिर से भुगतान" दबाएँ और भुगतान का स्क्रीनशॉट अपलोड करें।`,
    qrHint: 'QR कोड चाहिए? QR <ऑर्डर नंबर> भेजें, जैसे: QR 8।',
    payAgainBtn: 'फिर से भुगतान',
    openPayPage: 'भुगतान पेज खोलें',
    payOnPage: (id: number) => `ऑर्डर #${id} का भुगतान बताने के लिए भुगतान पेज खोलें, भुगतान का स्क्रीनशॉट अपलोड करें और पुष्टि करें।`,
  },
  or: {
    paidUsage: 'ପେମେଣ୍ଟ ଜଣାଇବାକୁ MYORDERS ପଠାନ୍ତୁ, ଆପଣଙ୍କ ଅର୍ଡର ବାଛନ୍ତୁ ଏବଂ ତାର ପେମେଣ୍ଟ ପେଜ୍ ଖୋଲନ୍ତୁ। ସେଠାରେ ପେମେଣ୍ଟ ସ୍କ୍ରିନସଟ୍ ଅପଲୋଡ୍ କରନ୍ତୁ।',
    invalidRef:
      'ଏହି ଟ୍ରାନଜାକସନ ନମ୍ବର ଠିକ୍ ଲାଗୁନାହିଁ। ଏଥିରେ 8 ରୁ 24 ଅକ୍ଷର ବା ଅଙ୍କ ଥାଏ (ସାଧାରଣତଃ 12 ଅଙ୍କ)। ଆପଣଙ୍କ UPI ଆପ ଦେଖି ପୁଣି ପଠାନ୍ତୁ।',
    notFound: (id: number) => `ଅର୍ଡର #${id} ମିଳିଲା ନାହିଁ। ଆପଣଙ୍କ ଅର୍ଡର ଦେଖିବା ପାଇଁ MYORDERS ପଠାନ୍ତୁ।`,
    nothingToPay: (id: number) => `ଅର୍ଡର #${id} ପାଇଁ କୌଣସି UPI ପେମେଣ୍ଟ ବାକି ନାହିଁ। ସ୍ଥିତି ଦେଖିବା ପାଇଁ MYORDERS ପଠାନ୍ତୁ।`,
    refUsed: 'ଏହି ଟ୍ରାନଜାକସନ ନମ୍ବର ପୂର୍ବରୁ ଅନ୍ୟ ଅର୍ଡର ପାଇଁ ବ୍ୟବହାର ହୋଇଛି। ଦୟାକରି ଯାଞ୍ଚ କରି ପୁଣି ପଠାନ୍ତୁ।',
    paidThanks: (id: number) =>
      `ଧନ୍ୟବାଦ! ଆପଣ ଅର୍ଡର #${id} ପାଇଁ ପଇସା ଦେଇଛନ୍ତି ବୋଲି ବିକ୍ରେତାଙ୍କୁ ଜଣାଇଦେଲୁ। ସେମାନେ ବ୍ୟାଙ୍କ ଆପ ଦେଖି ନିଶ୍ଚିତ କରିବେ।`,
    received: (id: number) => `ଅର୍ଡର #${id} ପାଇଁ ଆପଣଙ୍କ ପଇସା ବିକ୍ରେତାଙ୍କ ପାଖରେ ପହଞ୍ଚିଗଲା। ସେମାନେ ଏବେ ଆପଣଙ୍କ ଅର୍ଡର ପ୍ରସ୍ତୁତ କରିବେ।`,
    sentToAdmin: 'ଆପଣଙ୍କ ପେମେଣ୍ଟ ସ୍କ୍ରିନସଟ୍ Smart Village ଆଡମିନଙ୍କ ପାଖକୁ ଯାଇଛି, ସେ ଏହାକୁ ଯାଞ୍ଚ କରିବେ।',
    disputePaid: (id: number) => `Smart Village ଆଡମିନ ଅର୍ଡର #${id} ପାଇଁ ଆପଣଙ୍କ ପେମେଣ୍ଟ ଯାଞ୍ଚ କରି ସ୍ୱୀକାର କରିଛନ୍ତି। ବିକ୍ରେତା ଏବେ ଆପଣଙ୍କ ଅର୍ଡର ପ୍ରସ୍ତୁତ କରିବେ।`,
    disputeNotPaid: (id: number) => `Smart Village ଆଡମିନ ଅର୍ଡର #${id} ପାଇଁ ଆପଣଙ୍କ ପେମେଣ୍ଟ ଯାଞ୍ଚ କଲେ, କିନ୍ତୁ ନିଶ୍ଚିତ କରିପାରିଲେ ନାହିଁ। ଯଦି ଆପଣ ପଇସା ଦେଇନାହାନ୍ତି, ଦୟାକରି ପୁଣି ଦିଅନ୍ତୁ। ଯଦି ଆପଣଙ୍କ ଖାତାରୁ ପଇସା କଟିଛି, ଦୟାକରି ନିଜ ବ୍ୟାଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।`,
    notReceived: (id: number) =>
      `ବିକ୍ରେତା ଅର୍ଡର #${id} ପାଇଁ ଆପଣଙ୍କ ପେମେଣ୍ଟ ପାଇନାହାଁନ୍ତି। ଦୟାକରି ଆପଣଙ୍କ UPI ଆପ୍ ଦେଖନ୍ତୁ। ଯଦି ଆପଣଙ୍କ ଆକାଉଣ୍ଟରୁ ଟଙ୍କା କଟିଛି, "ପୁଣି ପେମେଣ୍ଟ" ଦବାନ୍ତୁ ଏବଂ ପେମେଣ୍ଟ ସ୍କ୍ରିନସଟ୍ ଅପଲୋଡ୍ କରନ୍ତୁ।`,
    qrHint: 'QR କୋଡ୍ ଦରକାର? QR <ଅର୍ଡର ନମ୍ବର> ପଠାନ୍ତୁ, ଉଦାହରଣ: QR 8।',
    payAgainBtn: 'ପୁଣି ପେମେଣ୍ଟ',
    openPayPage: 'ପେମେଣ୍ଟ ପେଜ୍ ଖୋଲନ୍ତୁ',
    payOnPage: (id: number) => `ଅର୍ଡର #${id} ର ପେମେଣ୍ଟ ଜଣାଇବାକୁ ପେମେଣ୍ଟ ପେଜ୍ ଖୋଲନ୍ତୁ, ପେମେଣ୍ଟ ସ୍କ୍ରିନସଟ୍ ଅପଲୋଡ୍ କରି ନିଶ୍ଚିତ କରନ୍ତୁ।`,
  },
  as: {
    paidUsage: 'পেমেণ্ট জনাবলৈ MYORDERS পঠিয়াওক, আপোনাৰ অৰ্ডাৰ বাছক আৰু ইয়াৰ পেমেণ্ট পেজ খোলক। তাত পেমেণ্টৰ স্ক্ৰীণশ্বট আপল’ড কৰক।',
    invalidRef:
      'এই লেনদেন নম্বৰটো শুদ্ধ যেন লগা নাই। ইয়াত 8 ৰ পৰা 24 টা আখৰ বা অংক থাকে (সাধাৰণতে 12 টা অংক)। আপোনাৰ UPI এপ চাই আকৌ পঠিয়াওক।',
    notFound: (id: number) => `অৰ্ডাৰ #${id} পোৱা নগ'ল। আপোনাৰ অৰ্ডাৰ চাবলৈ MYORDERS পঠিয়াওক।`,
    nothingToPay: (id: number) => `অৰ্ডাৰ #${id} ৰ বাবে কোনো UPI পৰিশোধ বাকী নাই। অৱস্থা চাবলৈ MYORDERS পঠিয়াওক।`,
    refUsed: 'এই লেনদেন নম্বৰটো ইতিমধ্যে আন এটা অৰ্ডাৰৰ বাবে ব্যৱহাৰ হৈছে। অনুগ্ৰহ কৰি পৰীক্ষা কৰি আকৌ পঠিয়াওক।',
    paidThanks: (id: number) =>
      `ধন্যবাদ! আপুনি অৰ্ডাৰ #${id} ৰ ধন দিছে বুলি বিক্ৰেতাক জনালোঁ। তেওঁ বেংক এপ চাই নিশ্চিত কৰিব।`,
    received: (id: number) => `অৰ্ডাৰ #${id} ৰ বাবে আপোনাৰ ধন বিক্ৰেতাই পালে। তেওঁ এতিয়া আপোনাৰ অৰ্ডাৰ সাজু কৰিব।`,
    sentToAdmin: 'আপোনাৰ পেমেণ্টৰ স্ক্ৰীণশ্বট Smart Village এডমিনলৈ গৈছে, তেওঁ ইয়াক পৰীক্ষা কৰিব।',
    disputePaid: (id: number) => `Smart Village এডমিনে অৰ্ডাৰ #${id} ৰ আপোনাৰ পেমেণ্ট পৰীক্ষা কৰি গ্ৰহণ কৰিছে। বিক্ৰেতাই এতিয়া আপোনাৰ অৰ্ডাৰ সাজু কৰিব।`,
    disputeNotPaid: (id: number) => `Smart Village এডমিনে অৰ্ডাৰ #${id} ৰ আপোনাৰ পেমেণ্ট পৰীক্ষা কৰিলে, কিন্তু নিশ্চিত কৰিব নোৱাৰিলে। যদি আপুনি ধন দিয়া নাই, অনুগ্ৰহ কৰি পুনৰ দিয়ক। যদি আপোনাৰ একাউণ্টৰ পৰা ধন কাটিছে, অনুগ্ৰহ কৰি আপোনাৰ বেংকৰ সৈতে যোগাযোগ কৰক।`,
    notReceived: (id: number) =>
      `বিক্ৰেতাই অৰ্ডাৰ #${id} ৰ আপোনাৰ পেমেণ্ট পোৱা নাই। অনুগ্ৰহ কৰি আপোনাৰ UPI এপ চাওক। যদি আপোনাৰ একাউণ্টৰ পৰা ধন কাটিছে, "পুনৰ পেমেণ্ট" টিপক আৰু পেমেণ্টৰ স্ক্ৰীণশ্বট আপল’ড কৰক।`,
    qrHint: 'QR ক\'ড লাগে? QR <অৰ্ডাৰ নম্বৰ> পঠিয়াওক, উদাহৰণ: QR 8।',
    payAgainBtn: 'পুনৰ পেমেণ্ট',
    openPayPage: 'পেমেণ্ট পেজ খোলক',
    payOnPage: (id: number) => `অৰ্ডাৰ #${id} ৰ পেমেণ্ট জনাবলৈ পেমেণ্ট পেজ খোলক, পেমেণ্টৰ স্ক্ৰীণশ্বট আপল’ড কৰি নিশ্চিত কৰক।`,
  },
};

export function uf(language: string) {
  return UPI_FLOW_TEXT[language as keyof typeof UPI_FLOW_TEXT] ?? UPI_FLOW_TEXT.en;
}
