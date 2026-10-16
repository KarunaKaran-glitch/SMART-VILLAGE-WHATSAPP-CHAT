export const CANCEL_TEXT = {
  en: {
    notFound: (id: number) => `Order #${id} was not found in your orders. Send MYORDERS to see them.`,
    cannot: (id: number) =>
      `Order #${id} cannot be cancelled here. It is already cancelled, or the seller has started working on it.`,
    cancelled: (id: number) => `Order #${id} has been cancelled.`,
    byAdmin: (id: number) =>
      `Sorry, order #${id} was cancelled by the marketplace. You do not need to pay for it.`,
    byAdminPaid: (id: number) =>
      `Sorry, order #${id} was cancelled by the marketplace. You have already paid, so we will contact you about your refund.`,
  },
  ta: {
    notFound: (id: number) => `ஆர்டர் #${id} உங்கள் ஆர்டர்களில் இல்லை. பார்க்க MYORDERS என்று அனுப்பவும்.`,
    cannot: (id: number) =>
      `ஆர்டர் #${id} ஐ இங்கே ரத்து செய்ய முடியாது. அது ஏற்கனவே ரத்து செய்யப்பட்டது, அல்லது விற்பனையாளர் செயல்படத் தொடங்கிவிட்டார்.`,
    cancelled: (id: number) => `ஆர்டர் #${id} ரத்து செய்யப்பட்டது.`,
    byAdmin: (id: number) =>
      `மன்னிக்கவும், ஆர்டர் #${id} சந்தை நிர்வாகத்தால் ரத்து செய்யப்பட்டது. நீங்கள் இதற்கு பணம் செலுத்த வேண்டாம்.`,
    byAdminPaid: (id: number) =>
      `மன்னிக்கவும், ஆர்டர் #${id} சந்தை நிர்வாகத்தால் ரத்து செய்யப்பட்டது. நீங்கள் ஏற்கனவே பணம் செலுத்தியதால், பணத்தைத் திருப்பித் தருவது பற்றி உங்களைத் தொடர்பு கொள்வோம்.`,
  },
  hi: {
    notFound: (id: number) => `ऑर्डर #${id} आपके ऑर्डर में नहीं मिला। देखने के लिए MYORDERS भेजें।`,
    cannot: (id: number) =>
      `ऑर्डर #${id} यहाँ रद्द नहीं हो सकता। वह पहले ही रद्द हो चुका है, या विक्रेता ने उस पर काम शुरू कर दिया है।`,
    cancelled: (id: number) => `ऑर्डर #${id} रद्द कर दिया गया।`,
    byAdmin: (id: number) =>
      `क्षमा करें, ऑर्डर #${id} मार्केटप्लेस द्वारा रद्द कर दिया गया। आपको इसका भुगतान नहीं करना है।`,
    byAdminPaid: (id: number) =>
      `क्षमा करें, ऑर्डर #${id} मार्केटप्लेस द्वारा रद्द कर दिया गया। आप भुगतान कर चुके हैं, इसलिए हम रिफंड के बारे में आपसे संपर्क करेंगे।`,
  },
  te: {
    notFound: (id: number) => `ఆర్డర్ #${id} మీ ఆర్డర్లలో కనిపించలేదు. చూడటానికి MYORDERS పంపండి.`,
    cannot: (id: number) =>
      `ఆర్డర్ #${id} ను ఇక్కడ రద్దు చేయలేరు. ఇది ఇప్పటికే రద్దు అయింది, లేదా విక్రేత దానిపై పని ప్రారంభించారు.`,
    cancelled: (id: number) => `ఆర్డర్ #${id} రద్దు చేయబడింది.`,
    byAdmin: (id: number) =>
      `క్షమించండి, ఆర్డర్ #${id} మార్కెట్‌ప్లేస్ ద్వారా రద్దు చేయబడింది. మీరు దీనికి చెల్లించాల్సిన అవసరం లేదు.`,
    byAdminPaid: (id: number) =>
      `క్షమించండి, ఆర్డర్ #${id} మార్కెట్‌ప్లేస్ ద్వారా రద్దు చేయబడింది. మీరు ఇప్పటికే చెల్లించారు, కాబట్టి రీఫండ్ గురించి మిమ్మల్ని సంప్రదిస్తాము.`,
  },
  ml: {
    notFound: (id: number) => `ഓർഡർ #${id} നിങ്ങളുടെ ഓർഡറുകളിൽ കണ്ടില്ല. കാണാൻ MYORDERS അയയ്ക്കുക.`,
    cannot: (id: number) =>
      `ഓർഡർ #${id} ഇവിടെ റദ്ദാക്കാൻ കഴിയില്ല. അത് ഇതിനകം റദ്ദാക്കി, അല്ലെങ്കിൽ വിൽപ്പനക്കാരൻ അതിൽ പ്രവർത്തനം തുടങ്ങി.`,
    cancelled: (id: number) => `ഓർഡർ #${id} റദ്ദാക്കി.`,
    byAdmin: (id: number) =>
      `ക്ഷമിക്കണം, ഓർഡർ #${id} മാർക്കറ്റ്‌പ്ലേസ് റദ്ദാക്കി. നിങ്ങൾ ഇതിന് പണമടയ്ക്കേണ്ടതില്ല.`,
    byAdminPaid: (id: number) =>
      `ക്ഷമിക്കണം, ഓർഡർ #${id} മാർക്കറ്റ്‌പ്ലേസ് റദ്ദാക്കി. നിങ്ങൾ ഇതിനകം പണമടച്ചതിനാൽ, റീഫണ്ടിനെക്കുറിച്ച് ഞങ്ങൾ നിങ്ങളെ ബന്ധപ്പെടും.`,
  },
};

export function cn(language: string) {
  return CANCEL_TEXT[language as keyof typeof CANCEL_TEXT] ?? CANCEL_TEXT.en;
}

// Message to the seller (English for now)
export function sellerCancelNotice(orderId: number): string {
  return `Order #${orderId} was cancelled by the customer. Please do not prepare it.`;
}

export function sellerAdminCancelNotice(orderId: number, paid: boolean): string {
  return (
    `Order #${orderId} was cancelled by the marketplace admin. Please do not prepare or ship it.` +
    (paid ? ' The customer already paid you by UPI; the admin will contact you about the refund.' : '')
  );
}