const STATUS: Record<string, Record<string, string>> = {
  en: {
    PENDING: 'Pending',
    PAID: 'Paid',
    CONFIRMED: 'Confirmed',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  },
  ta: {
    PENDING: 'காத்திருப்பில்',
    PAID: 'பணம் செலுத்தப்பட்டது',
    CONFIRMED: 'உறுதி செய்யப்பட்டது',
    SHIPPED: 'அனுப்பப்பட்டது',
    DELIVERED: 'டெலிவரி ஆனது',
    CANCELLED: 'ரத்து செய்யப்பட்டது',
  },
  hi: {
    PENDING: 'लंबित',
    PAID: 'भुगतान हो गया',
    CONFIRMED: 'पुष्टि हो गई',
    SHIPPED: 'भेज दिया गया',
    DELIVERED: 'पहुँच गया',
    CANCELLED: 'रद्द',
  },
  te: {
    PENDING: 'పెండింగ్',
    PAID: 'చెల్లించారు',
    CONFIRMED: 'ధృవీకరించబడింది',
    SHIPPED: 'పంపబడింది',
    DELIVERED: 'డెలివరీ అయింది',
    CANCELLED: 'రద్దు చేయబడింది',
  },
  ml: {
    PENDING: 'തീർപ്പാക്കാത്തത്',
    PAID: 'പണമടച്ചു',
    CONFIRMED: 'സ്ഥിരീകരിച്ചു',
    SHIPPED: 'അയച്ചു',
    DELIVERED: 'ഡെലിവറി ചെയ്തു',
    CANCELLED: 'റദ്ദാക്കി',
  },
};

const PAYMENT: Record<string, Record<string, string>> = {
  en: {
    INITIATED: 'Payment: pay cash on delivery',
    SUCCESS: 'Payment: paid',
    CANCELLED: 'Payment: cancelled',
    FAILED: 'Payment: failed',
    REFUNDED: 'Payment: refunded',
  },
  ta: {
    INITIATED: 'பணம்: டெலிவரியின் போது செலுத்த வேண்டும்',
    SUCCESS: 'பணம்: செலுத்தப்பட்டது',
    CANCELLED: 'பணம்: ரத்து',
    FAILED: 'பணம்: தோல்வி',
    REFUNDED: 'பணம்: திரும்பத் தரப்பட்டது',
  },
  hi: {
    INITIATED: 'भुगतान: डिलीवरी पर नकद देना है',
    SUCCESS: 'भुगतान: हो गया',
    CANCELLED: 'भुगतान: रद्द',
    FAILED: 'भुगतान: विफल',
    REFUNDED: 'भुगतान: वापस किया गया',
  },
  te: {
    INITIATED: 'చెల్లింపు: డెలివరీ సమయంలో నగదు చెల్లించాలి',
    SUCCESS: 'చెల్లింపు: పూర్తయింది',
    CANCELLED: 'చెల్లింపు: రద్దు',
    FAILED: 'చెల్లింపు: విఫలమైంది',
    REFUNDED: 'చెల్లింపు: తిరిగి ఇవ్వబడింది',
  },
  ml: {
    INITIATED: 'പേയ്‌മെന്റ്: ഡെലിവറി സമയത്ത് പണം നൽകണം',
    SUCCESS: 'പേയ്‌മെന്റ്: പൂർത്തിയായി',
    CANCELLED: 'പേയ്‌മെന്റ്: റദ്ദാക്കി',
    FAILED: 'പേയ്‌മെന്റ്: പരാജയപ്പെട്ടു',
    REFUNDED: 'പേയ്‌മെന്റ്: തിരികെ നൽകി',
  },
};

export const MYORDERS_TEXT = {
  en: { title: 'Your latest orders:', none: 'You have no orders yet. Reply MENU to shop.' },
  ta: { title: 'உங்கள் சமீபத்திய ஆர்டர்கள்:', none: 'உங்களிடம் இன்னும் ஆர்டர்கள் இல்லை. வாங்க MENU என்று அனுப்பவும்.' },
  hi: { title: 'आपके हाल के ऑर्डर:', none: 'आपका अभी कोई ऑर्डर नहीं है। खरीदारी के लिए MENU भेजें।' },
  te: { title: 'మీ తాజా ఆర్డర్లు:', none: 'మీకు ఇంకా ఆర్డర్లు లేవు. షాపింగ్ కోసం MENU పంపండి.' },
  ml: { title: 'നിങ്ങളുടെ ഏറ്റവും പുതിയ ഓർഡറുകൾ:', none: 'നിങ്ങൾക്ക് ഇതുവരെ ഓർഡറുകൾ ഇല്ല. ഷോപ്പിംഗിന് MENU അയയ്ക്കുക.' },
};

export function mo(language: string) {
  const key = (language in MYORDERS_TEXT ? language : 'en') as keyof typeof MYORDERS_TEXT;
  return {
    ...MYORDERS_TEXT[key],
    status: (s: string) => (STATUS[key] ?? STATUS.en)[s] ?? s,
    pay: (s: string) => (PAYMENT[key] ?? PAYMENT.en)[s] ?? s,
  };
}