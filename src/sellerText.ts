// Seller messages (English for now; we can translate them later)
export const SELLER_TEXT = {
  help:
    'Seller menu:\n' +
    'ADD - add a new handmade product (name, price, photo)\n' +
    'MYPRODUCTS - see your products and their approval\n' +
    'PHOTO 3 - send a new photo for product #3\n' +
    'PRICE 3 90 - change the price of product #3 to 90\n' +
    'STOCK 3 25 - set the stock of product #3 to 25 (STOCK 3 OFF = unlimited)\n' +
    'HIDE 3 - take product #3 off the menu\n' +
    'SHOW 3 - put product #3 back on the menu\n' +
    'UPI yourname@bank - set the UPI ID customers pay to (UPI alone shows it)\n' +
    'QR - send a photo of your UPI QR code (QR REMOVE deletes it)\n' +
    'MYORDERS - see orders for your products\n' +
    'RECEIVED 3 - the UPI money for order #3 reached your bank\n' +
    'NOTRECEIVED 3 - the UPI money for order #3 did not arrive\n' +
    'CONFIRM 3 - confirm order #3\n' +
    'SHIP 3 - mark order #3 as shipped\n' +
    'DELIVER 3 - mark order #3 as delivered\n' +
    'MYPURCHASES - orders you placed as a customer\n' +
    'MENU - shop as a customer',
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
    `Price for "${name}" in rupees? Send a number like 80 or 49.50, or CANCEL.`,
  invalidPrice: 'Please send a price above 0, like 80 or 49.50, or CANCEL.',
  added: (id: number, name: string, price: number) =>
    `Product #${id} added: ${name} - ₹${price}. Send ADD for another, or MENU to see the list.`,
  cancelled: 'Cancelled. Send SELLER to see your menu.',
  noProducts: 'You have no products yet. Send ADD to add one.',
  myProductsTitle: 'Your products:',
  noOrders: 'No orders for your products yet.',
  myOrdersTitle: 'Latest orders for your products:',
  newOrder: (orderId: number, lines: string[], customer: string) =>
    `New order #${orderId}!\n${lines.join('\n')}\nCustomer: ${customer}\nSend MYORDERS to see all your orders.`,
  orderNotFound: (orderId: number) =>
    `Order #${orderId} was not found for your products. Send MYORDERS to see your orders.`,
  cannotChange: (orderId: number, current: string, target: string) =>
    `Order #${orderId} is ${current}, so it cannot be changed to ${target}. Order of steps: CONFIRM, then SHIP, then DELIVER.`,
  statusUpdated: (orderId: number, status: string) =>
    `Order #${orderId} is now ${status}. The customer has been told.`,
  productNotFound: (id: number) =>
    `Product #${id} was not found among your products. Send MYPRODUCTS to see them.`,
  priceUpdated: (id: number, price: number) =>
    `Product #${id} price is now ₹${price}. Orders already placed keep their old price.`,
  hidden: (id: number) =>
    `Product #${id} is hidden from the menu. Send SHOW ${id} to bring it back.`,
  shown: (id: number) => `Product #${id} is back on the menu.`,
  stockSet: (id: number, amount: number | null) =>
    amount === null
      ? `Product #${id} stock is now unlimited.`
      : `Product #${id} stock is now ${amount}.${amount === 0 ? ' It is hidden from customers until you add stock.' : ''}`,
  stockInvalid: 'Please send a stock number from 0 to 100000, or OFF for unlimited.',
  upiSet: (upi: string) =>
    `Your UPI ID is saved: ${upi}\nCustomers will see it when they pay you. Never share your bank account number or card details here.`,
  upiInvalid:
    'That does not look like a UPI ID. It looks like yourname@bank. Please send it again, for example: yourname@okicici',
  paymentReported: (orderId: number, amount: number, ref: string | null) =>
    `The customer says they paid ₹${amount} for order #${orderId}.\n` +
    (ref
      ? `UPI transaction number: ${ref}\n`
      : `Look for a payment of ₹${amount} with the note "Order ${orderId}".\n`) +
    'Check your bank or UPI app, then tap Received or Not received.',
  needPayment: (orderId: number) =>
    `Order #${orderId} is not paid yet. Wait for the customer to pay by UPI, check your bank app, then send RECEIVED ${orderId} before CONFIRM.`,
  receivedDone: (orderId: number) =>
    `Payment for order #${orderId} is marked as received. The customer has been told. Next: CONFIRM ${orderId}.`,
  notReceivedDone: (orderId: number) =>
    `Order #${orderId}: the customer has been told the money did not arrive and was asked to check and send PAID again.`,
  noPaymentWaiting: (orderId: number) =>
    `Order #${orderId} has no UPI payment waiting for your answer. The customer must send PAID first.`,
  upiCurrent: (upi: string | null, hasQr: boolean) =>
    (upi
      ? `Your UPI ID: ${upi}\nTo change it, just send the new UPI ID (for example yourname@okicici).`
      : 'You have not set a UPI ID yet, so customers cannot see your products.\nJust send your UPI ID now, for example: yourname@okicici') +
    (hasQr
      ? '\nYour UPI QR code photo is saved (QR to change it, QR REMOVE to delete it).'
      : '\nNo QR code photo saved. Send QR to add one; otherwise customers get a QR made from your UPI ID.'),
};