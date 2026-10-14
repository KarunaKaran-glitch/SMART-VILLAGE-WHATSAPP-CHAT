const STATUS_LABELS: Record<string, Record<string, string>> = {
  en: {
    CONFIRMED: 'confirmed by the seller',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
  },
  ta: {
    CONFIRMED: 'விற்பனையாளரால் உறுதி செய்யப்பட்டது',
    SHIPPED: 'அனுப்பப்பட்டது',
    DELIVERED: 'டெலிவரி செய்யப்பட்டது',
  },
  hi: {
    CONFIRMED: 'विक्रेता ने पुष्टि की',
    SHIPPED: 'भेज दिया गया',
    DELIVERED: 'पहुँचा दिया गया',
  },
  te: {
    CONFIRMED: 'విక్రేత ధృవీకరించారు',
    SHIPPED: 'పంపబడింది',
    DELIVERED: 'డెలివరీ అయింది',
  },
  ml: {
    CONFIRMED: 'വിൽപ്പനക്കാരൻ സ്ഥിരീകരിച്ചു',
    SHIPPED: 'അയച്ചു',
    DELIVERED: 'ഡെലിവറി ചെയ്തു',
  },
};

export const ORDER_TEXT = {
  en: {
    placed: (id: number, total: number) =>
      `Order #${id} placed. Total: ₹${total}. Payment: cash on delivery. Thank you! Reply MENU to shop more.`,
    status: (id: number, s: string) =>
      `Order #${id} update: ${STATUS_LABELS.en[s] ?? s}.`,
  },
  ta: {
    placed: (id: number, total: number) =>
      `ஆர்டர் #${id} பதிவு செய்யப்பட்டது. மொத்தம்: ₹${total}. பணம்: டெலிவரியின் போது செலுத்த வேண்டும். நன்றி! மேலும் வாங்க MENU என்று அனுப்பவும்.`,
    status: (id: number, s: string) =>
      `ஆர்டர் #${id}: ${STATUS_LABELS.ta[s] ?? s}.`,
  },
  hi: {
    placed: (id: number, total: number) =>
      `ऑर्डर #${id} दर्ज हो गया। कुल: ₹${total}। भुगतान: डिलीवरी पर नकद। धन्यवाद! और खरीदारी के लिए MENU भेजें।`,
    status: (id: number, s: string) =>
      `ऑर्डर #${id}: ${STATUS_LABELS.hi[s] ?? s}।`,
  },
  te: {
    placed: (id: number, total: number) =>
      `ఆర్డర్ #${id} నమోదు అయింది. మొత్తం: ₹${total}. చెల్లింపు: డెలివరీ సమయంలో నగదు. ధన్యవాదాలు! మరింత షాపింగ్ కోసం MENU పంపండి.`,
    status: (id: number, s: string) =>
      `ఆర్డర్ #${id}: ${STATUS_LABELS.te[s] ?? s}.`,
  },
  ml: {
    placed: (id: number, total: number) =>
      `ഓർഡർ #${id} രേഖപ്പെടുത്തി. ആകെ: ₹${total}. പേയ്‌മെന്റ്: ഡെലിവറി സമയത്ത് പണം. നന്ദി! കൂടുതൽ ഷോപ്പിംഗിന് MENU അയയ്ക്കുക.`,
    status: (id: number, s: string) =>
      `ഓർഡർ #${id}: ${STATUS_LABELS.ml[s] ?? s}.`,
  },
};

export function ot(language: string) {
  return ORDER_TEXT[language as keyof typeof ORDER_TEXT] ?? ORDER_TEXT.en;
}