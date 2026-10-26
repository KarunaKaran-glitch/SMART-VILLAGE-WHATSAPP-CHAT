// Texts for the shop web page (opened from the [Click here] button), in every language
const en = {
  chooseProducts: 'Choose your products',
  freeDelivery: 'Free delivery',
  add: 'Add',
  soldOut: 'Sold out',
  onlyLeft: (n: number) => `Only ${n} left`,
  noProducts: 'No products are available right now. Please check again later.',
  items: (n: number) => `${n} item(s)`,
  total: 'Total',
  address: 'Delivery address',
  addressHint: 'House / street, village, district, PIN code',
  continue: 'Continue',
  pickOne: 'Please add at least one product.',
  addressInvalid: 'Please write your full delivery address (10 to 200 letters).',
  sending: 'Placing your order…',
  failed: 'Something went wrong. Please try again.',
  expired: 'This link is old. Go back to WhatsApp and tap "Shop now" again.',
  placed: (id: number) => `Order #${id} placed!`,
  placedBody: (shop: string, total: string) =>
    `Total ₹${total} (free delivery). We have sent the payment details to your WhatsApp. Pay ${shop} by UPI, then tap "I have paid".`,
  backToWhatsApp: 'Back to WhatsApp',
};

const hi: typeof en = {
  chooseProducts: 'अपने उत्पाद चुनें',
  freeDelivery: 'डिलीवरी मुफ़्त',
  add: 'जोड़ें',
  soldOut: 'बिक गया',
  onlyLeft: (n: number) => `केवल ${n} बचे`,
  noProducts: 'अभी कोई उत्पाद उपलब्ध नहीं है। कृपया बाद में फिर देखें।',
  items: (n: number) => `${n} सामान`,
  total: 'कुल',
  address: 'डिलीवरी पता',
  addressHint: 'मकान / गली, गाँव, ज़िला, पिन कोड',
  continue: 'आगे बढ़ें',
  pickOne: 'कृपया कम से कम एक उत्पाद जोड़ें।',
  addressInvalid: 'कृपया अपना पूरा डिलीवरी पता लिखें (10 से 200 अक्षर)।',
  sending: 'आपका ऑर्डर भेजा जा रहा है…',
  failed: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
  expired: 'यह लिंक पुराना है। WhatsApp पर वापस जाकर फिर से "अभी खरीदें" दबाएँ।',
  placed: (id: number) => `ऑर्डर #${id} हो गया!`,
  placedBody: (shop: string, total: string) =>
    `कुल ₹${total} (डिलीवरी मुफ़्त)। भुगतान की जानकारी आपके WhatsApp पर भेज दी गई है। ${shop} को UPI से भुगतान करें, फिर "मैंने भुगतान किया" दबाएँ।`,
  backToWhatsApp: 'WhatsApp पर वापस जाएँ',
};

const or: typeof en = {
  chooseProducts: 'ଆପଣଙ୍କ ଉତ୍ପାଦ ବାଛନ୍ତୁ',
  freeDelivery: 'ଡେଲିଭରି ମାଗଣା',
  add: 'ଯୋଡ଼ନ୍ତୁ',
  soldOut: 'ବିକ୍ରି ସରିଗଲା',
  onlyLeft: (n: number) => `କେବଳ ${n}ଟି ବାକି`,
  noProducts: 'ବର୍ତ୍ତମାନ କୌଣସି ଉତ୍ପାଦ ଉପଲବ୍ଧ ନାହିଁ। ଦୟାକରି ପରେ ପୁଣି ଦେଖନ୍ତୁ।',
  items: (n: number) => `${n}ଟି ଜିନିଷ`,
  total: 'ମୋଟ',
  address: 'ଡେଲିଭରି ଠିକଣା',
  addressHint: 'ଘର / ରାସ୍ତା, ଗାଁ, ଜିଲ୍ଲା, ପିନ୍ କୋଡ୍',
  continue: 'ଆଗକୁ ବଢ଼ନ୍ତୁ',
  pickOne: 'ଦୟାକରି ଅତି କମରେ ଗୋଟିଏ ଉତ୍ପାଦ ଯୋଡ଼ନ୍ତୁ।',
  addressInvalid: 'ଦୟାକରି ଆପଣଙ୍କ ପୂରା ଡେଲିଭରି ଠିକଣା ଲେଖନ୍ତୁ (10 ରୁ 200 ଅକ୍ଷର)।',
  sending: 'ଆପଣଙ୍କ ଅର୍ଡର ପଠାଯାଉଛି…',
  failed: 'କିଛି ଭୁଲ ହେଲା। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।',
  expired: 'ଏହି ଲିଙ୍କ ପୁରୁଣା। WhatsAppକୁ ଫେରି ପୁଣି "ବର୍ତ୍ତମାନ କିଣନ୍ତୁ" ଦବାନ୍ତୁ।',
  placed: (id: number) => `ଅର୍ଡର #${id} ହୋଇଗଲା!`,
  placedBody: (shop: string, total: string) =>
    `ମୋଟ ₹${total} (ଡେଲିଭରି ମାଗଣା)। ପେମେଣ୍ଟ ବିବରଣୀ ଆପଣଙ୍କ WhatsAppକୁ ପଠାଯାଇଛି। ${shop}କୁ UPI ଦ୍ୱାରା ପଇସା ଦିଅନ୍ତୁ, ତା'ପରେ "ମୁଁ ପଇସା ଦେଲି" ଦବାନ୍ତୁ।`,
  backToWhatsApp: 'WhatsAppକୁ ଫେରନ୍ତୁ',
};

const as: typeof en = {
  chooseProducts: 'আপোনাৰ সামগ্ৰী বাছক',
  freeDelivery: 'ডেলিভাৰী বিনামূলীয়া',
  add: 'যোগ কৰক',
  soldOut: 'বিক্ৰী শেষ',
  onlyLeft: (n: number) => `মাত্ৰ ${n}টা বাকী`,
  noProducts: 'এতিয়া কোনো সামগ্ৰী উপলব্ধ নাই। অনুগ্ৰহ কৰি পিছত আকৌ চাওক।',
  items: (n: number) => `${n}টা সামগ্ৰী`,
  total: 'মুঠ',
  address: 'ডেলিভাৰী ঠিকনা',
  addressHint: "ঘৰ / পথ, গাঁও, জিলা, পিন ক'ড",
  continue: 'আগবাঢ়ক',
  pickOne: 'অনুগ্ৰহ কৰি অন্ততঃ এটা সামগ্ৰী যোগ কৰক।',
  addressInvalid: 'অনুগ্ৰহ কৰি আপোনাৰ সম্পূৰ্ণ ডেলিভাৰী ঠিকনা লিখক (10ৰ পৰা 200 আখৰ)।',
  sending: 'আপোনাৰ অৰ্ডাৰ পঠিওৱা হৈছে…',
  failed: "কিবা ভুল হ'ল। অনুগ্ৰহ কৰি আকৌ চেষ্টা কৰক।",
  expired: 'এই লিংক পুৰণি। WhatsAppলৈ উভতি গৈ আকৌ "এতিয়াই কিনক" টিপক।',
  placed: (id: number) => `অৰ্ডাৰ #${id} হৈ গ'ল!`,
  placedBody: (shop: string, total: string) =>
    `মুঠ ₹${total} (ডেলিভাৰী বিনামূলীয়া)। পেমেণ্টৰ বিৱৰণ আপোনাৰ WhatsAppলৈ পঠিওৱা হৈছে। ${shop}ক UPIৰে ধন দিয়ক, তাৰ পিছত "মই ধন দিলোঁ" টিপক।`,
  backToWhatsApp: 'WhatsAppলৈ উভতি যাওক',
};

const WEB_TEXT: Record<string, typeof en> = { en, hi, or, as };

export function wt(language: string) {
  return WEB_TEXT[language] ?? en;
}
