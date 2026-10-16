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
    qrSellerCaption: (id: number, shop: string, total: number) =>
      `Scan to pay ${shop}. Enter the amount ₹${total} and write "Order ${id}" in the note. After paying, send PAID ${id} <transaction number>.`,
    qrAutoCaption: (id: number, shop: string, total: number) =>
      `Scan to pay ₹${total} to ${shop}. The amount and the note "Order ${id}" are already filled in. After paying, send PAID ${id} <transaction number>.`,
  },
  ta: {
    paidUsage:
      'UPI மூலம் பணம் செலுத்திய பிறகு PAID <ஆர்டர் எண்> <பரிவர்த்தனை எண்> என்று அனுப்பவும், எடுத்துக்காட்டு: PAID 8 123456789012. பரிவர்த்தனை எண் உங்கள் UPI செயலியில் இருக்கும்.',
    invalidRef:
      'இந்த பரிவர்த்தனை எண் சரியாக இல்லை. அதில் 8 முதல் 24 எழுத்துகள் அல்லது எண்கள் இருக்கும் (பொதுவாக 12 எண்கள்). உங்கள் UPI செயலியைச் சரிபார்த்து மீண்டும் அனுப்பவும்.',
    notFound: (id: number) => `ஆர்டர் #${id} கிடைக்கவில்லை. உங்கள் ஆர்டர்களைப் பார்க்க MYORDERS அனுப்பவும்.`,
    nothingToPay: (id: number) =>
      `ஆர்டர் #${id} க்கு செலுத்த வேண்டிய UPI பணம் இல்லை. நிலையைப் பார்க்க MYORDERS அனுப்பவும்.`,
    refUsed: 'இந்த பரிவர்த்தனை எண் ஏற்கனவே வேறு ஆர்டருக்கு பயன்படுத்தப்பட்டது. சரிபார்த்து மீண்டும் அனுப்பவும்.',
    paidThanks: (id: number) =>
      `நன்றி! ஆர்டர் #${id} க்கு நீங்கள் பணம் செலுத்தியதை விற்பனையாளருக்குத் தெரிவித்தோம். அவர் வங்கி செயலியில் சரிபார்த்து உறுதி செய்வார்.`,
    received: (id: number) =>
      `ஆர்டர் #${id} க்கான உங்கள் பணம் விற்பனையாளருக்குக் கிடைத்தது. அவர் இப்போது உங்கள் ஆர்டரைத் தயார் செய்வார்.`,
    notReceived: (id: number) =>
      `ஆர்டர் #${id} க்கான உங்கள் பணம் விற்பனையாளருக்கு இன்னும் வரவில்லை. உங்கள் UPI செயலியைச் சரிபார்க்கவும். பணம் உங்கள் கணக்கிலிருந்து சென்றிருந்தால், PAID ${id} <பரிவர்த்தனை எண்> மீண்டும் அனுப்பவும்.`,
    qrHint: 'QR குறியீடு வேண்டுமா? QR <ஆர்டர் எண்> என்று அனுப்பவும், எடுத்துக்காட்டு: QR 8.',
    qrSellerCaption: (id: number, shop: string, total: number) =>
      `${shop} க்கு பணம் செலுத்த ஸ்கேன் செய்யவும். தொகை ₹${total} ஐ உள்ளிட்டு, குறிப்பில் "Order ${id}" என்று எழுதவும். பணம் செலுத்திய பிறகு PAID ${id} <பரிவர்த்தனை எண்> அனுப்பவும்.`,
    qrAutoCaption: (id: number, shop: string, total: number) =>
      `${shop} க்கு ₹${total} செலுத்த ஸ்கேன் செய்யவும். தொகையும் "Order ${id}" குறிப்பும் ஏற்கனவே நிரப்பப்பட்டுள்ளன. பணம் செலுத்திய பிறகு PAID ${id} <பரிவர்த்தனை எண்> அனுப்பவும்.`,
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
    qrSellerCaption: (id: number, shop: string, total: number) =>
      `${shop} को भुगतान के लिए स्कैन करें। राशि ₹${total} डालें और नोट में "Order ${id}" लिखें। भुगतान के बाद PAID ${id} <ट्रांजैक्शन नंबर> भेजें।`,
    qrAutoCaption: (id: number, shop: string, total: number) =>
      `${shop} को ₹${total} भुगतान के लिए स्कैन करें। राशि और नोट "Order ${id}" पहले से भरे हैं। भुगतान के बाद PAID ${id} <ट्रांजैक्शन नंबर> भेजें।`,
  },
  te: {
    paidUsage:
      'UPI ద్వారా చెల్లించిన తర్వాత PAID <ఆర్డర్ నంబర్> <లావాదేవీ నంబర్> పంపండి, ఉదాహరణ: PAID 8 123456789012. లావాదేవీ నంబర్ మీ UPI యాప్‌లో ఉంటుంది.',
    invalidRef:
      'ఈ లావాదేవీ నంబర్ సరిగ్గా లేదు. ఇందులో 8 నుండి 24 అక్షరాలు లేదా అంకెలు ఉంటాయి (సాధారణంగా 12 అంకెలు). మీ UPI యాప్ చూసి మళ్ళీ పంపండి.',
    notFound: (id: number) => `ఆర్డర్ #${id} కనబడలేదు. మీ ఆర్డర్లు చూడటానికి MYORDERS పంపండి.`,
    nothingToPay: (id: number) => `ఆర్డర్ #${id} కు చెల్లించాల్సిన UPI చెల్లింపు లేదు. స్థితి చూడటానికి MYORDERS పంపండి.`,
    refUsed: 'ఈ లావాదేవీ నంబర్ ఇప్పటికే వేరే ఆర్డర్‌కు ఉపయోగించబడింది. దయచేసి సరిచూసి మళ్ళీ పంపండి.',
    paidThanks: (id: number) =>
      `ధన్యవాదాలు! ఆర్డర్ #${id} కు మీరు చెల్లించినట్లు విక్రేతకు తెలియజేశాము. వారు బ్యాంక్ యాప్‌లో చూసి ధృవీకరిస్తారు.`,
    received: (id: number) => `ఆర్డర్ #${id} కు మీ చెల్లింపు విక్రేతకు అందింది. వారు ఇప్పుడు మీ ఆర్డర్ సిద్ధం చేస్తారు.`,
    notReceived: (id: number) =>
      `ఆర్డర్ #${id} కు మీ చెల్లింపు విక్రేతకు అందలేదు. దయచేసి మీ UPI యాప్ చూడండి. డబ్బు మీ ఖాతా నుండి వెళ్ళి ఉంటే, PAID ${id} <లావాదేవీ నంబర్> మళ్ళీ పంపండి.`,
    qrHint: 'QR కోడ్ కావాలా? QR <ఆర్డర్ నంబర్> పంపండి, ఉదాహరణ: QR 8.',
    qrSellerCaption: (id: number, shop: string, total: number) =>
      `${shop} కు చెల్లించడానికి స్కాన్ చేయండి. మొత్తం ₹${total} నమోదు చేసి, నోట్‌లో "Order ${id}" అని రాయండి. చెల్లించిన తర్వాత PAID ${id} <లావాదేవీ నంబర్> పంపండి.`,
    qrAutoCaption: (id: number, shop: string, total: number) =>
      `${shop} కు ₹${total} చెల్లించడానికి స్కాన్ చేయండి. మొత్తం మరియు "Order ${id}" నోట్ ముందే నింపబడ్డాయి. చెల్లించిన తర్వాత PAID ${id} <లావాదేవీ నంబర్> పంపండి.`,
  },
  ml: {
    paidUsage:
      'UPI വഴി പണമടച്ച ശേഷം PAID <ഓർഡർ നമ്പർ> <ഇടപാട് നമ്പർ> അയയ്ക്കുക, ഉദാഹരണം: PAID 8 123456789012. ഇടപാട് നമ്പർ നിങ്ങളുടെ UPI ആപ്പിൽ കാണാം.',
    invalidRef:
      'ഈ ഇടപാട് നമ്പർ ശരിയല്ലെന്ന് തോന്നുന്നു. ഇതിൽ 8 മുതൽ 24 വരെ അക്ഷരങ്ങളോ അക്കങ്ങളോ ഉണ്ടാകും (സാധാരണ 12 അക്കങ്ങൾ). UPI ആപ്പ് പരിശോധിച്ച് വീണ്ടും അയയ്ക്കുക.',
    notFound: (id: number) => `ഓർഡർ #${id} കണ്ടെത്തിയില്ല. നിങ്ങളുടെ ഓർഡറുകൾ കാണാൻ MYORDERS അയയ്ക്കുക.`,
    nothingToPay: (id: number) =>
      `ഓർഡർ #${id} ന് അടയ്ക്കാനുള്ള UPI പേയ്‌മെന്റ് ഇല്ല. നില കാണാൻ MYORDERS അയയ്ക്കുക.`,
    refUsed: 'ഈ ഇടപാട് നമ്പർ മറ്റൊരു ഓർഡറിന് ഇതിനകം ഉപയോഗിച്ചിട്ടുണ്ട്. ദയവായി പരിശോധിച്ച് വീണ്ടും അയയ്ക്കുക.',
    paidThanks: (id: number) =>
      `നന്ദി! ഓർഡർ #${id} ന് നിങ്ങൾ പണമടച്ചതായി വിൽപ്പനക്കാരനെ അറിയിച്ചു. അവർ ബാങ്ക് ആപ്പ് പരിശോധിച്ച് സ്ഥിരീകരിക്കും.`,
    received: (id: number) =>
      `ഓർഡർ #${id} നുള്ള നിങ്ങളുടെ പണം വിൽപ്പനക്കാരന് ലഭിച്ചു. അവർ ഇപ്പോൾ നിങ്ങളുടെ ഓർഡർ തയ്യാറാക്കും.`,
    notReceived: (id: number) =>
      `ഓർഡർ #${id} നുള്ള നിങ്ങളുടെ പണം വിൽപ്പനക്കാരന് ലഭിച്ചിട്ടില്ല. ദയവായി UPI ആപ്പ് പരിശോധിക്കുക. പണം നിങ്ങളുടെ അക്കൗണ്ടിൽ നിന്ന് പോയിട്ടുണ്ടെങ്കിൽ, PAID ${id} <ഇടപാട് നമ്പർ> വീണ്ടും അയയ്ക്കുക.`,
    qrHint: 'QR കോഡ് വേണോ? QR <ഓർഡർ നമ്പർ> അയയ്ക്കുക, ഉദാഹരണം: QR 8.',
    qrSellerCaption: (id: number, shop: string, total: number) =>
      `${shop} ന് പണമടയ്ക്കാൻ സ്കാൻ ചെയ്യുക. തുക ₹${total} നൽകി, നോട്ടിൽ "Order ${id}" എന്ന് എഴുതുക. പണമടച്ച ശേഷം PAID ${id} <ഇടപാട് നമ്പർ> അയയ്ക്കുക.`,
    qrAutoCaption: (id: number, shop: string, total: number) =>
      `${shop} ന് ₹${total} അടയ്ക്കാൻ സ്കാൻ ചെയ്യുക. തുകയും "Order ${id}" നോട്ടും മുൻകൂട്ടി പൂരിപ്പിച്ചിട്ടുണ്ട്. പണമടച്ച ശേഷം PAID ${id} <ഇടപാട് നമ്പർ> അയയ്ക്കുക.`,
  },
};

export function uf(language: string) {
  return UPI_FLOW_TEXT[language as keyof typeof UPI_FLOW_TEXT] ?? UPI_FLOW_TEXT.en;
}
