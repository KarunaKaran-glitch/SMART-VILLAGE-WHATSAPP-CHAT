const STATUS: Record<string, Record<string, string>> = {
  en: {
    PENDING: 'Pending',
    PAID: 'Paid',
    CONFIRMED: 'Confirmed',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  },
  hi: {
    PENDING: 'लंबित',
    PAID: 'भुगतान हो गया',
    CONFIRMED: 'पुष्टि हो गई',
    SHIPPED: 'भेज दिया गया',
    DELIVERED: 'पहुँच गया',
    CANCELLED: 'रद्द',
  },
  or: {
    PENDING: 'ବାକି ଅଛି',
    PAID: 'ପଇସା ଦିଆଯାଇଛି',
    CONFIRMED: 'ନିଶ୍ଚିତ',
    SHIPPED: 'ପଠାଯାଇଛି',
    DELIVERED: 'ଡେଲିଭରି ହୋଇଗଲା',
    CANCELLED: 'ବାତିଲ',
  },
  as: {
    PENDING: 'বাকী আছে',
    PAID: 'ধন দিয়া হ\'ল',
    CONFIRMED: 'নিশ্চিত',
    SHIPPED: 'পঠিওৱা হ\'ল',
    DELIVERED: 'ডেলিভাৰী হ\'ল',
    CANCELLED: 'বাতিল',
  },
};

const PAYMENT: Record<string, Record<string, string>> = {
  en: {
    INITIATED: 'Payment: pay cash on delivery',
    SUCCESS: 'Payment: paid',
    CANCELLED: 'Payment: cancelled',
    FAILED: 'Payment: failed',
    REFUNDED: 'Payment: refunded',
    UPI_INITIATED: 'Payment: not paid yet (pay the seller by UPI)',
    AWAITING_CONFIRMATION: 'Payment: waiting for the seller to confirm',
  },
  hi: {
    INITIATED: 'भुगतान: डिलीवरी पर नकद देना है',
    SUCCESS: 'भुगतान: हो गया',
    CANCELLED: 'भुगतान: रद्द',
    FAILED: 'भुगतान: विफल',
    REFUNDED: 'भुगतान: वापस किया गया',
    UPI_INITIATED: 'भुगतान: अभी बाकी है (विक्रेता को UPI से भुगतान करें)',
    AWAITING_CONFIRMATION: 'भुगतान: विक्रेता की पुष्टि का इंतज़ार',
  },
  or: {
    INITIATED: 'ପେମେଣ୍ଟ: ଡେଲିଭରି ସମୟରେ ନଗଦ ଦେବେ',
    SUCCESS: 'ପେମେଣ୍ଟ: ହୋଇଗଲା',
    CANCELLED: 'ପେମେଣ୍ଟ: ବାତିଲ',
    FAILED: 'ପେମେଣ୍ଟ: ବିଫଳ',
    REFUNDED: 'ପେମେଣ୍ଟ: ଫେରସ୍ତ କରାଗଲା',
    UPI_INITIATED: 'ପେମେଣ୍ଟ: ଏପର୍ଯ୍ୟନ୍ତ ବାକି (ବିକ୍ରେତାଙ୍କୁ UPI ରେ ଦିଅନ୍ତୁ)',
    AWAITING_CONFIRMATION: 'ପେମେଣ୍ଟ: ବିକ୍ରେତାଙ୍କ ନିଶ୍ଚିତକରଣକୁ ଅପେକ୍ଷା',
  },
  as: {
    INITIATED: 'পৰিশোধ: ডেলিভাৰীৰ সময়ত নগদ দিব',
    SUCCESS: 'পৰিশোধ: হৈ গ\'ল',
    CANCELLED: 'পৰিশোধ: বাতিল',
    FAILED: 'পৰিশোধ: বিফল',
    REFUNDED: 'পৰিশোধ: ঘূৰাই দিয়া হ\'ল',
    UPI_INITIATED: 'পৰিশোধ: এতিয়াও বাকী (বিক্ৰেতাক UPI ৰে দিয়ক)',
    AWAITING_CONFIRMATION: 'পৰিশোধ: বিক্ৰেতাৰ নিশ্চিতকৰণৰ অপেক্ষাত',
  },
};

export const MYORDERS_TEXT = {
  en: { title: 'Your latest orders:', none: 'You have no orders yet. Tap "Shop now" to start shopping.' },
  hi: { title: 'आपके हाल के ऑर्डर:', none: 'आपका अभी कोई ऑर्डर नहीं है। खरीदारी के लिए "अभी खरीदें" दबाएँ।' },
  or: { title: 'ଆପଣଙ୍କ ସାମ୍ପ୍ରତିକ ଅର୍ଡର:', none: 'ଆପଣଙ୍କର ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଅର୍ଡର ନାହିଁ। କିଣିବା ପାଇଁ "ବର୍ତ୍ତମାନ କିଣନ୍ତୁ" ଦବାନ୍ତୁ।' },
  as: { title: 'আপোনাৰ শেহতীয়া অৰ্ডাৰ:', none: 'আপোনাৰ এতিয়ালৈকে কোনো অৰ্ডাৰ নাই। কিনিবলৈ "এতিয়াই কিনক" টিপক।' },
};

export function mo(language: string) {
  const key = (language in MYORDERS_TEXT ? language : 'en') as keyof typeof MYORDERS_TEXT;
  return {
    ...MYORDERS_TEXT[key],
    status: (s: string) => (STATUS[key] ?? STATUS.en)[s] ?? s,
    // A UPI payment that is still INITIATED needs a different label from cash on delivery
    pay: (s: string, method?: string) =>
      (PAYMENT[key] ?? PAYMENT.en)[method === 'UPI_DIRECT' && s === 'INITIATED' ? 'UPI_INITIATED' : s] ?? s,
  };
}
