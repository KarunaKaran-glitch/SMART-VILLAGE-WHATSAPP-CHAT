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
  ta: {
    header: 'உங்கள் ஆர்டர் பதிவு செய்யப்பட்டது. ஒவ்வொரு விற்பனையாளருக்கும் UPI மூலம் பணம் செலுத்தவும்:',
    block: (id: number, shop: string, total: number, upi: string) =>
      `ஆர்டர் #${id} - ${shop}\nதொகை: ₹${total}\nUPI ID: ${upi}\nபணம் செலுத்தும் குறிப்பில் "Order ${id}" என்று எழுதவும்.`,
    footer:
      'பணம் செலுத்திய பிறகு PAID <ஆர்டர் எண்> <பரிவர்த்தனை எண்> என்று அனுப்பவும், எடுத்துக்காட்டு: PAID 8 123456789012. பணம் வந்ததை உறுதி செய்த பிறகு விற்பனையாளர் அனுப்புவார்.',
    noUpi: (shop: string) =>
      `"${shop}" விற்பனையாளர் இன்னும் பணம் பெறும் வசதியை அமைக்கவில்லை, எனவே இந்த ஆர்டரை பதிவு செய்ய முடியாது. CART என்று அனுப்பி அவர்களின் பொருட்களை REMOVE செய்யவும், அல்லது பின்னர் முயற்சிக்கவும்.`,
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
  te: {
    header: 'మీ ఆర్డర్(లు) నమోదు అయ్యాయి. దయచేసి ప్రతి విక్రేతకు UPI ద్వారా చెల్లించండి:',
    block: (id: number, shop: string, total: number, upi: string) =>
      `ఆర్డర్ #${id} - ${shop}\nమొత్తం: ₹${total}\nUPI ID: ${upi}\nచెల్లింపు నోట్‌లో "Order ${id}" అని రాయండి.`,
    footer:
      'చెల్లించిన తర్వాత PAID <ఆర్డర్ నంబర్> <లావాదేవీ నంబర్> పంపండి, ఉదాహరణ: PAID 8 123456789012. డబ్బు అందినట్లు ధృవీకరించిన తర్వాత విక్రేత పంపుతారు.',
    noUpi: (shop: string) =>
      `విక్రేత "${shop}" ఇంకా చెల్లింపు సెటప్ చేయలేదు, కాబట్టి ఈ ఆర్డర్ నమోదు చేయలేము. CART పంపి వారి వస్తువులను REMOVE చేయండి, లేదా తర్వాత ప్రయత్నించండి.`,
  },
  ml: {
    header: 'നിങ്ങളുടെ ഓർഡർ(കൾ) രേഖപ്പെടുത്തി. ദയവായി ഓരോ വിൽപ്പനക്കാരനും UPI വഴി പണമടയ്ക്കുക:',
    block: (id: number, shop: string, total: number, upi: string) =>
      `ഓർഡർ #${id} - ${shop}\nതുക: ₹${total}\nUPI ID: ${upi}\nപേയ്‌മെന്റ് നോട്ടിൽ "Order ${id}" എന്ന് എഴുതുക.`,
    footer:
      'പണമടച്ചശേഷം PAID <ഓർഡർ നമ്പർ> <ഇടപാട് നമ്പർ> അയയ്ക്കുക, ഉദാഹരണം: PAID 8 123456789012. പണം ലഭിച്ചതായി സ്ഥിരീകരിച്ച ശേഷം വിൽപ്പനക്കാരൻ അയയ്ക്കും.',
    noUpi: (shop: string) =>
      `വിൽപ്പനക്കാരൻ "${shop}" ഇതുവരെ പേയ്‌മെന്റ് സജ്ജമാക്കിയിട്ടില്ല, അതിനാൽ ഈ ഓർഡർ രേഖപ്പെടുത്താൻ കഴിയില്ല. CART അയച്ച് അവരുടെ ഇനങ്ങൾ REMOVE ചെയ്യുക, അല്ലെങ്കിൽ പിന്നീട് ശ്രമിക്കുക.`,
  },
};

export function pay(language: string) {
  return PAY_TEXT[language as keyof typeof PAY_TEXT] ?? PAY_TEXT.en;
}