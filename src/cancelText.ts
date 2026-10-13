export const CANCEL_TEXT = {
  en: {
    notFound: (id: number) => `Order #${id} was not found in your orders. Send MYORDERS to see them.`,
    cannot: (id: number) =>
      `Order #${id} cannot be cancelled here. It is already cancelled, or the seller has started working on it.`,
    cancelled: (id: number) => `Order #${id} has been cancelled.`,
  },
  ta: {
    notFound: (id: number) => `ஆர்டர் #${id} உங்கள் ஆர்டர்களில் இல்லை. பார்க்க MYORDERS என்று அனுப்பவும்.`,
    cannot: (id: number) =>
      `ஆர்டர் #${id} ஐ இங்கே ரத்து செய்ய முடியாது. அது ஏற்கனவே ரத்து செய்யப்பட்டது, அல்லது விற்பனையாளர் செயல்படத் தொடங்கிவிட்டார்.`,
    cancelled: (id: number) => `ஆர்டர் #${id} ரத்து செய்யப்பட்டது.`,
  },
  hi: {
    notFound: (id: number) => `ऑर्डर #${id} आपके ऑर्डर में नहीं मिला। देखने के लिए MYORDERS भेजें।`,
    cannot: (id: number) =>
      `ऑर्डर #${id} यहाँ रद्द नहीं हो सकता। वह पहले ही रद्द हो चुका है, या विक्रेता ने उस पर काम शुरू कर दिया है।`,
    cancelled: (id: number) => `ऑर्डर #${id} रद्द कर दिया गया।`,
  },
  te: {
    notFound: (id: number) => `ఆర్డర్ #${id} మీ ఆర్డర్లలో కనిపించలేదు. చూడటానికి MYORDERS పంపండి.`,
    cannot: (id: number) =>
      `ఆర్డర్ #${id} ను ఇక్కడ రద్దు చేయలేరు. ఇది ఇప్పటికే రద్దు అయింది, లేదా విక్రేత దానిపై పని ప్రారంభించారు.`,
    cancelled: (id: number) => `ఆర్డర్ #${id} రద్దు చేయబడింది.`,
  },
  ml: {
    notFound: (id: number) => `ഓർഡർ #${id} നിങ്ങളുടെ ഓർഡറുകളിൽ കണ്ടില്ല. കാണാൻ MYORDERS അയയ്ക്കുക.`,
    cannot: (id: number) =>
      `ഓർഡർ #${id} ഇവിടെ റദ്ദാക്കാൻ കഴിയില്ല. അത് ഇതിനകം റദ്ദാക്കി, അല്ലെങ്കിൽ വിൽപ്പനക്കാരൻ അതിൽ പ്രവർത്തനം തുടങ്ങി.`,
    cancelled: (id: number) => `ഓർഡർ #${id} റദ്ദാക്കി.`,
  },
};

export function cn(language: string) {
  return CANCEL_TEXT[language as keyof typeof CANCEL_TEXT] ?? CANCEL_TEXT.en;
}

// Message to the seller (English for now)
export function sellerCancelNotice(orderId: number): string {
  return `Order #${orderId} was cancelled by the customer. Please do not prepare it.`;
}