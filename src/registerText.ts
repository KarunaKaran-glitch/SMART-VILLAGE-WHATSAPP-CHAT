import { byLang } from './lang';
import { mo } from './myOrdersText';

// Seller registration and admin messages in every language. Commands stay in English letters.
// REG_TEXT answers in the language of the person the message is for (see lang.ts).
const decision = (lang: string, result: string) =>
  ({
    en: { APPROVED: 'approved', REJECTED: 'rejected' },
    hi: { APPROVED: 'मंज़ूर', REJECTED: 'नामंज़ूर' },
    or: { APPROVED: 'ଅନୁମୋଦିତ', REJECTED: 'ପ୍ରତ୍ୟାଖ୍ୟାତ' },
    as: { APPROVED: 'অনুমোদিত', REJECTED: 'নাকচ' },
  } as Record<string, Record<string, string>>)[lang]?.[result] ?? result;

const en = {
  adminHome: 'Welcome, admin! What would you like to check?',
  btnCheckProducts: 'Check products',
  btnSellerRequests: 'Seller requests',
  btnAdminMenu: 'Admin menu',
  adminMenuBody: 'Admin menu: tap "Choose".',
  rowProductsToCheck: 'Products to check',
  rowSellerRequests: 'Seller requests',
  rowSales: 'Sales summary',
  rowShop: 'Shop as a customer',
  rowCategories: 'Categories',
  categoryLabel: 'Category',
  batchNotice: (shop: string, n: number, category: string) =>
    `${shop} (${category}) sent ${n} new product(s) to check.`,
  btnReviewNow: 'Review now',
  btnApproveAll: (n: number) => `Approve all ${n}`,
  approvedAllDone: (n: number, shop: string) => `${n} product(s) of ${shop} approved. The seller has been told.`,
  nothingToReview: 'No products from this seller are waiting.',
  categoriesTitle: 'Categories:',
  addCategoryHint: 'To add a category, send ADDCATEGORY and its name, for example: ADDCATEGORY Jewellery',
  categoryAdded: (name: string) => `Category "${name}" added. Sellers can now choose it.`,
  categoryExists: (name: string) => `Category "${name}" already exists.`,
  sellerRequestCard: (id: number, shop: string, phone: string) =>
    `Seller request #${id}\nShop: ${shop}\nPhone: ${phone}`,
  salesTitle: 'Marketplace summary:',
  salesOrders: (orders: number, open: number, delivered: number, cancelled: number) =>
    `Orders: ${orders} (open ${open}, delivered ${delivered}, cancelled ${cancelled})`,
  salesPaid: (amount: number) => `Payments received (UPI and cash): ₹${amount}`,
  salesPeople: (sellers: number, customers: number) => `Sellers: ${sellers}, customers: ${customers}`,
  salesPerSeller: 'Delivered sales per seller:',
  salesNone: 'No delivered sales yet.',
  openOrdersHint: 'Send ADMINCANCEL <order> to cancel one.',
  askShop: 'What is your shop name? (2 to 40 characters) Or send CANCEL.',
  invalidShop: 'The shop name must be 2 to 40 characters. Try again, or send CANCEL.',
  requested:
    'Thank you! Your request to become a seller has been sent to the admin. You will get a message when it is decided.',
  cancelled: 'Cancelled.',
  alreadySeller: 'You are already a seller. Send SELLER to see your menu.',
  alreadyPending: 'Your seller request is waiting for the admin. Please wait for the decision.',
  adminCannot: 'Admins cannot apply as sellers.',
  sellBlocked: 'Your seller account is blocked. Please contact the admin.',
  adminNotice: (id: number, shop: string, phone: string) =>
    `New seller request #${id}\nShop: ${shop}\nPhone: ${phone}\nTap Approve or Reject.`,
  notPending: (id: number) => `Request #${id} was not found or is not waiting for a decision.`,
  decided: (id: number, result: string) =>
    `Request #${id} is now ${decision('en', result)}. The applicant has been told.`,
  approvedNotice: (shop: string) =>
    `Your seller request for "${shop}" was approved. Add your first product now.`,
  rejectedNotice: 'Your seller request was not approved. You can apply again from the menu.',
  noPending: 'No seller requests are waiting.',
  notSeller: (id: number) => `User #${id} is not an active seller.`,
  notBlocked: (id: number) => `User #${id} is not blocked.`,
  blocked: (id: number, open: number) =>
    `Seller #${id} is blocked and their products are hidden.` +
    (open > 0 ? ` ${open} open order item(s) still need handling. Send OPENORDERS ${id} to see them.` : ''),
  unblocked: (id: number) =>
    `Seller #${id} is allowed again. Their products stay hidden until they send SHOW for each one.`,
  blockedNotice: 'Your seller account has been blocked by the admin. Please contact the admin.',
  unblockedNotice:
    'Your seller account is active again. Your products are still hidden: send SHOW with a product number to bring each one back.',
  openOrdersTitle: (sellerId: number) => `Open orders of seller #${sellerId}:`,
  noOpenOrders: (sellerId: number) => `Seller #${sellerId} has no open orders.`,
  orderMissing: (orderId: number) => `Order #${orderId} was not found.`,
  cannotAdminCancel: (orderId: number, status: string) =>
    `Order #${orderId} is "${mo('en').status(status)}", so it cannot be cancelled.`,
  adminCancelled: (orderId: number) =>
    `Order #${orderId} is cancelled. Stock was returned, and the customer and seller have been told.`,
  adminCancelledPaid: (orderId: number, amount: number) =>
    `Order #${orderId} is cancelled. Stock was returned, and the customer and seller have been told.\n` +
    `IMPORTANT: the customer already paid ₹${amount} to the seller by UPI. Arrange the refund with the seller outside WhatsApp.`,
  makeAdminUsage: 'Send MAKEADMIN with the phone number, for example: MAKEADMIN 919876543210',
  userNotFound: (phone: string) =>
    `No user with phone ${phone}. Ask them to send any message to this WhatsApp number first, then try again.`,
  alreadyAdmin: (phone: string) => `${phone} is already an admin.`,
  cannotMakeAdmin: (phone: string) => `${phone} is a seller or has a seller request. A seller cannot also be an admin.`,
  madeAdmin: (phone: string) => `${phone} is now an admin and has been told.`,
  newAdminNotice: 'You are now an admin of this marketplace. Send hi to see the admin screen.',
  adminProductNotice: (id: number, name: string, price: number, shop: string) =>
    `New product #${id} to check\n${name} - ₹${price}\nShop: ${shop}\nIs it handmade? Tap Approve or Reject.`,
  noPendingProducts: 'No products are waiting for approval.',
  pendingProductsSent: (n: number) => `${n} product(s) waiting: their photos are above.`,
  productNotFound: (id: number) => `Product #${id} was not found.`,
  productNoPhoto: (id: number) => `Product #${id} has no photo yet, so it cannot be approved.`,
  productDecided: (id: number, result: string) =>
    `Product #${id} is now ${decision('en', result)}. The seller has been told.`,
  adminHelp:
    'Admin commands (you can also type these):\n' +
    'PENDINGPRODUCTS - products waiting for approval (with photos)\n' +
    'APPROVEPRODUCT 5 / REJECTPRODUCT 5 - decide product #5\n' +
    'PENDINGSELLERS - seller requests waiting\n' +
    'APPROVE 7 / REJECT 7 - decide seller request #7\n' +
    'BLOCK 7 / UNBLOCK 7 - block or allow seller #7\n' +
    'OPENORDERS 7 - open orders of seller #7\n' +
    'ADMINCANCEL 12 - cancel order #12 (not yet delivered)\n' +
    'MAKEADMIN 919876543210 - make that user an admin\n' +
    'SALES - totals for the marketplace',
};

const hi: typeof en = {
  adminHome: 'स्वागत है, एडमिन! आप क्या देखना चाहेंगे?',
  btnCheckProducts: 'उत्पाद जाँचें',
  btnSellerRequests: 'विक्रेता अनुरोध',
  btnAdminMenu: 'एडमिन मेनू',
  adminMenuBody: 'एडमिन मेनू: "चुनें" पर टैप करें।',
  rowProductsToCheck: 'जाँचने वाले उत्पाद',
  rowSellerRequests: 'विक्रेता अनुरोध',
  rowSales: 'बिक्री सारांश',
  rowShop: 'ग्राहक की तरह खरीदें',
  rowCategories: 'श्रेणियाँ',
  categoryLabel: 'श्रेणी',
  batchNotice: (shop: string, n: number, category: string) =>
    `${shop} (${category}) ने जाँच के लिए ${n} नए उत्पाद भेजे।`,
  btnReviewNow: 'अभी जाँचें',
  btnApproveAll: (n: number) => `सभी ${n} मंज़ूर`,
  approvedAllDone: (n: number, shop: string) => `${shop} के ${n} उत्पाद मंज़ूर। विक्रेता को बता दिया गया।`,
  nothingToReview: 'इस विक्रेता का कोई उत्पाद बाकी नहीं है।',
  categoriesTitle: 'श्रेणियाँ:',
  addCategoryHint: 'नई श्रेणी जोड़ने के लिए ADDCATEGORY और नाम भेजें, जैसे: ADDCATEGORY Jewellery',
  categoryAdded: (name: string) => `श्रेणी "${name}" जोड़ दी गई। विक्रेता अब इसे चुन सकते हैं।`,
  categoryExists: (name: string) => `श्रेणी "${name}" पहले से है।`,
  sellerRequestCard: (id: number, shop: string, phone: string) =>
    `विक्रेता अनुरोध #${id}\nदुकान: ${shop}\nफ़ोन: ${phone}`,
  salesTitle: 'मार्केटप्लेस सारांश:',
  salesOrders: (orders: number, open: number, delivered: number, cancelled: number) =>
    `ऑर्डर: ${orders} (चालू ${open}, डिलीवर ${delivered}, रद्द ${cancelled})`,
  salesPaid: (amount: number) => `मिला भुगतान (UPI और नकद): ₹${amount}`,
  salesPeople: (sellers: number, customers: number) => `विक्रेता: ${sellers}, ग्राहक: ${customers}`,
  salesPerSeller: 'हर विक्रेता की डिलीवर हुई बिक्री:',
  salesNone: 'अभी कोई डिलीवर हुई बिक्री नहीं।',
  openOrdersHint: 'किसी को रद्द करने के लिए ADMINCANCEL <ऑर्डर> भेजें।',
  askShop: 'आपकी दुकान का नाम क्या है? (2 से 40 अक्षर) या CANCEL भेजें।',
  invalidShop: 'दुकान का नाम 2 से 40 अक्षर का होना चाहिए। फिर से भेजें, या CANCEL।',
  requested: 'धन्यवाद! विक्रेता बनने का आपका अनुरोध एडमिन को भेज दिया गया। फ़ैसला होने पर आपको संदेश मिलेगा।',
  cancelled: 'रद्द किया गया।',
  alreadySeller: 'आप पहले से विक्रेता हैं। अपना मेनू देखने के लिए SELLER भेजें।',
  alreadyPending: 'आपका विक्रेता अनुरोध एडमिन के पास है। कृपया फ़ैसले का इंतज़ार करें।',
  adminCannot: 'एडमिन विक्रेता के लिए आवेदन नहीं कर सकते।',
  sellBlocked: 'आपका विक्रेता खाता बंद है। कृपया एडमिन से संपर्क करें।',
  adminNotice: (id: number, shop: string, phone: string) =>
    `नया विक्रेता अनुरोध #${id}\nदुकान: ${shop}\nफ़ोन: ${phone}\n"मंज़ूर" या "नामंज़ूर" पर टैप करें।`,
  notPending: (id: number) => `अनुरोध #${id} नहीं मिला या फ़ैसले का इंतज़ार नहीं कर रहा।`,
  decided: (id: number, result: string) =>
    `अनुरोध #${id} अब ${decision('hi', result)} है। आवेदक को बता दिया गया।`,
  approvedNotice: (shop: string) =>
    `"${shop}" के लिए आपका विक्रेता अनुरोध मंज़ूर हो गया। अब अपना पहला उत्पाद जोड़ें।`,
  rejectedNotice: 'आपका विक्रेता अनुरोध मंज़ूर नहीं हुआ। आप मेनू से फिर आवेदन कर सकते हैं।',
  noPending: 'कोई विक्रेता अनुरोध बाकी नहीं है।',
  notSeller: (id: number) => `उपयोगकर्ता #${id} सक्रिय विक्रेता नहीं है।`,
  notBlocked: (id: number) => `उपयोगकर्ता #${id} बंद नहीं है।`,
  blocked: (id: number, open: number) =>
    `विक्रेता #${id} बंद कर दिया गया और उसके उत्पाद छिपा दिए गए।` +
    (open > 0 ? ` ${open} चालू ऑर्डर आइटम अभी बाकी हैं। देखने के लिए OPENORDERS ${id} भेजें।` : ''),
  unblocked: (id: number) =>
    `विक्रेता #${id} फिर से चालू है। हर उत्पाद के लिए SHOW भेजने तक उसके उत्पाद छिपे रहेंगे।`,
  blockedNotice: 'एडमिन ने आपका विक्रेता खाता बंद कर दिया है। कृपया एडमिन से संपर्क करें।',
  unblockedNotice: 'आपका विक्रेता खाता फिर चालू है। आपके उत्पाद अभी छिपे हैं: हर एक के लिए SHOW और उत्पाद नंबर भेजें।',
  openOrdersTitle: (sellerId: number) => `विक्रेता #${sellerId} के चालू ऑर्डर:`,
  noOpenOrders: (sellerId: number) => `विक्रेता #${sellerId} का कोई चालू ऑर्डर नहीं है।`,
  orderMissing: (orderId: number) => `ऑर्डर #${orderId} नहीं मिला।`,
  cannotAdminCancel: (orderId: number, status: string) =>
    `ऑर्डर #${orderId} "${mo('hi').status(status)}" है, इसलिए रद्द नहीं हो सकता।`,
  adminCancelled: (orderId: number) =>
    `ऑर्डर #${orderId} रद्द हो गया। स्टॉक वापस हुआ, और ग्राहक व विक्रेता को बता दिया गया।`,
  adminCancelledPaid: (orderId: number, amount: number) =>
    `ऑर्डर #${orderId} रद्द हो गया। स्टॉक वापस हुआ, और ग्राहक व विक्रेता को बता दिया गया।\n` +
    `ज़रूरी: ग्राहक विक्रेता को UPI से ₹${amount} दे चुका है। रिफंड का इंतज़ाम विक्रेता के साथ WhatsApp के बाहर करें।`,
  makeAdminUsage: 'MAKEADMIN के साथ फ़ोन नंबर भेजें, जैसे: MAKEADMIN 919876543210',
  userNotFound: (phone: string) =>
    `${phone} वाला कोई उपयोगकर्ता नहीं है। उनसे पहले इस WhatsApp नंबर पर कोई संदेश भेजने को कहें, फिर कोशिश करें।`,
  alreadyAdmin: (phone: string) => `${phone} पहले से एडमिन है।`,
  cannotMakeAdmin: (phone: string) => `${phone} विक्रेता है या उसका विक्रेता अनुरोध है। विक्रेता एडमिन नहीं बन सकता।`,
  madeAdmin: (phone: string) => `${phone} अब एडमिन है और उसे बता दिया गया।`,
  newAdminNotice: 'आप अब इस मार्केटप्लेस के एडमिन हैं। एडमिन स्क्रीन देखने के लिए hi भेजें।',
  adminProductNotice: (id: number, name: string, price: number, shop: string) =>
    `जाँचने के लिए नया उत्पाद #${id}\n${name} - ₹${price}\nदुकान: ${shop}\nक्या यह हस्तनिर्मित है? "मंज़ूर" या "नामंज़ूर" पर टैप करें।`,
  noPendingProducts: 'कोई उत्पाद मंज़ूरी का इंतज़ार नहीं कर रहा।',
  pendingProductsSent: (n: number) => `${n} उत्पाद बाकी: उनके फोटो ऊपर हैं।`,
  productNotFound: (id: number) => `उत्पाद #${id} नहीं मिला।`,
  productNoPhoto: (id: number) => `उत्पाद #${id} का अभी फोटो नहीं है, इसलिए मंज़ूर नहीं हो सकता।`,
  productDecided: (id: number, result: string) =>
    `उत्पाद #${id} अब ${decision('hi', result)} है। विक्रेता को बता दिया गया।`,
  adminHelp:
    'एडमिन कमांड (ये आप टाइप भी कर सकते हैं):\n' +
    'PENDINGPRODUCTS - मंज़ूरी के लिए बाकी उत्पाद (फोटो सहित)\n' +
    'APPROVEPRODUCT 5 / REJECTPRODUCT 5 - उत्पाद #5 का फ़ैसला\n' +
    'PENDINGSELLERS - बाकी विक्रेता अनुरोध\n' +
    'APPROVE 7 / REJECT 7 - विक्रेता अनुरोध #7 का फ़ैसला\n' +
    'BLOCK 7 / UNBLOCK 7 - विक्रेता #7 को बंद या चालू करें\n' +
    'OPENORDERS 7 - विक्रेता #7 के चालू ऑर्डर\n' +
    'ADMINCANCEL 12 - ऑर्डर #12 रद्द करें (डिलीवरी से पहले)\n' +
    'MAKEADMIN 919876543210 - उस उपयोगकर्ता को एडमिन बनाएँ\n' +
    'SALES - मार्केटप्लेस का कुल हिसाब',
};

const or: typeof en = {
  adminHome: 'ସ୍ୱାଗତ, ଆଡମିନ! ଆପଣ କ\'ଣ ଯାଞ୍ଚ କରିବେ?',
  btnCheckProducts: 'ଉତ୍ପାଦ ଯାଞ୍ଚ',
  btnSellerRequests: 'ବିକ୍ରେତା ଅନୁରୋଧ',
  btnAdminMenu: 'ଆଡମିନ ମେନୁ',
  adminMenuBody: 'ଆଡମିନ ମେନୁ: "ବାଛନ୍ତୁ" ଟ୍ୟାପ୍ କରନ୍ତୁ।',
  rowProductsToCheck: 'ଯାଞ୍ଚ ବାକି ଉତ୍ପାଦ',
  rowSellerRequests: 'ବିକ୍ରେତା ଅନୁରୋଧ',
  rowSales: 'ବିକ୍ରି ସାରାଂଶ',
  rowShop: 'ଗ୍ରାହକ ଭାବେ କିଣନ୍ତୁ',
  rowCategories: 'ବର୍ଗ',
  categoryLabel: 'ବର୍ଗ',
  batchNotice: (shop: string, n: number, category: string) =>
    `${shop} (${category}) ଯାଞ୍ଚ ପାଇଁ ${n}ଟି ନୂଆ ଉତ୍ପାଦ ପଠାଇଛନ୍ତି।`,
  btnReviewNow: 'ଏବେ ଯାଞ୍ଚ କରନ୍ତୁ',
  btnApproveAll: (n: number) => `ସବୁ ${n} ଅନୁମୋଦନ`,
  approvedAllDone: (n: number, shop: string) => `${shop} ର ${n}ଟି ଉତ୍ପାଦ ଅନୁମୋଦିତ। ବିକ୍ରେତାଙ୍କୁ ଜଣାଗଲା।`,
  nothingToReview: 'ଏହି ବିକ୍ରେତାଙ୍କ କୌଣସି ଉତ୍ପାଦ ବାକି ନାହିଁ।',
  categoriesTitle: 'ବର୍ଗ:',
  addCategoryHint: 'ନୂଆ ବର୍ଗ ଯୋଡ଼ିବାକୁ ADDCATEGORY ଓ ନାମ ପଠାନ୍ତୁ, ଉଦାହରଣ: ADDCATEGORY Jewellery',
  categoryAdded: (name: string) => `ବର୍ଗ "${name}" ଯୋଡ଼ାଗଲା। ବିକ୍ରେତା ଏବେ ଏହା ବାଛିପାରିବେ।`,
  categoryExists: (name: string) => `ବର୍ଗ "${name}" ପୂର୍ବରୁ ଅଛି।`,
  sellerRequestCard: (id: number, shop: string, phone: string) =>
    `ବିକ୍ରେତା ଅନୁରୋଧ #${id}\nଦୋକାନ: ${shop}\nଫୋନ: ${phone}`,
  salesTitle: 'ମାର୍କେଟପ୍ଲେସ୍ ସାରାଂଶ:',
  salesOrders: (orders: number, open: number, delivered: number, cancelled: number) =>
    `ଅର୍ଡର: ${orders} (ଚାଲୁ ${open}, ଡେଲିଭରି ${delivered}, ବାତିଲ ${cancelled})`,
  salesPaid: (amount: number) => `ମିଳିଥିବା ପେମେଣ୍ଟ (UPI ଓ ନଗଦ): ₹${amount}`,
  salesPeople: (sellers: number, customers: number) => `ବିକ୍ରେତା: ${sellers}, ଗ୍ରାହକ: ${customers}`,
  salesPerSeller: 'ପ୍ରତ୍ୟେକ ବିକ୍ରେତାଙ୍କ ଡେଲିଭରି ହୋଇଥିବା ବିକ୍ରି:',
  salesNone: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଡେଲିଭରି ହୋଇଥିବା ବିକ୍ରି ନାହିଁ।',
  openOrdersHint: 'ଗୋଟିଏ ବାତିଲ କରିବାକୁ ADMINCANCEL <ଅର୍ଡର> ପଠାନ୍ତୁ।',
  askShop: 'ଆପଣଙ୍କ ଦୋକାନର ନାମ କ\'ଣ? (2 ରୁ 40 ଅକ୍ଷର) କିମ୍ବା CANCEL ପଠାନ୍ତୁ।',
  invalidShop: 'ଦୋକାନ ନାମ 2 ରୁ 40 ଅକ୍ଷର ହେବା ଦରକାର। ପୁଣି ପଠାନ୍ତୁ, କିମ୍ବା CANCEL।',
  requested: 'ଧନ୍ୟବାଦ! ବିକ୍ରେତା ହେବା ପାଇଁ ଆପଣଙ୍କ ଅନୁରୋଧ ଆଡମିନଙ୍କୁ ପଠାଗଲା। ନିଷ୍ପତ୍ତି ହେଲେ ଆପଣ ବାର୍ତ୍ତା ପାଇବେ।',
  cancelled: 'ବାତିଲ ହେଲା।',
  alreadySeller: 'ଆପଣ ପୂର୍ବରୁ ବିକ୍ରେତା। ଆପଣଙ୍କ ମେନୁ ଦେଖିବାକୁ SELLER ପଠାନ୍ତୁ।',
  alreadyPending: 'ଆପଣଙ୍କ ବିକ୍ରେତା ଅନୁରୋଧ ଆଡମିନଙ୍କ ପାଖରେ ଅଛି। ଦୟାକରି ନିଷ୍ପତ୍ତିକୁ ଅପେକ୍ଷା କରନ୍ତୁ।',
  adminCannot: 'ଆଡମିନ ବିକ୍ରେତା ପାଇଁ ଆବେଦନ କରିପାରିବେ ନାହିଁ।',
  sellBlocked: 'ଆପଣଙ୍କ ବିକ୍ରେତା ଖାତା ବନ୍ଦ ଅଛି। ଦୟାକରି ଆଡମିନଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।',
  adminNotice: (id: number, shop: string, phone: string) =>
    `ନୂଆ ବିକ୍ରେତା ଅନୁରୋଧ #${id}\nଦୋକାନ: ${shop}\nଫୋନ: ${phone}\n"ଅନୁମୋଦନ" ବା "ପ୍ରତ୍ୟାଖ୍ୟାନ" ଟ୍ୟାପ୍ କରନ୍ତୁ।`,
  notPending: (id: number) => `ଅନୁରୋଧ #${id} ମିଳିଲା ନାହିଁ ବା ନିଷ୍ପତ୍ତି ପାଇଁ ଅପେକ୍ଷା କରୁନାହିଁ।`,
  decided: (id: number, result: string) =>
    `ଅନୁରୋଧ #${id} ଏବେ ${decision('or', result)}। ଆବେଦନକାରୀଙ୍କୁ ଜଣାଗଲା।`,
  approvedNotice: (shop: string) =>
    `"${shop}" ପାଇଁ ଆପଣଙ୍କ ବିକ୍ରେତା ଅନୁରୋଧ ଅନୁମୋଦିତ ହେଲା। ଏବେ ଆପଣଙ୍କ ପ୍ରଥମ ଉତ୍ପାଦ ଯୋଡ଼ନ୍ତୁ।`,
  rejectedNotice: 'ଆପଣଙ୍କ ବିକ୍ରେତା ଅନୁରୋଧ ଅନୁମୋଦିତ ହେଲା ନାହିଁ। ଆପଣ ମେନୁରୁ ପୁଣି ଆବେଦନ କରିପାରିବେ।',
  noPending: 'କୌଣସି ବିକ୍ରେତା ଅନୁରୋଧ ବାକି ନାହିଁ।',
  notSeller: (id: number) => `ବ୍ୟବହାରକାରୀ #${id} ସକ୍ରିୟ ବିକ୍ରେତା ନୁହଁନ୍ତି।`,
  notBlocked: (id: number) => `ବ୍ୟବହାରକାରୀ #${id} ବନ୍ଦ ନାହାଁନ୍ତି।`,
  blocked: (id: number, open: number) =>
    `ବିକ୍ରେତା #${id} ବନ୍ଦ ହେଲେ ଏବଂ ତାଙ୍କ ଉତ୍ପାଦ ଲୁଚାଗଲା।` +
    (open > 0 ? ` ${open}ଟି ଚାଲୁ ଅର୍ଡର ଆଇଟମ ଏପର୍ଯ୍ୟନ୍ତ ବାକି। ଦେଖିବାକୁ OPENORDERS ${id} ପଠାନ୍ତୁ।` : ''),
  unblocked: (id: number) =>
    `ବିକ୍ରେତା #${id} ପୁଣି ଚାଲୁ। ପ୍ରତ୍ୟେକ ଉତ୍ପାଦ ପାଇଁ SHOW ପଠାଇବା ପର୍ଯ୍ୟନ୍ତ ତାଙ୍କ ଉତ୍ପାଦ ଲୁଚି ରହିବ।`,
  blockedNotice: 'ଆଡମିନ ଆପଣଙ୍କ ବିକ୍ରେତା ଖାତା ବନ୍ଦ କରିଛନ୍ତି। ଦୟାକରି ଆଡମିନଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।',
  unblockedNotice: 'ଆପଣଙ୍କ ବିକ୍ରେତା ଖାତା ପୁଣି ଚାଲୁ। ଆପଣଙ୍କ ଉତ୍ପାଦ ଏବେ ଲୁଚି ଅଛି: ପ୍ରତ୍ୟେକ ପାଇଁ SHOW ଓ ଉତ୍ପାଦ ନମ୍ବର ପଠାନ୍ତୁ।',
  openOrdersTitle: (sellerId: number) => `ବିକ୍ରେତା #${sellerId} ଙ୍କ ଚାଲୁ ଅର୍ଡର:`,
  noOpenOrders: (sellerId: number) => `ବିକ୍ରେତା #${sellerId} ଙ୍କର କୌଣସି ଚାଲୁ ଅର୍ଡର ନାହିଁ।`,
  orderMissing: (orderId: number) => `ଅର୍ଡର #${orderId} ମିଳିଲା ନାହିଁ।`,
  cannotAdminCancel: (orderId: number, status: string) =>
    `ଅର୍ଡର #${orderId} "${mo('or').status(status)}", ତେଣୁ ବାତିଲ ହୋଇପାରିବ ନାହିଁ।`,
  adminCancelled: (orderId: number) =>
    `ଅର୍ଡର #${orderId} ବାତିଲ ହେଲା। ଷ୍ଟକ ଫେରିଲା, ଏବଂ ଗ୍ରାହକ ଓ ବିକ୍ରେତାଙ୍କୁ ଜଣାଗଲା।`,
  adminCancelledPaid: (orderId: number, amount: number) =>
    `ଅର୍ଡର #${orderId} ବାତିଲ ହେଲା। ଷ୍ଟକ ଫେରିଲା, ଏବଂ ଗ୍ରାହକ ଓ ବିକ୍ରେତାଙ୍କୁ ଜଣାଗଲା।\n` +
    `ଜରୁରୀ: ଗ୍ରାହକ ବିକ୍ରେତାଙ୍କୁ UPI ରେ ₹${amount} ଦେଇସାରିଛନ୍ତି। ରିଫଣ୍ଡ ବିକ୍ରେତାଙ୍କ ସହ WhatsApp ବାହାରେ ବ୍ୟବସ୍ଥା କରନ୍ତୁ।`,
  makeAdminUsage: 'MAKEADMIN ସହ ଫୋନ ନମ୍ବର ପଠାନ୍ତୁ, ଉଦାହରଣ: MAKEADMIN 919876543210',
  userNotFound: (phone: string) =>
    `${phone} ଫୋନ ସହ କୌଣସି ବ୍ୟବହାରକାରୀ ନାହାଁନ୍ତି। ପ୍ରଥମେ ତାଙ୍କୁ ଏହି WhatsApp ନମ୍ବରକୁ କୌଣସି ବାର୍ତ୍ତା ପଠାଇବାକୁ କୁହନ୍ତୁ, ତା'ପରେ ଚେଷ୍ଟା କରନ୍ତୁ।`,
  alreadyAdmin: (phone: string) => `${phone} ପୂର୍ବରୁ ଆଡମିନ।`,
  cannotMakeAdmin: (phone: string) => `${phone} ବିକ୍ରେତା ବା ତାଙ୍କର ବିକ୍ରେତା ଅନୁରୋଧ ଅଛି। ବିକ୍ରେତା ଆଡମିନ ହୋଇପାରିବେ ନାହିଁ।`,
  madeAdmin: (phone: string) => `${phone} ଏବେ ଆଡମିନ ଏବଂ ତାଙ୍କୁ ଜଣାଗଲା।`,
  newAdminNotice: 'ଆପଣ ଏବେ ଏହି ମାର୍କେଟପ୍ଲେସର ଆଡମିନ। ଆଡମିନ ସ୍କ୍ରିନ ଦେଖିବାକୁ hi ପଠାନ୍ତୁ।',
  adminProductNotice: (id: number, name: string, price: number, shop: string) =>
    `ଯାଞ୍ଚ ପାଇଁ ନୂଆ ଉତ୍ପାଦ #${id}\n${name} - ₹${price}\nଦୋକାନ: ${shop}\nଏହା ହାତତିଆରି କି? "ଅନୁମୋଦନ" ବା "ପ୍ରତ୍ୟାଖ୍ୟାନ" ଟ୍ୟାପ୍ କରନ୍ତୁ।`,
  noPendingProducts: 'କୌଣସି ଉତ୍ପାଦ ଅନୁମୋଦନକୁ ଅପେକ୍ଷା କରୁନାହିଁ।',
  pendingProductsSent: (n: number) => `${n}ଟି ଉତ୍ପାଦ ବାକି: ସେଗୁଡ଼ିକର ଫଟୋ ଉପରେ ଅଛି।`,
  productNotFound: (id: number) => `ଉତ୍ପାଦ #${id} ମିଳିଲା ନାହିଁ।`,
  productNoPhoto: (id: number) => `ଉତ୍ପାଦ #${id} ର ଏପର୍ଯ୍ୟନ୍ତ ଫଟୋ ନାହିଁ, ତେଣୁ ଅନୁମୋଦନ ହୋଇପାରିବ ନାହିଁ।`,
  productDecided: (id: number, result: string) =>
    `ଉତ୍ପାଦ #${id} ଏବେ ${decision('or', result)}। ବିକ୍ରେତାଙ୍କୁ ଜଣାଗଲା।`,
  adminHelp:
    'ଆଡମିନ କମାଣ୍ଡ (ଏଗୁଡ଼ିକ ଟାଇପ୍ ମଧ୍ୟ କରିପାରିବେ):\n' +
    'PENDINGPRODUCTS - ଅନୁମୋଦନ ବାକି ଉତ୍ପାଦ (ଫଟୋ ସହ)\n' +
    'APPROVEPRODUCT 5 / REJECTPRODUCT 5 - ଉତ୍ପାଦ #5 ର ନିଷ୍ପତ୍ତି\n' +
    'PENDINGSELLERS - ବାକି ବିକ୍ରେତା ଅନୁରୋଧ\n' +
    'APPROVE 7 / REJECT 7 - ବିକ୍ରେତା ଅନୁରୋଧ #7 ର ନିଷ୍ପତ୍ତି\n' +
    'BLOCK 7 / UNBLOCK 7 - ବିକ୍ରେତା #7 କୁ ବନ୍ଦ ବା ଚାଲୁ କରନ୍ତୁ\n' +
    'OPENORDERS 7 - ବିକ୍ରେତା #7 ଙ୍କ ଚାଲୁ ଅର୍ଡର\n' +
    'ADMINCANCEL 12 - ଅର୍ଡର #12 ବାତିଲ କରନ୍ତୁ (ଡେଲିଭରି ପୂର୍ବରୁ)\n' +
    'MAKEADMIN 919876543210 - ସେହି ବ୍ୟବହାରକାରୀଙ୍କୁ ଆଡମିନ କରନ୍ତୁ\n' +
    'SALES - ମାର୍କେଟପ୍ଲେସର ମୋଟ ହିସାବ',
};

const as: typeof en = {
  adminHome: 'স্বাগতম, এডমিন! আপুনি কি পৰীক্ষা কৰিব বিচাৰে?',
  btnCheckProducts: 'সামগ্ৰী পৰীক্ষা',
  btnSellerRequests: 'বিক্ৰেতাৰ অনুৰোধ',
  btnAdminMenu: 'এডমিন মেনু',
  adminMenuBody: 'এডমিন মেনু: "বাছক" টিপক।',
  rowProductsToCheck: 'পৰীক্ষা বাকী সামগ্ৰী',
  rowSellerRequests: 'বিক্ৰেতাৰ অনুৰোধ',
  rowSales: 'বিক্ৰীৰ সাৰাংশ',
  rowShop: 'গ্ৰাহক হিচাপে কিনক',
  rowCategories: 'শ্ৰেণী',
  categoryLabel: 'শ্ৰেণী',
  batchNotice: (shop: string, n: number, category: string) =>
    `${shop} (${category}) এ পৰীক্ষাৰ বাবে ${n}টা নতুন সামগ্ৰী পঠিয়াইছে।`,
  btnReviewNow: 'এতিয়া পৰীক্ষা কৰক',
  btnApproveAll: (n: number) => `সকলো ${n} অনুমোদন`,
  approvedAllDone: (n: number, shop: string) => `${shop} ৰ ${n}টা সামগ্ৰী অনুমোদিত। বিক্ৰেতাক জনোৱা হ'ল।`,
  nothingToReview: 'এই বিক্ৰেতাৰ কোনো সামগ্ৰী বাকী নাই।',
  categoriesTitle: 'শ্ৰেণী:',
  addCategoryHint: 'নতুন শ্ৰেণী যোগ কৰিবলৈ ADDCATEGORY আৰু নাম পঠিয়াওক, উদাহৰণ: ADDCATEGORY Jewellery',
  categoryAdded: (name: string) => `শ্ৰেণী "${name}" যোগ কৰা হ'ল। বিক্ৰেতাসকলে এতিয়া ইয়াক বাছিব পাৰে।`,
  categoryExists: (name: string) => `শ্ৰেণী "${name}" আগৰে পৰা আছে।`,
  sellerRequestCard: (id: number, shop: string, phone: string) =>
    `বিক্ৰেতাৰ অনুৰোধ #${id}\nদোকান: ${shop}\nফোন: ${phone}`,
  salesTitle: 'মাৰ্কেটপ্লেচৰ সাৰাংশ:',
  salesOrders: (orders: number, open: number, delivered: number, cancelled: number) =>
    `অৰ্ডাৰ: ${orders} (চলি থকা ${open}, ডেলিভাৰী ${delivered}, বাতিল ${cancelled})`,
  salesPaid: (amount: number) => `পোৱা পৰিশোধ (UPI আৰু নগদ): ₹${amount}`,
  salesPeople: (sellers: number, customers: number) => `বিক্ৰেতা: ${sellers}, গ্ৰাহক: ${customers}`,
  salesPerSeller: 'প্ৰতিজন বিক্ৰেতাৰ ডেলিভাৰী হোৱা বিক্ৰী:',
  salesNone: 'এতিয়ালৈকে কোনো ডেলিভাৰী হোৱা বিক্ৰী নাই।',
  openOrdersHint: 'এটা বাতিল কৰিবলৈ ADMINCANCEL <অৰ্ডাৰ> পঠিয়াওক।',
  askShop: 'আপোনাৰ দোকানৰ নাম কি? (2 ৰ পৰা 40 আখৰ) নহয় CANCEL পঠিয়াওক।',
  invalidShop: 'দোকানৰ নাম 2 ৰ পৰা 40 আখৰৰ হ\'ব লাগিব। আকৌ পঠিয়াওক, নহয় CANCEL।',
  requested: 'ধন্যবাদ! বিক্ৰেতা হোৱাৰ আপোনাৰ অনুৰোধ এডমিনলৈ পঠিওৱা হ\'ল। সিদ্ধান্ত হ\'লে আপুনি বাৰ্তা পাব।',
  cancelled: 'বাতিল কৰা হ\'ল।',
  alreadySeller: 'আপুনি ইতিমধ্যে বিক্ৰেতা। আপোনাৰ মেনু চাবলৈ SELLER পঠিয়াওক।',
  alreadyPending: 'আপোনাৰ বিক্ৰেতাৰ অনুৰোধ এডমিনৰ ওচৰত আছে। অনুগ্ৰহ কৰি সিদ্ধান্তৰ অপেক্ষা কৰক।',
  adminCannot: 'এডমিনে বিক্ৰেতাৰ বাবে আবেদন কৰিব নোৱাৰে।',
  sellBlocked: 'আপোনাৰ বিক্ৰেতা একাউণ্ট বন্ধ। অনুগ্ৰহ কৰি এডমিনৰ সৈতে যোগাযোগ কৰক।',
  adminNotice: (id: number, shop: string, phone: string) =>
    `নতুন বিক্ৰেতাৰ অনুৰোধ #${id}\nদোকান: ${shop}\nফোন: ${phone}\n"অনুমোদন" বা "নাকচ" টিপক।`,
  notPending: (id: number) => `অনুৰোধ #${id} পোৱা নগ'ল বা সিদ্ধান্তৰ অপেক্ষাত নাই।`,
  decided: (id: number, result: string) =>
    `অনুৰোধ #${id} এতিয়া ${decision('as', result)}। আবেদনকাৰীক জনোৱা হ'ল।`,
  approvedNotice: (shop: string) =>
    `"${shop}" ৰ বাবে আপোনাৰ বিক্ৰেতাৰ অনুৰোধ অনুমোদিত হ'ল। এতিয়া আপোনাৰ প্ৰথম সামগ্ৰী যোগ কৰক।`,
  rejectedNotice: 'আপোনাৰ বিক্ৰেতাৰ অনুৰোধ অনুমোদিত নহ\'ল। আপুনি মেনুৰ পৰা আকৌ আবেদন কৰিব পাৰে।',
  noPending: 'কোনো বিক্ৰেতাৰ অনুৰোধ বাকী নাই।',
  notSeller: (id: number) => `ব্যৱহাৰকাৰী #${id} সক্ৰিয় বিক্ৰেতা নহয়।`,
  notBlocked: (id: number) => `ব্যৱহাৰকাৰী #${id} বন্ধ নহয়।`,
  blocked: (id: number, open: number) =>
    `বিক্ৰেতা #${id} বন্ধ কৰা হ'ল আৰু তেওঁৰ সামগ্ৰী লুকুওৱা হ'ল।` +
    (open > 0 ? ` ${open}টা চলি থকা অৰ্ডাৰ সামগ্ৰী এতিয়াও বাকী। চাবলৈ OPENORDERS ${id} পঠিয়াওক।` : ''),
  unblocked: (id: number) =>
    `বিক্ৰেতা #${id} আকৌ সক্ৰিয়। প্ৰতিটো সামগ্ৰীৰ বাবে SHOW নপঠিওৱালৈকে তেওঁৰ সামগ্ৰী লুকাই থাকিব।`,
  blockedNotice: 'এডমিনে আপোনাৰ বিক্ৰেতা একাউণ্ট বন্ধ কৰিছে। অনুগ্ৰহ কৰি এডমিনৰ সৈতে যোগাযোগ কৰক।',
  unblockedNotice: 'আপোনাৰ বিক্ৰেতা একাউণ্ট আকৌ সক্ৰিয়। আপোনাৰ সামগ্ৰী এতিয়াও লুকুওৱা: প্ৰতিটোৰ বাবে SHOW আৰু সামগ্ৰী নম্বৰ পঠিয়াওক।',
  openOrdersTitle: (sellerId: number) => `বিক্ৰেতা #${sellerId} ৰ চলি থকা অৰ্ডাৰ:`,
  noOpenOrders: (sellerId: number) => `বিক্ৰেতা #${sellerId} ৰ কোনো চলি থকা অৰ্ডাৰ নাই।`,
  orderMissing: (orderId: number) => `অৰ্ডাৰ #${orderId} পোৱা নগ'ল।`,
  cannotAdminCancel: (orderId: number, status: string) =>
    `অৰ্ডাৰ #${orderId} "${mo('as').status(status)}", সেয়েহে বাতিল কৰিব নোৱাৰি।`,
  adminCancelled: (orderId: number) =>
    `অৰ্ডাৰ #${orderId} বাতিল কৰা হ'ল। ষ্টক ঘূৰাই দিয়া হ'ল, আৰু গ্ৰাহক আৰু বিক্ৰেতাক জনোৱা হ'ল।`,
  adminCancelledPaid: (orderId: number, amount: number) =>
    `অৰ্ডাৰ #${orderId} বাতিল কৰা হ'ল। ষ্টক ঘূৰাই দিয়া হ'ল, আৰু গ্ৰাহক আৰু বিক্ৰেতাক জনোৱা হ'ল।\n` +
    `গুৰুত্বপূৰ্ণ: গ্ৰাহকে বিক্ৰেতাক UPI ৰে ₹${amount} দিছে। ধন ঘূৰাই দিয়াৰ ব্যৱস্থা বিক্ৰেতাৰ সৈতে WhatsApp ৰ বাহিৰত কৰক।`,
  makeAdminUsage: 'MAKEADMIN ৰ সৈতে ফোন নম্বৰ পঠিয়াওক, উদাহৰণ: MAKEADMIN 919876543210',
  userNotFound: (phone: string) =>
    `${phone} ফোনৰ কোনো ব্যৱহাৰকাৰী নাই। প্ৰথমে তেওঁক এই WhatsApp নম্বৰলৈ কোনো বাৰ্তা পঠিয়াবলৈ কওক, তাৰ পিছত চেষ্টা কৰক।`,
  alreadyAdmin: (phone: string) => `${phone} ইতিমধ্যে এডমিন।`,
  cannotMakeAdmin: (phone: string) => `${phone} বিক্ৰেতা বা তেওঁৰ বিক্ৰেতাৰ অনুৰোধ আছে। বিক্ৰেতা এডমিন হ'ব নোৱাৰে।`,
  madeAdmin: (phone: string) => `${phone} এতিয়া এডমিন আৰু তেওঁক জনোৱা হ'ল।`,
  newAdminNotice: 'আপুনি এতিয়া এই মাৰ্কেটপ্লেচৰ এডমিন। এডমিন স্ক্ৰীণ চাবলৈ hi পঠিয়াওক।',
  adminProductNotice: (id: number, name: string, price: number, shop: string) =>
    `পৰীক্ষাৰ বাবে নতুন সামগ্ৰী #${id}\n${name} - ₹${price}\nদোকান: ${shop}\nই হাতে বনোৱা নে? "অনুমোদন" বা "নাকচ" টিপক।`,
  noPendingProducts: 'কোনো সামগ্ৰী অনুমোদনৰ অপেক্ষাত নাই।',
  pendingProductsSent: (n: number) => `${n}টা সামগ্ৰী বাকী: সিহঁতৰ ফটো ওপৰত আছে।`,
  productNotFound: (id: number) => `সামগ্ৰী #${id} পোৱা নগ'ল।`,
  productNoPhoto: (id: number) => `সামগ্ৰী #${id} ৰ এতিয়াও ফটো নাই, সেয়েহে অনুমোদন কৰিব নোৱাৰি।`,
  productDecided: (id: number, result: string) =>
    `সামগ্ৰী #${id} এতিয়া ${decision('as', result)}। বিক্ৰেতাক জনোৱা হ'ল।`,
  adminHelp:
    'এডমিন কমাণ্ড (এইবোৰ টাইপো কৰিব পাৰে):\n' +
    'PENDINGPRODUCTS - অনুমোদন বাকী সামগ্ৰী (ফটোৰ সৈতে)\n' +
    'APPROVEPRODUCT 5 / REJECTPRODUCT 5 - সামগ্ৰী #5 ৰ সিদ্ধান্ত\n' +
    'PENDINGSELLERS - বাকী বিক্ৰেতাৰ অনুৰোধ\n' +
    'APPROVE 7 / REJECT 7 - বিক্ৰেতাৰ অনুৰোধ #7 ৰ সিদ্ধান্ত\n' +
    'BLOCK 7 / UNBLOCK 7 - বিক্ৰেতা #7 বন্ধ বা সক্ৰিয় কৰক\n' +
    'OPENORDERS 7 - বিক্ৰেতা #7 ৰ চলি থকা অৰ্ডাৰ\n' +
    'ADMINCANCEL 12 - অৰ্ডাৰ #12 বাতিল কৰক (ডেলিভাৰীৰ আগতে)\n' +
    'MAKEADMIN 919876543210 - সেই ব্যৱহাৰকাৰীক এডমিন কৰক\n' +
    'SALES - মাৰ্কেটপ্লেচৰ মুঠ হিচাপ',
};

export const REG_TEXT = byLang({ en, hi, or, as });
