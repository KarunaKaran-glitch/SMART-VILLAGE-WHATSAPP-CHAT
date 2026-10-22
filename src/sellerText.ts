import { byLang } from './lang';
import { mo } from './myOrdersText';

// Seller messages in every language. Commands (ADD, PRICE 3 90 ...) stay in English letters.
// SELLER_TEXT answers in the language of the person the message is for (see lang.ts).
const en = {
  home: 'Welcome back! What would you like to do with your shop?',
  btnOrders: 'Orders for my shop',
  btnAdd: 'Add a product',
  btnMenu: 'Seller menu',
  menuBody: 'Seller menu: tap "Choose".',
  rowProducts: 'My products',
  rowUpi: 'My UPI ID and QR',
  rowQr: 'Upload my QR photo',
  rowPurchases: 'My own purchases',
  rowShop: 'Shop as a customer',
  rowAllCommands: 'All commands',
  rowCategory: 'My category',
  askDescription: (name: string) => `Add a short description of "${name}": colour, size, material (for example: Red, cotton, 30x25 cm, zip pocket). Or tap Skip.`,
  btnSkip: "Skip",
  invalidDescription: "Please keep the description under 300 characters, or tap Skip.",
  descSet: (id: number) => `Description saved for product #${id}. Customers see it when they select the product.`,
  askCategory: 'What kind of products do you make? Tap "Choose" and pick your category.',
  categorySet: (name: string) =>
    `Your category is now: ${name}. All your new products go into this category.`,
  needCategory: 'First choose what kind of products you make.',
  btnAddAnother: 'Add another product',
  btnSubmit: 'Send all to admin',
  draftSaved: (id: number) =>
    `Product #${id} is saved. Add more products, or tap "Send all to admin" when you have finished.`,
  submitted: (n: number) =>
    `${n} product(s) sent to the admin. You will get a message when they are checked.`,
  nothingToSubmit: 'You have no new products waiting to be sent. Add a product first.',
  approvedAll: (n: number) =>
    `Good news: ${n} of your products were approved and are now on the menu for customers.`,
  help:
    'Seller menu (you can also type these):\n' +
    'ADD - add a new handmade product (name, price, photo)\n' +
    'MYPRODUCTS - see your products and their approval\n' +
    'PHOTO 3 - send a new photo for product #3\n' +
    'PRICE 3 90 - change the price of product #3 to 90\n' +
    'STOCK 3 25 - set the stock of product #3 to 25 (STOCK 3 OFF = unlimited)\n' +
    'HIDE 3 - take product #3 off the menu\n' +
    'SHOW 3 - put product #3 back on the menu\n' +
    'UPI - see your UPI ID; send a UPI ID to change it\n' +
    'QR - send a photo of your UPI QR code (QR REMOVE deletes it)\n' +
    'MYORDERS - see orders for your products\n' +
    'MYPURCHASES - orders you placed as a customer',
  approval: (a: string) =>
    ({ PENDING: 'waiting for admin', APPROVED: 'approved', REJECTED: 'rejected', DRAFT: 'not sent to admin yet' })[a] ?? a,
  noPhoto: (id: number) => `no photo (send PHOTO ${id})`,
  stockLabel: (n: number | null) => `stock: ${n ?? 'unlimited'}`,
  hiddenTag: '(hidden)',
  orderLine: (orderId: number, item: string, total: number, status: string, who: string) =>
    `Order #${orderId} | ${item} = ₹${total} | ${mo('en').status(status)} | ${who}`,
  upiNote: 'Payment: by UPI. Wait for the customer to confirm, then check your bank app.',
  codNote: 'Payment: cash on delivery.',
  deliverTo: 'Deliver to',
  customer: 'Customer',
  askName:
    'What is the product name? Only handmade products can be sold (for example: Jute Handbag). 2 to 60 characters. Or send CANCEL.',
  askPhoto: (id: number, name: string) =>
    `Product #${id} "${name}" is saved. Now send one clear photo of it.\nCustomers will see it after the admin approves it. Or send CANCEL to add the photo later.`,
  askPhotoFor: (id: number) =>
    `Send the new photo for product #${id}. The admin will check the product again. Or send CANCEL.`,
  needPhoto: 'Please send a photo (not text). Or send CANCEL to add it later with PHOTO <product number>.',
  photoFailed: 'Sorry, the photo could not be saved. Please send it again as a normal photo (JPG or PNG, under 5 MB).',
  photoSaved: (id: number) =>
    `Photo saved for product #${id}. The admin will check it (handmade products only). You will get a message when it is approved.`,
  photoLater: (id: number) =>
    `Product #${id} is saved without a photo. Customers will not see it until you send PHOTO ${id} and the admin approves it.`,
  productApproved: (id: number, name: string) =>
    `Good news: product #${id} "${name}" was approved and is now on the menu for customers.`,
  productRejected: (id: number, name: string) =>
    `Product #${id} "${name}" was not approved. Only handmade products can be sold here. Please contact the admin if you have questions.`,
  askQr: 'Send a photo of your UPI QR code (from GPay, PhonePe, Paytm or your bank app). Or send CANCEL.',
  qrNeedPhoto: 'Please send your UPI QR code as a photo, or send CANCEL.',
  qrSaved:
    'Your UPI QR code is saved. Customers can ask for it when they pay.\nTip: pay yourself ₹1 with it once to check that the money reaches your account.',
  qrCancelled: 'Cancelled. Your QR code was not changed.',
  qrRemoved: 'Your UPI QR code photo is removed. Customers will get a QR code made from your UPI ID instead.',
  invalidName: 'The name must be 2 to 60 characters. Try again, or send CANCEL.',
  askPrice: (name: string) =>
    `Price for "${name}" in rupees? Delivery is free for customers, so include your courier cost in the price. Send a number like 80 or 49.50, or CANCEL.`,
  invalidPrice: 'Please send a price above 0, like 80 or 49.50, or CANCEL.',
  added: (id: number, name: string, price: number) =>
    `Product #${id} added: ${name} - ₹${price}.`,
  cancelled: 'Cancelled.',
  noProducts: 'You have no products yet. Tap "Add a product" to add one.',
  myProductsTitle: 'Your products:',
  noOrders: 'No orders for your products yet.',
  myOrdersTitle: 'Latest orders for your products:',
  newOrder: (orderId: number, lines: string[], customer: string) =>
    `New order #${orderId}!\n${lines.join('\n')}\nCustomer: ${customer}`,
  orderNotFound: (orderId: number) => `Order #${orderId} was not found for your products.`,
  cannotChange: (orderId: number, current: string, target: string) =>
    `Order #${orderId} is "${mo('en').status(current)}", so it cannot be changed to "${mo('en').status(target)}". Steps: confirm, then ship, then deliver.`,
  statusUpdated: (orderId: number, status: string) =>
    `Order #${orderId} is now "${mo('en').status(status)}". The customer has been told.`,
  productNotFound: (id: number) =>
    `Product #${id} was not found among your products. Send MYPRODUCTS to see them.`,
  priceUpdated: (id: number, price: number) =>
    `Product #${id} price is now ₹${price}. Orders already placed keep their old price.`,
  hidden: (id: number) => `Product #${id} is hidden from the menu. Send SHOW ${id} to bring it back.`,
  shown: (id: number) => `Product #${id} is back on the menu.`,
  stockSet: (id: number, amount: number | null) =>
    amount === null
      ? `Product #${id} stock is now unlimited.`
      : `Product #${id} stock is now ${amount}.${amount === 0 ? ' It is hidden from customers until you add stock.' : ''}`,
  stockInvalid: 'Please send a stock number from 0 to 100000, or OFF for unlimited.',
  upiSet: (upi: string) =>
    `Your UPI ID is saved: ${upi}\nCustomers will see it when they pay you. Never share your bank account number or card details here.`,
  upiInvalid:
    'That does not look like a UPI ID. It looks like name@bank. Please send your own UPI ID again (as shown in your UPI app).',
  paymentReported: (orderId: number, amount: number, ref: string | null) =>
    `The customer says they paid ₹${amount} for order #${orderId}.\n` +
    (ref
      ? `UPI transaction number: ${ref}\n`
      : `Look for a payment of ₹${amount} with the note "Order ${orderId}".\n`) +
    'Check your bank or UPI app, then tap Received or Not received.',
  needPayment: (orderId: number) =>
    `Order #${orderId} is not paid yet. Wait for the customer to pay by UPI and tap "I have paid", check your bank app, then tap Received.`,
  receivedDone: (orderId: number) =>
    `Payment for order #${orderId} is marked as received. The customer has been told. Next: confirm the order.`,
  notReceivedDone: (orderId: number) =>
    `Order #${orderId}: the customer has been told the money did not arrive and was asked to check and pay again.`,
  noPaymentWaiting: (orderId: number) =>
    `Order #${orderId} has no UPI payment waiting for your answer. The customer must tap "I have paid" first.`,
  upiCurrent: (upi: string | null, hasQr: boolean) =>
    (upi
      ? `Your UPI ID: ${upi}\nTo change it, just send the new UPI ID (as shown in your UPI app).`
      : 'You have not set a UPI ID yet, so customers cannot see your products.\nJust send your UPI ID now (as shown in your GPay, PhonePe or Paytm profile).') +
    (hasQr
      ? '\nYour UPI QR code photo is saved.'
      : '\nNo QR code photo saved; customers get a QR made from your UPI ID.'),
};

const hi: typeof en = {
  home: 'फिर से स्वागत है! अपनी दुकान के लिए क्या करना चाहेंगे?',
  btnOrders: 'मेरी दुकान के ऑर्डर',
  btnAdd: 'उत्पाद जोड़ें',
  btnMenu: 'विक्रेता मेनू',
  menuBody: 'विक्रेता मेनू: "चुनें" पर टैप करें।',
  rowProducts: 'मेरे उत्पाद',
  rowUpi: 'मेरी UPI ID और QR',
  rowQr: 'मेरा QR फोटो भेजें',
  rowPurchases: 'मेरी अपनी खरीदारी',
  rowShop: 'ग्राहक की तरह खरीदें',
  rowAllCommands: 'सभी कमांड',
  rowCategory: 'मेरी श्रेणी',
  askDescription: (name: string) => `"${name}" का छोटा विवरण लिखें: रंग, नाप, सामग्री (जैसे: लाल, सूती, 30x25 cm, ज़िप वाली जेब)। या "छोड़ें" पर टैप करें।`,
  btnSkip: "छोड़ें",
  invalidDescription: "कृपया विवरण 300 अक्षरों से कम रखें, या \"छोड़ें\" पर टैप करें।",
  descSet: (id: number) => `उत्पाद #${id} का विवरण सहेज लिया गया। ग्राहक उत्पाद चुनने पर इसे देखेंगे।`,
  askCategory: 'आप किस तरह के उत्पाद बनाते हैं? "चुनें" पर टैप करके अपनी श्रेणी चुनें।',
  categorySet: (name: string) =>
    `आपकी श्रेणी अब: ${name}। आपके सभी नए उत्पाद इसी श्रेणी में जाएँगे।`,
  needCategory: 'पहले चुनें कि आप किस तरह के उत्पाद बनाते हैं।',
  btnAddAnother: 'एक और उत्पाद',
  btnSubmit: 'सब एडमिन को भेजें',
  draftSaved: (id: number) =>
    `उत्पाद #${id} सहेज लिया गया। और उत्पाद जोड़ें, या पूरा होने पर "सब एडमिन को भेजें" पर टैप करें।`,
  submitted: (n: number) => `${n} उत्पाद एडमिन को भेजे गए। जाँच होने पर आपको संदेश मिलेगा।`,
  nothingToSubmit: 'भेजने के लिए कोई नया उत्पाद नहीं है। पहले उत्पाद जोड़ें।',
  approvedAll: (n: number) =>
    `अच्छी खबर: आपके ${n} उत्पाद मंज़ूर हो गए और अब ग्राहकों के मेनू में हैं।`,
  help:
    'विक्रेता मेनू (ये आप टाइप भी कर सकते हैं):\n' +
    'ADD - नया हस्तनिर्मित उत्पाद जोड़ें (नाम, दाम, फोटो)\n' +
    'MYPRODUCTS - अपने उत्पाद और उनकी मंज़ूरी देखें\n' +
    'PHOTO 3 - उत्पाद #3 का नया फोटो भेजें\n' +
    'PRICE 3 90 - उत्पाद #3 का दाम 90 करें\n' +
    'STOCK 3 25 - उत्पाद #3 का स्टॉक 25 करें (STOCK 3 OFF = असीमित)\n' +
    'HIDE 3 - उत्पाद #3 को मेनू से हटाएँ\n' +
    'SHOW 3 - उत्पाद #3 को मेनू में वापस लाएँ\n' +
    'UPI - अपनी UPI ID देखें; बदलने के लिए नई UPI ID भेजें\n' +
    'QR - अपने UPI QR कोड का फोटो भेजें (QR REMOVE से हटाएँ)\n' +
    'MYORDERS - अपने उत्पादों के ऑर्डर देखें\n' +
    'MYPURCHASES - ग्राहक के रूप में आपके ऑर्डर',
  approval: (a: string) =>
    ({ PENDING: 'एडमिन की मंज़ूरी बाकी', APPROVED: 'मंज़ूर', REJECTED: 'नामंज़ूर', DRAFT: 'एडमिन को अभी नहीं भेजा' })[a] ?? a,
  noPhoto: (id: number) => `फोटो नहीं (PHOTO ${id} भेजें)`,
  stockLabel: (n: number | null) => `स्टॉक: ${n ?? 'असीमित'}`,
  hiddenTag: '(छिपा हुआ)',
  orderLine: (orderId: number, item: string, total: number, status: string, who: string) =>
    `ऑर्डर #${orderId} | ${item} = ₹${total} | ${mo('hi').status(status)} | ${who}`,
  upiNote: 'भुगतान: UPI से। ग्राहक की पुष्टि का इंतज़ार करें, फिर अपना बैंक ऐप देखें।',
  codNote: 'भुगतान: डिलीवरी पर नकद।',
  deliverTo: 'डिलीवरी पता',
  customer: 'ग्राहक',
  askName:
    'उत्पाद का नाम क्या है? केवल हस्तनिर्मित उत्पाद बेचे जा सकते हैं (जैसे: Jute Handbag)। 2 से 60 अक्षर। या CANCEL भेजें।',
  askPhoto: (id: number, name: string) =>
    `उत्पाद #${id} "${name}" सहेज लिया गया। अब उसका एक साफ़ फोटो भेजें।\nएडमिन की मंज़ूरी के बाद ग्राहक इसे देखेंगे। या फोटो बाद में जोड़ने के लिए CANCEL भेजें।`,
  askPhotoFor: (id: number) =>
    `उत्पाद #${id} का नया फोटो भेजें। एडमिन उत्पाद को फिर से जाँचेंगे। या CANCEL भेजें।`,
  needPhoto: 'कृपया फोटो भेजें (टेक्स्ट नहीं)। या बाद में PHOTO <उत्पाद नंबर> से जोड़ने के लिए CANCEL भेजें।',
  photoFailed: 'माफ़ कीजिए, फोटो सहेजा नहीं जा सका। कृपया सामान्य फोटो (JPG या PNG, 5 MB से कम) फिर से भेजें।',
  photoSaved: (id: number) =>
    `उत्पाद #${id} का फोटो सहेज लिया गया। एडमिन इसे जाँचेंगे (केवल हस्तनिर्मित)। मंज़ूरी मिलने पर आपको संदेश मिलेगा।`,
  photoLater: (id: number) =>
    `उत्पाद #${id} बिना फोटो सहेजा गया। जब तक आप PHOTO ${id} नहीं भेजते और एडमिन मंज़ूरी नहीं देते, ग्राहक इसे नहीं देखेंगे।`,
  productApproved: (id: number, name: string) =>
    `अच्छी खबर: उत्पाद #${id} "${name}" मंज़ूर हो गया और अब ग्राहकों के मेनू में है।`,
  productRejected: (id: number, name: string) =>
    `उत्पाद #${id} "${name}" मंज़ूर नहीं हुआ। यहाँ केवल हस्तनिर्मित उत्पाद बेचे जा सकते हैं। सवाल हो तो एडमिन से संपर्क करें।`,
  askQr: 'अपने UPI QR कोड का फोटो भेजें (GPay, PhonePe, Paytm या बैंक ऐप से)। या CANCEL भेजें।',
  qrNeedPhoto: 'कृपया अपना UPI QR कोड फोटो के रूप में भेजें, या CANCEL।',
  qrSaved:
    'आपका UPI QR कोड सहेज लिया गया। ग्राहक भुगतान करते समय इसे माँग सकते हैं।\nसुझाव: एक बार खुद को ₹1 भेजकर जाँचें कि पैसा आपके खाते में आता है।',
  qrCancelled: 'रद्द किया गया। आपका QR कोड नहीं बदला।',
  qrRemoved: 'आपका UPI QR फोटो हटा दिया गया। अब ग्राहकों को आपकी UPI ID से बना QR मिलेगा।',
  invalidName: 'नाम 2 से 60 अक्षर का होना चाहिए। फिर से भेजें, या CANCEL।',
  askPrice: (name: string) =>
    `"${name}" का दाम रुपये में? ग्राहकों के लिए डिलीवरी मुफ़्त है, इसलिए कूरियर का खर्च दाम में जोड़ें। 80 या 49.50 जैसी संख्या भेजें, या CANCEL।`,
  invalidPrice: 'कृपया 0 से ज़्यादा दाम भेजें, जैसे 80 या 49.50, या CANCEL।',
  added: (id: number, name: string, price: number) => `उत्पाद #${id} जोड़ा गया: ${name} - ₹${price}।`,
  cancelled: 'रद्द किया गया।',
  noProducts: 'आपके अभी कोई उत्पाद नहीं हैं। जोड़ने के लिए "उत्पाद जोड़ें" पर टैप करें।',
  myProductsTitle: 'आपके उत्पाद:',
  noOrders: 'आपके उत्पादों के अभी कोई ऑर्डर नहीं हैं।',
  myOrdersTitle: 'आपके उत्पादों के हाल के ऑर्डर:',
  newOrder: (orderId: number, lines: string[], customer: string) =>
    `नया ऑर्डर #${orderId}!\n${lines.join('\n')}\nग्राहक: ${customer}`,
  orderNotFound: (orderId: number) => `ऑर्डर #${orderId} आपके उत्पादों में नहीं मिला।`,
  cannotChange: (orderId: number, current: string, target: string) =>
    `ऑर्डर #${orderId} अभी "${mo('hi').status(current)}" है, इसलिए "${mo('hi').status(target)}" नहीं किया जा सकता। क्रम: पुष्टि, फिर भेजना, फिर डिलीवरी।`,
  statusUpdated: (orderId: number, status: string) =>
    `ऑर्डर #${orderId} अब "${mo('hi').status(status)}" है। ग्राहक को बता दिया गया है।`,
  productNotFound: (id: number) =>
    `उत्पाद #${id} आपके उत्पादों में नहीं मिला। देखने के लिए MYPRODUCTS भेजें।`,
  priceUpdated: (id: number, price: number) =>
    `उत्पाद #${id} का दाम अब ₹${price} है। पहले के ऑर्डर पुराने दाम पर रहेंगे।`,
  hidden: (id: number) => `उत्पाद #${id} मेनू से छिपा दिया गया। वापस लाने के लिए SHOW ${id} भेजें।`,
  shown: (id: number) => `उत्पाद #${id} मेनू में वापस है।`,
  stockSet: (id: number, amount: number | null) =>
    amount === null
      ? `उत्पाद #${id} का स्टॉक अब असीमित है।`
      : `उत्पाद #${id} का स्टॉक अब ${amount} है।${amount === 0 ? ' स्टॉक जोड़ने तक यह ग्राहकों से छिपा रहेगा।' : ''}`,
  stockInvalid: 'कृपया 0 से 100000 तक स्टॉक संख्या भेजें, या असीमित के लिए OFF।',
  upiSet: (upi: string) =>
    `आपकी UPI ID सहेज ली गई: ${upi}\nभुगतान करते समय ग्राहक इसे देखेंगे। यहाँ कभी बैंक खाता नंबर या कार्ड की जानकारी न भेजें।`,
  upiInvalid:
    'यह UPI ID जैसा नहीं लगता। UPI ID name@bank जैसी होती है। कृपया अपनी UPI ID (UPI ऐप में जैसी दिखती है) फिर से भेजें।',
  paymentReported: (orderId: number, amount: number, ref: string | null) =>
    `ग्राहक कहता है कि उसने ऑर्डर #${orderId} के लिए ₹${amount} भेजे हैं।\n` +
    (ref ? `UPI ट्रांजैक्शन नंबर: ${ref}\n` : `₹${amount} का भुगतान "Order ${orderId}" नोट के साथ देखें।\n`) +
    'अपना बैंक या UPI ऐप देखें, फिर "मिल गया" या "नहीं मिला" पर टैप करें।',
  needPayment: (orderId: number) =>
    `ऑर्डर #${orderId} का भुगतान अभी नहीं हुआ। ग्राहक के UPI भुगतान और "मैंने भुगतान किया" का इंतज़ार करें, बैंक ऐप देखें, फिर "मिल गया" पर टैप करें।`,
  receivedDone: (orderId: number) =>
    `ऑर्डर #${orderId} का भुगतान मिल गया दर्ज हुआ। ग्राहक को बता दिया गया। अगला: ऑर्डर की पुष्टि करें।`,
  notReceivedDone: (orderId: number) =>
    `ऑर्डर #${orderId}: ग्राहक को बताया गया कि पैसा नहीं आया, और जाँचकर फिर भुगतान करने को कहा गया।`,
  noPaymentWaiting: (orderId: number) =>
    `ऑर्डर #${orderId} का कोई UPI भुगतान आपके जवाब का इंतज़ार नहीं कर रहा। पहले ग्राहक को "मैंने भुगतान किया" टैप करना होगा।`,
  upiCurrent: (upi: string | null, hasQr: boolean) =>
    (upi
      ? `आपकी UPI ID: ${upi}\nबदलने के लिए बस नई UPI ID भेजें (UPI ऐप में जैसी दिखती है)।`
      : 'आपने अभी UPI ID नहीं दी है, इसलिए ग्राहक आपके उत्पाद नहीं देख सकते।\nअभी अपनी UPI ID भेजें (GPay, PhonePe या Paytm प्रोफ़ाइल में जैसी दिखती है)।') +
    (hasQr ? '\nआपका UPI QR फोटो सहेजा हुआ है।' : '\nQR फोटो नहीं है; ग्राहकों को आपकी UPI ID से बना QR मिलेगा।'),
};

const or: typeof en = {
  home: 'ପୁଣି ସ୍ୱାଗତ! ଆପଣଙ୍କ ଦୋକାନ ପାଇଁ କ\'ଣ କରିବେ?',
  btnOrders: 'ମୋ ଦୋକାନର ଅର୍ଡର',
  btnAdd: 'ଉତ୍ପାଦ ଯୋଡ଼ନ୍ତୁ',
  btnMenu: 'ବିକ୍ରେତା ମେନୁ',
  menuBody: 'ବିକ୍ରେତା ମେନୁ: "ବାଛନ୍ତୁ" ଟ୍ୟାପ୍ କରନ୍ତୁ।',
  rowProducts: 'ମୋ ଉତ୍ପାଦ',
  rowUpi: 'ମୋ UPI ID ଓ QR',
  rowQr: 'ମୋ QR ଫଟୋ ପଠାନ୍ତୁ',
  rowPurchases: 'ମୋ ନିଜ କିଣାକିଣି',
  rowShop: 'ଗ୍ରାହକ ଭାବେ କିଣନ୍ତୁ',
  rowAllCommands: 'ସମସ୍ତ କମାଣ୍ଡ',
  rowCategory: 'ମୋ ବର୍ଗ',
  askDescription: (name: string) => `"${name}" ର ଛୋଟ ବିବରଣୀ ଲେଖନ୍ତୁ: ରଙ୍ଗ, ଆକାର, ସାମଗ୍ରୀ (ଉଦାହରଣ: ଲାଲ, ସୂତା, 30x25 cm, ଜିପ୍ ପକେଟ)। କିମ୍ବା "ଛାଡ଼ନ୍ତୁ" ଟ୍ୟାପ୍ କରନ୍ତୁ।`,
  btnSkip: "ଛାଡ଼ନ୍ତୁ",
  invalidDescription: "ଦୟାକରି ବିବରଣୀ 300 ଅକ୍ଷରରୁ କମ୍ ରଖନ୍ତୁ, କିମ୍ବା \"ଛାଡ଼ନ୍ତୁ\" ଟ୍ୟାପ୍ କରନ୍ତୁ।",
  descSet: (id: number) => `ଉତ୍ପାଦ #${id} ର ବିବରଣୀ ସେଭ୍ ହେଲା। ଗ୍ରାହକ ଉତ୍ପାଦ ବାଛିଲେ ଏହା ଦେଖିବେ।`,
  askCategory: 'ଆପଣ କେଉଁ ପ୍ରକାରର ଉତ୍ପାଦ ତିଆରି କରନ୍ତି? "ବାଛନ୍ତୁ" ଟ୍ୟାପ୍ କରି ଆପଣଙ୍କ ବର୍ଗ ବାଛନ୍ତୁ।',
  categorySet: (name: string) =>
    `ଆପଣଙ୍କ ବର୍ଗ ଏବେ: ${name}। ଆପଣଙ୍କ ସମସ୍ତ ନୂଆ ଉତ୍ପାଦ ଏହି ବର୍ଗରେ ଯିବ।`,
  needCategory: 'ପ୍ରଥମେ ବାଛନ୍ତୁ ଆପଣ କେଉଁ ପ୍ରକାରର ଉତ୍ପାଦ ତିଆରି କରନ୍ତି।',
  btnAddAnother: 'ଆଉ ଏକ ଉତ୍ପାଦ',
  btnSubmit: 'ଆଡମିନଙ୍କୁ ପଠାନ୍ତୁ',
  draftSaved: (id: number) =>
    `ଉତ୍ପାଦ #${id} ସେଭ୍ ହେଲା। ଆଉ ଉତ୍ପାଦ ଯୋଡ଼ନ୍ତୁ, କିମ୍ବା ଶେଷ ହେଲେ "ଆଡମିନଙ୍କୁ ପଠାନ୍ତୁ" ଟ୍ୟାପ୍ କରନ୍ତୁ।`,
  submitted: (n: number) => `${n}ଟି ଉତ୍ପାଦ ଆଡମିନଙ୍କୁ ପଠାଗଲା। ଯାଞ୍ଚ ହେଲେ ଆପଣ ବାର୍ତ୍ତା ପାଇବେ।`,
  nothingToSubmit: 'ପଠାଇବାକୁ କୌଣସି ନୂଆ ଉତ୍ପାଦ ନାହିଁ। ପ୍ରଥମେ ଉତ୍ପାଦ ଯୋଡ଼ନ୍ତୁ।',
  approvedAll: (n: number) =>
    `ଖୁସି ଖବର: ଆପଣଙ୍କ ${n}ଟି ଉତ୍ପାଦ ଅନୁମୋଦିତ ହେଲା ଏବଂ ଏବେ ଗ୍ରାହକଙ୍କ ମେନୁରେ ଅଛି।`,
  help:
    'ବିକ୍ରେତା ମେନୁ (ଏଗୁଡ଼ିକ ଟାଇପ୍ ମଧ୍ୟ କରିପାରିବେ):\n' +
    'ADD - ନୂଆ ହାତତିଆରି ଉତ୍ପାଦ ଯୋଡ଼ନ୍ତୁ (ନାମ, ଦାମ, ଫଟୋ)\n' +
    'MYPRODUCTS - ଆପଣଙ୍କ ଉତ୍ପାଦ ଓ ସେଗୁଡ଼ିକର ଅନୁମୋଦନ ଦେଖନ୍ତୁ\n' +
    'PHOTO 3 - ଉତ୍ପାଦ #3 ର ନୂଆ ଫଟୋ ପଠାନ୍ତୁ\n' +
    'PRICE 3 90 - ଉତ୍ପାଦ #3 ର ଦାମ 90 କରନ୍ତୁ\n' +
    'STOCK 3 25 - ଉତ୍ପାଦ #3 ର ଷ୍ଟକ 25 କରନ୍ତୁ (STOCK 3 OFF = ଅସୀମିତ)\n' +
    'HIDE 3 - ଉତ୍ପାଦ #3 କୁ ମେନୁରୁ ଲୁଚାନ୍ତୁ\n' +
    'SHOW 3 - ଉତ୍ପାଦ #3 କୁ ମେନୁକୁ ଫେରାନ୍ତୁ\n' +
    'UPI - ଆପଣଙ୍କ UPI ID ଦେଖନ୍ତୁ; ବଦଳାଇବାକୁ ନୂଆ UPI ID ପଠାନ୍ତୁ\n' +
    'QR - ଆପଣଙ୍କ UPI QR କୋଡ୍ ର ଫଟୋ ପଠାନ୍ତୁ (QR REMOVE ରେ ହଟାନ୍ତୁ)\n' +
    'MYORDERS - ଆପଣଙ୍କ ଉତ୍ପାଦର ଅର୍ଡର ଦେଖନ୍ତୁ\n' +
    'MYPURCHASES - ଗ୍ରାହକ ଭାବେ ଆପଣଙ୍କ ଅର୍ଡର',
  approval: (a: string) =>
    ({ PENDING: 'ଆଡମିନଙ୍କ ଅନୁମୋଦନ ବାକି', APPROVED: 'ଅନୁମୋଦିତ', REJECTED: 'ପ୍ରତ୍ୟାଖ୍ୟାତ', DRAFT: 'ଆଡମିନଙ୍କୁ ଏପର୍ଯ୍ୟନ୍ତ ପଠାଯାଇନାହିଁ' })[a] ?? a,
  noPhoto: (id: number) => `ଫଟୋ ନାହିଁ (PHOTO ${id} ପଠାନ୍ତୁ)`,
  stockLabel: (n: number | null) => `ଷ୍ଟକ: ${n ?? 'ଅସୀମିତ'}`,
  hiddenTag: '(ଲୁଚାଯାଇଛି)',
  orderLine: (orderId: number, item: string, total: number, status: string, who: string) =>
    `ଅର୍ଡର #${orderId} | ${item} = ₹${total} | ${mo('or').status(status)} | ${who}`,
  upiNote: 'ପେମେଣ୍ଟ: UPI ରେ। ଗ୍ରାହକଙ୍କ ନିଶ୍ଚିତକରଣକୁ ଅପେକ୍ଷା କରନ୍ତୁ, ତା\'ପରେ ବ୍ୟାଙ୍କ ଆପ ଦେଖନ୍ତୁ।',
  codNote: 'ପେମେଣ୍ଟ: ଡେଲିଭରି ସମୟରେ ନଗଦ।',
  deliverTo: 'ଡେଲିଭରି ଠିକଣା',
  customer: 'ଗ୍ରାହକ',
  askName:
    'ଉତ୍ପାଦର ନାମ କ\'ଣ? କେବଳ ହାତତିଆରି ଉତ୍ପାଦ ବିକ୍ରି ହୋଇପାରିବ (ଉଦାହରଣ: Jute Handbag)। 2 ରୁ 60 ଅକ୍ଷର। କିମ୍ବା CANCEL ପଠାନ୍ତୁ।',
  askPhoto: (id: number, name: string) =>
    `ଉତ୍ପାଦ #${id} "${name}" ସେଭ୍ ହେଲା। ଏବେ ଏହାର ଗୋଟିଏ ସ୍ପଷ୍ଟ ଫଟୋ ପଠାନ୍ତୁ।\nଆଡମିନଙ୍କ ଅନୁମୋଦନ ପରେ ଗ୍ରାହକ ଏହାକୁ ଦେଖିବେ। କିମ୍ବା ଫଟୋ ପରେ ଦେବା ପାଇଁ CANCEL ପଠାନ୍ତୁ।`,
  askPhotoFor: (id: number) =>
    `ଉତ୍ପାଦ #${id} ର ନୂଆ ଫଟୋ ପଠାନ୍ତୁ। ଆଡମିନ ଉତ୍ପାଦକୁ ପୁଣି ଯାଞ୍ଚ କରିବେ। କିମ୍ବା CANCEL ପଠାନ୍ତୁ।`,
  needPhoto: 'ଦୟାକରି ଫଟୋ ପଠାନ୍ତୁ (ଲେଖା ନୁହେଁ)। କିମ୍ବା ପରେ PHOTO <ଉତ୍ପାଦ ନମ୍ବର> ରେ ଯୋଡ଼ିବା ପାଇଁ CANCEL ପଠାନ୍ତୁ।',
  photoFailed: 'କ୍ଷମା କରନ୍ତୁ, ଫଟୋ ସେଭ୍ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ସାଧାରଣ ଫଟୋ (JPG ବା PNG, 5 MB ରୁ କମ୍) ପୁଣି ପଠାନ୍ତୁ।',
  photoSaved: (id: number) =>
    `ଉତ୍ପାଦ #${id} ର ଫଟୋ ସେଭ୍ ହେଲା। ଆଡମିନ ଏହାକୁ ଯାଞ୍ଚ କରିବେ (କେବଳ ହାତତିଆରି)। ଅନୁମୋଦନ ହେଲେ ଆପଣ ବାର୍ତ୍ତା ପାଇବେ।`,
  photoLater: (id: number) =>
    `ଉତ୍ପାଦ #${id} ଫଟୋ ବିନା ସେଭ୍ ହେଲା। ଆପଣ PHOTO ${id} ପଠାଇ ଆଡମିନ ଅନୁମୋଦନ ନ କରିବା ପର୍ଯ୍ୟନ୍ତ ଗ୍ରାହକ ଏହାକୁ ଦେଖିବେ ନାହିଁ।`,
  productApproved: (id: number, name: string) =>
    `ଖୁସି ଖବର: ଉତ୍ପାଦ #${id} "${name}" ଅନୁମୋଦିତ ହେଲା ଏବଂ ଏବେ ଗ୍ରାହକଙ୍କ ମେନୁରେ ଅଛି।`,
  productRejected: (id: number, name: string) =>
    `ଉତ୍ପାଦ #${id} "${name}" ଅନୁମୋଦିତ ହେଲା ନାହିଁ। ଏଠାରେ କେବଳ ହାତତିଆରି ଉତ୍ପାଦ ବିକ୍ରି ହୁଏ। ପ୍ରଶ୍ନ ଥିଲେ ଆଡମିନଙ୍କ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।`,
  askQr: 'ଆପଣଙ୍କ UPI QR କୋଡ୍ ର ଫଟୋ ପଠାନ୍ତୁ (GPay, PhonePe, Paytm ବା ବ୍ୟାଙ୍କ ଆପରୁ)। କିମ୍ବା CANCEL ପଠାନ୍ତୁ।',
  qrNeedPhoto: 'ଦୟାକରି ଆପଣଙ୍କ UPI QR କୋଡ୍ ଫଟୋ ଭାବେ ପଠାନ୍ତୁ, କିମ୍ବା CANCEL।',
  qrSaved:
    'ଆପଣଙ୍କ UPI QR କୋଡ୍ ସେଭ୍ ହେଲା। ଗ୍ରାହକ ପଇସା ଦେବା ସମୟରେ ଏହା ମାଗିପାରିବେ।\nପରାମର୍ଶ: ଥରେ ନିଜକୁ ₹1 ପଠାଇ ଯାଞ୍ଚ କରନ୍ତୁ ଯେ ପଇସା ଆପଣଙ୍କ ଖାତାରେ ଆସୁଛି।',
  qrCancelled: 'ବାତିଲ ହେଲା। ଆପଣଙ୍କ QR କୋଡ୍ ବଦଳିଲା ନାହିଁ।',
  qrRemoved: 'ଆପଣଙ୍କ UPI QR ଫଟୋ ହଟାଗଲା। ଏବେ ଗ୍ରାହକ ଆପଣଙ୍କ UPI ID ରୁ ତିଆରି QR ପାଇବେ।',
  invalidName: 'ନାମ 2 ରୁ 60 ଅକ୍ଷର ହେବା ଦରକାର। ପୁଣି ପଠାନ୍ତୁ, କିମ୍ବା CANCEL।',
  askPrice: (name: string) =>
    `"${name}" ର ଦାମ ଟଙ୍କାରେ? ଗ୍ରାହକଙ୍କ ପାଇଁ ଡେଲିଭରି ମାଗଣା, ତେଣୁ କୁରିଅର ଖର୍ଚ୍ଚ ଦାମରେ ଯୋଡ଼ନ୍ତୁ। 80 ବା 49.50 ପରି ସଂଖ୍ୟା ପଠାନ୍ତୁ, କିମ୍ବା CANCEL।`,
  invalidPrice: 'ଦୟାକରି 0 ରୁ ଅଧିକ ଦାମ ପଠାନ୍ତୁ, ଯେପରି 80 ବା 49.50, କିମ୍ବା CANCEL।',
  added: (id: number, name: string, price: number) => `ଉତ୍ପାଦ #${id} ଯୋଡ଼ାଗଲା: ${name} - ₹${price}।`,
  cancelled: 'ବାତିଲ ହେଲା।',
  noProducts: 'ଆପଣଙ୍କର ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଉତ୍ପାଦ ନାହିଁ। ଯୋଡ଼ିବା ପାଇଁ "ଉତ୍ପାଦ ଯୋଡ଼ନ୍ତୁ" ଟ୍ୟାପ୍ କରନ୍ତୁ।',
  myProductsTitle: 'ଆପଣଙ୍କ ଉତ୍ପାଦ:',
  noOrders: 'ଆପଣଙ୍କ ଉତ୍ପାଦର ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ଅର୍ଡର ନାହିଁ।',
  myOrdersTitle: 'ଆପଣଙ୍କ ଉତ୍ପାଦର ସାମ୍ପ୍ରତିକ ଅର୍ଡର:',
  newOrder: (orderId: number, lines: string[], customer: string) =>
    `ନୂଆ ଅର୍ଡର #${orderId}!\n${lines.join('\n')}\nଗ୍ରାହକ: ${customer}`,
  orderNotFound: (orderId: number) => `ଅର୍ଡର #${orderId} ଆପଣଙ୍କ ଉତ୍ପାଦରେ ମିଳିଲା ନାହିଁ।`,
  cannotChange: (orderId: number, current: string, target: string) =>
    `ଅର୍ଡର #${orderId} ଏବେ "${mo('or').status(current)}", ତେଣୁ "${mo('or').status(target)}" କରାଯାଇପାରିବ ନାହିଁ। କ୍ରମ: ନିଶ୍ଚିତ, ତା'ପରେ ପଠାଇବା, ତା'ପରେ ଡେଲିଭରି।`,
  statusUpdated: (orderId: number, status: string) =>
    `ଅର୍ଡର #${orderId} ଏବେ "${mo('or').status(status)}"। ଗ୍ରାହକଙ୍କୁ ଜଣାଇ ଦିଆଗଲା।`,
  productNotFound: (id: number) =>
    `ଉତ୍ପାଦ #${id} ଆପଣଙ୍କ ଉତ୍ପାଦରେ ମିଳିଲା ନାହିଁ। ଦେଖିବା ପାଇଁ MYPRODUCTS ପଠାନ୍ତୁ।`,
  priceUpdated: (id: number, price: number) =>
    `ଉତ୍ପାଦ #${id} ର ଦାମ ଏବେ ₹${price}। ପୂର୍ବ ଅର୍ଡର ପୁରୁଣା ଦାମରେ ରହିବ।`,
  hidden: (id: number) => `ଉତ୍ପାଦ #${id} ମେନୁରୁ ଲୁଚାଗଲା। ଫେରାଇବା ପାଇଁ SHOW ${id} ପଠାନ୍ତୁ।`,
  shown: (id: number) => `ଉତ୍ପାଦ #${id} ମେନୁକୁ ଫେରିଲା।`,
  stockSet: (id: number, amount: number | null) =>
    amount === null
      ? `ଉତ୍ପାଦ #${id} ର ଷ୍ଟକ ଏବେ ଅସୀମିତ।`
      : `ଉତ୍ପାଦ #${id} ର ଷ୍ଟକ ଏବେ ${amount}।${amount === 0 ? ' ଷ୍ଟକ ଯୋଡ଼ିବା ପର୍ଯ୍ୟନ୍ତ ଏହା ଗ୍ରାହକଙ୍କଠାରୁ ଲୁଚି ରହିବ।' : ''}`,
  stockInvalid: 'ଦୟାକରି 0 ରୁ 100000 ମଧ୍ୟରେ ଷ୍ଟକ ସଂଖ୍ୟା ପଠାନ୍ତୁ, କିମ୍ବା ଅସୀମିତ ପାଇଁ OFF।',
  upiSet: (upi: string) =>
    `ଆପଣଙ୍କ UPI ID ସେଭ୍ ହେଲା: ${upi}\nପଇସା ଦେବା ସମୟରେ ଗ୍ରାହକ ଏହା ଦେଖିବେ। ଏଠାରେ କେବେ ବ୍ୟାଙ୍କ ଖାତା ନମ୍ବର ବା କାର୍ଡ ବିବରଣୀ ପଠାନ୍ତୁ ନାହିଁ।`,
  upiInvalid:
    'ଏହା UPI ID ପରି ଲାଗୁନାହିଁ। UPI ID name@bank ପରି ହୁଏ। ଦୟାକରି ଆପଣଙ୍କ UPI ID (UPI ଆପରେ ଯେପରି ଦେଖାଯାଏ) ପୁଣି ପଠାନ୍ତୁ।',
  paymentReported: (orderId: number, amount: number, ref: string | null) =>
    `ଗ୍ରାହକ କହୁଛନ୍ତି ସେ ଅର୍ଡର #${orderId} ପାଇଁ ₹${amount} ଦେଇଛନ୍ତି।\n` +
    (ref ? `UPI ଟ୍ରାନଜାକସନ ନମ୍ବର: ${ref}\n` : `"Order ${orderId}" ନୋଟ ସହ ₹${amount} ର ପେମେଣ୍ଟ ଖୋଜନ୍ତୁ।\n`) +
    'ଆପଣଙ୍କ ବ୍ୟାଙ୍କ ବା UPI ଆପ ଦେଖନ୍ତୁ, ତା\'ପରେ "ମିଳିଲା" ବା "ମିଳିନାହିଁ" ଟ୍ୟାପ୍ କରନ୍ତୁ।',
  needPayment: (orderId: number) =>
    `ଅର୍ଡର #${orderId} ର ପଇସା ଏପର୍ଯ୍ୟନ୍ତ ଆସିନାହିଁ। ଗ୍ରାହକ UPI ରେ ପଇସା ଦେଇ "ମୁଁ ପଇସା ଦେଲି" ଟ୍ୟାପ୍ କରିବା ପର୍ଯ୍ୟନ୍ତ ଅପେକ୍ଷା କରନ୍ତୁ, ବ୍ୟାଙ୍କ ଆପ ଦେଖନ୍ତୁ, ତା'ପରେ "ମିଳିଲା" ଟ୍ୟାପ୍ କରନ୍ତୁ।`,
  receivedDone: (orderId: number) =>
    `ଅର୍ଡର #${orderId} ର ପେମେଣ୍ଟ ମିଳିଲା ବୋଲି ଲେଖାଗଲା। ଗ୍ରାହକଙ୍କୁ ଜଣାଗଲା। ପରବର୍ତ୍ତୀ: ଅର୍ଡର ନିଶ୍ଚିତ କରନ୍ତୁ।`,
  notReceivedDone: (orderId: number) =>
    `ଅର୍ଡର #${orderId}: ଗ୍ରାହକଙ୍କୁ ଜଣାଗଲା ଯେ ପଇସା ଆସିନାହିଁ, ଏବଂ ଯାଞ୍ଚ କରି ପୁଣି ଦେବାକୁ କୁହାଗଲା।`,
  noPaymentWaiting: (orderId: number) =>
    `ଅର୍ଡର #${orderId} ପାଇଁ ଆପଣଙ୍କ ଉତ୍ତରକୁ କୌଣସି UPI ପେମେଣ୍ଟ ଅପେକ୍ଷା କରୁନାହିଁ। ପ୍ରଥମେ ଗ୍ରାହକ "ମୁଁ ପଇସା ଦେଲି" ଟ୍ୟାପ୍ କରିବା ଦରକାର।`,
  upiCurrent: (upi: string | null, hasQr: boolean) =>
    (upi
      ? `ଆପଣଙ୍କ UPI ID: ${upi}\nବଦଳାଇବାକୁ କେବଳ ନୂଆ UPI ID ପଠାନ୍ତୁ (UPI ଆପରେ ଯେପରି ଦେଖାଯାଏ)।`
      : 'ଆପଣ ଏପର୍ଯ୍ୟନ୍ତ UPI ID ଦେଇନାହାନ୍ତି, ତେଣୁ ଗ୍ରାହକ ଆପଣଙ୍କ ଉତ୍ପାଦ ଦେଖିପାରିବେ ନାହିଁ।\nଏବେ ଆପଣଙ୍କ UPI ID ପଠାନ୍ତୁ (GPay, PhonePe ବା Paytm ପ୍ରୋଫାଇଲରେ ଯେପରି ଦେଖାଯାଏ)।') +
    (hasQr ? '\nଆପଣଙ୍କ UPI QR ଫଟୋ ସେଭ୍ ଅଛି।' : '\nQR ଫଟୋ ନାହିଁ; ଗ୍ରାହକ ଆପଣଙ୍କ UPI ID ରୁ ତିଆରି QR ପାଇବେ।'),
};

const as: typeof en = {
  home: 'পুনৰ স্বাগতম! আপোনাৰ দোকানৰ বাবে কি কৰিব বিচাৰে?',
  btnOrders: 'মোৰ দোকানৰ অৰ্ডাৰ',
  btnAdd: 'সামগ্ৰী যোগ কৰক',
  btnMenu: 'বিক্ৰেতা মেনু',
  menuBody: 'বিক্ৰেতা মেনু: "বাছক" টিপক।',
  rowProducts: 'মোৰ সামগ্ৰী',
  rowUpi: 'মোৰ UPI ID আৰু QR',
  rowQr: 'মোৰ QR ফটো পঠিয়াওক',
  rowPurchases: 'মোৰ নিজৰ কিনা বস্তু',
  rowShop: 'গ্ৰাহক হিচাপে কিনক',
  rowAllCommands: 'সকলো কমাণ্ড',
  rowCategory: 'মোৰ শ্ৰেণী',
  askDescription: (name: string) => `"${name}" ৰ চমু বিৱৰণ লিখক: ৰং, আকাৰ, সামগ্ৰী (উদাহৰণ: ৰঙা, কপাহী, 30x25 cm, জিপ পকেট)। নহয় "এৰি দিয়ক" টিপক।`,
  btnSkip: "এৰি দিয়ক",
  invalidDescription: "অনুগ্ৰহ কৰি বিৱৰণ 300 আখৰতকৈ কম ৰাখক, নহয় \"এৰি দিয়ক\" টিপক।",
  descSet: (id: number) => `সামগ্ৰী #${id} ৰ বিৱৰণ সংৰক্ষণ কৰা হ'ল। গ্ৰাহকে সামগ্ৰী বাছিলে ইয়াক দেখিব।`,
  askCategory: 'আপুনি কেনেধৰণৰ সামগ্ৰী বনায়? "বাছক" টিপি আপোনাৰ শ্ৰেণী বাছক।',
  categorySet: (name: string) =>
    `আপোনাৰ শ্ৰেণী এতিয়া: ${name}। আপোনাৰ সকলো নতুন সামগ্ৰী এই শ্ৰেণীত যাব।`,
  needCategory: 'প্ৰথমে বাছক আপুনি কেনেধৰণৰ সামগ্ৰী বনায়।',
  btnAddAnother: 'আৰু এটা সামগ্ৰী',
  btnSubmit: 'এডমিনলৈ পঠিয়াওক',
  draftSaved: (id: number) =>
    `সামগ্ৰী #${id} সংৰক্ষণ কৰা হ'ল। আৰু সামগ্ৰী যোগ কৰক, নহয় শেষ হ'লে "এডমিনলৈ পঠিয়াওক" টিপক।`,
  submitted: (n: number) => `${n}টা সামগ্ৰী এডমিনলৈ পঠিওৱা হ'ল। পৰীক্ষা হ'লে আপুনি বাৰ্তা পাব।`,
  nothingToSubmit: 'পঠিয়াবলৈ কোনো নতুন সামগ্ৰী নাই। প্ৰথমে সামগ্ৰী যোগ কৰক।',
  approvedAll: (n: number) =>
    `সুখবৰ: আপোনাৰ ${n}টা সামগ্ৰী অনুমোদিত হ'ল আৰু এতিয়া গ্ৰাহকৰ মেনুত আছে।`,
  help:
    'বিক্ৰেতা মেনু (এইবোৰ টাইপো কৰিব পাৰে):\n' +
    'ADD - নতুন হাতে বনোৱা সামগ্ৰী যোগ কৰক (নাম, দাম, ফটো)\n' +
    'MYPRODUCTS - আপোনাৰ সামগ্ৰী আৰু অনুমোদন চাওক\n' +
    'PHOTO 3 - সামগ্ৰী #3 ৰ নতুন ফটো পঠিয়াওক\n' +
    'PRICE 3 90 - সামগ্ৰী #3 ৰ দাম 90 কৰক\n' +
    'STOCK 3 25 - সামগ্ৰী #3 ৰ ষ্টক 25 কৰক (STOCK 3 OFF = অসীমিত)\n' +
    'HIDE 3 - সামগ্ৰী #3 মেনুৰ পৰা লুকুৱাওক\n' +
    'SHOW 3 - সামগ্ৰী #3 মেনুলৈ ঘূৰাই আনক\n' +
    'UPI - আপোনাৰ UPI ID চাওক; সলনি কৰিবলৈ নতুন UPI ID পঠিয়াওক\n' +
    'QR - আপোনাৰ UPI QR ক\'ডৰ ফটো পঠিয়াওক (QR REMOVE ৰে আঁতৰাওক)\n' +
    'MYORDERS - আপোনাৰ সামগ্ৰীৰ অৰ্ডাৰ চাওক\n' +
    'MYPURCHASES - গ্ৰাহক হিচাপে আপোনাৰ অৰ্ডাৰ',
  approval: (a: string) =>
    ({ PENDING: 'এডমিনৰ অনুমোদন বাকী', APPROVED: 'অনুমোদিত', REJECTED: 'নাকচ', DRAFT: 'এডমিনলৈ এতিয়াও পঠিওৱা নাই' })[a] ?? a,
  noPhoto: (id: number) => `ফটো নাই (PHOTO ${id} পঠিয়াওক)`,
  stockLabel: (n: number | null) => `ষ্টক: ${n ?? 'অসীমিত'}`,
  hiddenTag: '(লুকুওৱা)',
  orderLine: (orderId: number, item: string, total: number, status: string, who: string) =>
    `অৰ্ডাৰ #${orderId} | ${item} = ₹${total} | ${mo('as').status(status)} | ${who}`,
  upiNote: 'পৰিশোধ: UPI ৰে। গ্ৰাহকৰ নিশ্চিতকৰণৰ অপেক্ষা কৰক, তাৰ পিছত বেংক এপ চাওক।',
  codNote: 'পৰিশোধ: ডেলিভাৰীৰ সময়ত নগদ।',
  deliverTo: 'ডেলিভাৰী ঠিকনা',
  customer: 'গ্ৰাহক',
  askName:
    'সামগ্ৰীৰ নাম কি? কেৱল হাতে বনোৱা সামগ্ৰী বিক্ৰী কৰিব পাৰি (উদাহৰণ: Jute Handbag)। 2 ৰ পৰা 60 আখৰ। নহয় CANCEL পঠিয়াওক।',
  askPhoto: (id: number, name: string) =>
    `সামগ্ৰী #${id} "${name}" সংৰক্ষণ কৰা হ'ল। এতিয়া ইয়াৰ এখন স্পষ্ট ফটো পঠিয়াওক।\nএডমিনে অনুমোদন দিয়াৰ পিছত গ্ৰাহকে ইয়াক দেখিব। নহয় ফটো পিছত দিবলৈ CANCEL পঠিয়াওক।`,
  askPhotoFor: (id: number) =>
    `সামগ্ৰী #${id} ৰ নতুন ফটো পঠিয়াওক। এডমিনে সামগ্ৰীটো আকৌ পৰীক্ষা কৰিব। নহয় CANCEL পঠিয়াওক।`,
  needPhoto: 'অনুগ্ৰহ কৰি ফটো পঠিয়াওক (লিখা নহয়)। নহয় পিছত PHOTO <সামগ্ৰী নম্বৰ> ৰে যোগ কৰিবলৈ CANCEL পঠিয়াওক।',
  photoFailed: 'ক্ষমা কৰিব, ফটোখন সংৰক্ষণ কৰিব পৰা নগ\'ল। অনুগ্ৰহ কৰি সাধাৰণ ফটো (JPG বা PNG, 5 MB তকৈ কম) আকৌ পঠিয়াওক।',
  photoSaved: (id: number) =>
    `সামগ্ৰী #${id} ৰ ফটো সংৰক্ষণ কৰা হ'ল। এডমিনে ইয়াক পৰীক্ষা কৰিব (কেৱল হাতে বনোৱা)। অনুমোদন হ'লে আপুনি বাৰ্তা পাব।`,
  photoLater: (id: number) =>
    `সামগ্ৰী #${id} ফটো অবিহনে সংৰক্ষণ কৰা হ'ল। আপুনি PHOTO ${id} পঠিয়াই এডমিনে অনুমোদন নিদিয়ালৈকে গ্ৰাহকে ইয়াক নেদেখিব।`,
  productApproved: (id: number, name: string) =>
    `সুখবৰ: সামগ্ৰী #${id} "${name}" অনুমোদিত হ'ল আৰু এতিয়া গ্ৰাহকৰ মেনুত আছে।`,
  productRejected: (id: number, name: string) =>
    `সামগ্ৰী #${id} "${name}" অনুমোদিত নহ'ল। ইয়াত কেৱল হাতে বনোৱা সামগ্ৰী বিক্ৰী হয়। প্ৰশ্ন থাকিলে এডমিনৰ সৈতে যোগাযোগ কৰক।`,
  askQr: 'আপোনাৰ UPI QR ক\'ডৰ ফটো পঠিয়াওক (GPay, PhonePe, Paytm বা বেংক এপৰ পৰা)। নহয় CANCEL পঠিয়াওক।',
  qrNeedPhoto: 'অনুগ্ৰহ কৰি আপোনাৰ UPI QR ক\'ড ফটো হিচাপে পঠিয়াওক, নহয় CANCEL।',
  qrSaved:
    'আপোনাৰ UPI QR ক\'ড সংৰক্ষণ কৰা হ\'ল। গ্ৰাহকে ধন দিওঁতে ইয়াক বিচাৰিব পাৰে।\nপৰামৰ্শ: এবাৰ নিজকে ₹1 পঠিয়াই পৰীক্ষা কৰক যে ধন আপোনাৰ একাউণ্টলৈ আহে।',
  qrCancelled: 'বাতিল কৰা হ\'ল। আপোনাৰ QR ক\'ড সলনি হোৱা নাই।',
  qrRemoved: 'আপোনাৰ UPI QR ফটো আঁতৰোৱা হ\'ল। এতিয়া গ্ৰাহকে আপোনাৰ UPI ID ৰ পৰা বনোৱা QR পাব।',
  invalidName: 'নাম 2 ৰ পৰা 60 আখৰৰ হ\'ব লাগিব। আকৌ পঠিয়াওক, নহয় CANCEL।',
  askPrice: (name: string) =>
    `"${name}" ৰ দাম টকাত কিমান? গ্ৰাহকৰ বাবে ডেলিভাৰী বিনামূলীয়া, সেয়েহে কুৰিয়াৰৰ খৰচ দামত যোগ কৰক। 80 বা 49.50 ৰ দৰে সংখ্যা পঠিয়াওক, নহয় CANCEL।`,
  invalidPrice: 'অনুগ্ৰহ কৰি 0 তকৈ বেছি দাম পঠিয়াওক, যেনে 80 বা 49.50, নহয় CANCEL।',
  added: (id: number, name: string, price: number) => `সামগ্ৰী #${id} যোগ কৰা হ'ল: ${name} - ₹${price}।`,
  cancelled: 'বাতিল কৰা হ\'ল।',
  noProducts: 'আপোনাৰ এতিয়ালৈকে কোনো সামগ্ৰী নাই। যোগ কৰিবলৈ "সামগ্ৰী যোগ কৰক" টিপক।',
  myProductsTitle: 'আপোনাৰ সামগ্ৰী:',
  noOrders: 'আপোনাৰ সামগ্ৰীৰ এতিয়ালৈকে কোনো অৰ্ডাৰ নাই।',
  myOrdersTitle: 'আপোনাৰ সামগ্ৰীৰ শেহতীয়া অৰ্ডাৰ:',
  newOrder: (orderId: number, lines: string[], customer: string) =>
    `নতুন অৰ্ডাৰ #${orderId}!\n${lines.join('\n')}\nগ্ৰাহক: ${customer}`,
  orderNotFound: (orderId: number) => `অৰ্ডাৰ #${orderId} আপোনাৰ সামগ্ৰীত পোৱা নগ'ল।`,
  cannotChange: (orderId: number, current: string, target: string) =>
    `অৰ্ডাৰ #${orderId} এতিয়া "${mo('as').status(current)}", সেয়েহে "${mo('as').status(target)}" কৰিব নোৱাৰি। ক্ৰম: নিশ্চিত, তাৰ পিছত পঠিওৱা, তাৰ পিছত ডেলিভাৰী।`,
  statusUpdated: (orderId: number, status: string) =>
    `অৰ্ডাৰ #${orderId} এতিয়া "${mo('as').status(status)}"। গ্ৰাহকক জনোৱা হ'ল।`,
  productNotFound: (id: number) =>
    `সামগ্ৰী #${id} আপোনাৰ সামগ্ৰীত পোৱা নগ'ল। চাবলৈ MYPRODUCTS পঠিয়াওক।`,
  priceUpdated: (id: number, price: number) =>
    `সামগ্ৰী #${id} ৰ দাম এতিয়া ₹${price}। আগৰ অৰ্ডাৰ পুৰণি দামতে থাকিব।`,
  hidden: (id: number) => `সামগ্ৰী #${id} মেনুৰ পৰা লুকুওৱা হ'ল। ঘূৰাই আনিবলৈ SHOW ${id} পঠিয়াওক।`,
  shown: (id: number) => `সামগ্ৰী #${id} মেনুলৈ ঘূৰি আহিল।`,
  stockSet: (id: number, amount: number | null) =>
    amount === null
      ? `সামগ্ৰী #${id} ৰ ষ্টক এতিয়া অসীমিত।`
      : `সামগ্ৰী #${id} ৰ ষ্টক এতিয়া ${amount}।${amount === 0 ? ' ষ্টক যোগ নকৰালৈকে ই গ্ৰাহকৰ পৰা লুকাই থাকিব।' : ''}`,
  stockInvalid: 'অনুগ্ৰহ কৰি 0 ৰ পৰা 100000 লৈ ষ্টক সংখ্যা পঠিয়াওক, নহয় অসীমিতৰ বাবে OFF।',
  upiSet: (upi: string) =>
    `আপোনাৰ UPI ID সংৰক্ষণ কৰা হ'ল: ${upi}\nধন দিওঁতে গ্ৰাহকে ইয়াক দেখিব। ইয়াত কেতিয়াও বেংক একাউণ্ট নম্বৰ বা কাৰ্ডৰ তথ্য নপঠিয়াব।`,
  upiInvalid:
    'এইটো UPI ID যেন লগা নাই। UPI ID name@bank ৰ দৰে হয়। অনুগ্ৰহ কৰি আপোনাৰ UPI ID (UPI এপত যেনেকৈ দেখা যায়) আকৌ পঠিয়াওক।',
  paymentReported: (orderId: number, amount: number, ref: string | null) =>
    `গ্ৰাহকে কৈছে যে অৰ্ডাৰ #${orderId} ৰ বাবে ₹${amount} দিছে।\n` +
    (ref ? `UPI লেনদেন নম্বৰ: ${ref}\n` : `"Order ${orderId}" টোকাৰে ₹${amount} ৰ পৰিশোধ বিচাৰক।\n`) +
    'আপোনাৰ বেংক বা UPI এপ চাওক, তাৰ পিছত "পালোঁ" বা "পোৱা নাই" টিপক।',
  needPayment: (orderId: number) =>
    `অৰ্ডাৰ #${orderId} ৰ ধন এতিয়াও অহা নাই। গ্ৰাহকে UPI ৰে ধন দি "মই ধন দিলোঁ" টিপালৈকে অপেক্ষা কৰক, বেংক এপ চাওক, তাৰ পিছত "পালোঁ" টিপক।`,
  receivedDone: (orderId: number) =>
    `অৰ্ডাৰ #${orderId} ৰ ধন পোৱা বুলি লিখা হ'ল। গ্ৰাহকক জনোৱা হ'ল। পৰৱৰ্তী: অৰ্ডাৰ নিশ্চিত কৰক।`,
  notReceivedDone: (orderId: number) =>
    `অৰ্ডাৰ #${orderId}: গ্ৰাহকক জনোৱা হ'ল যে ধন অহা নাই, আৰু পৰীক্ষা কৰি আকৌ দিবলৈ কোৱা হ'ল।`,
  noPaymentWaiting: (orderId: number) =>
    `অৰ্ডাৰ #${orderId} ৰ বাবে কোনো UPI পৰিশোধ আপোনাৰ উত্তৰৰ অপেক্ষাত নাই। প্ৰথমে গ্ৰাহকে "মই ধন দিলোঁ" টিপিব লাগিব।`,
  upiCurrent: (upi: string | null, hasQr: boolean) =>
    (upi
      ? `আপোনাৰ UPI ID: ${upi}\nসলনি কৰিবলৈ কেৱল নতুন UPI ID পঠিয়াওক (UPI এপত যেনেকৈ দেখা যায়)।`
      : 'আপুনি এতিয়াও UPI ID দিয়া নাই, সেয়েহে গ্ৰাহকে আপোনাৰ সামগ্ৰী দেখা নাপায়।\nএতিয়া আপোনাৰ UPI ID পঠিয়াওক (GPay, PhonePe বা Paytm প্ৰফাইলত যেনেকৈ দেখা যায়)।') +
    (hasQr ? '\nআপোনাৰ UPI QR ফটো সংৰক্ষিত আছে।' : '\nQR ফটো নাই; গ্ৰাহকে আপোনাৰ UPI ID ৰ পৰা বনোৱা QR পাব।'),
};

export const SELLER_TEXT = byLang({ en, hi, or, as });
