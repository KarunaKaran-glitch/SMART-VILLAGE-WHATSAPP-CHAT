// Seller messages (English for now; we can translate them later)
export const SELLER_TEXT = {
  help:
    'Seller menu:\n' +
    'ADD - add a new product\n' +
    'MYPRODUCTS - see your products\n' +
    'PRICE 3 90 - change the price of product #3 to 90\n' +
    'STOCK 3 25 - set the stock of product #3 to 25 (STOCK 3 OFF = unlimited)\n' +
    'HIDE 3 - take product #3 off the menu\n' +
    'SHOW 3 - put product #3 back on the menu\n' +
    'UPI yourname@bank - set the UPI ID customers pay to (UPI alone shows it)\n' +
    'MYORDERS - see orders for your products\n' +
    'RECEIVED 3 - the UPI money for order #3 reached your bank\n' +
    'NOTRECEIVED 3 - the UPI money for order #3 did not arrive\n' +
    'CONFIRM 3 - confirm order #3\n' +
    'SHIP 3 - mark order #3 as shipped\n' +
    'DELIVER 3 - mark order #3 as delivered\n' +
    'MYPURCHASES - orders you placed as a customer\n' +
    'MENU - shop as a customer',
  askName: 'What is the product name? (2 to 60 characters) Or send CANCEL.',
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
    'That does not look like a UPI ID. It looks like yourname@bank. Please send it again, for example: UPI yourname@bank',
  paymentReported: (orderId: number, amount: number, ref: string) =>
    `The customer says they paid ₹${amount} for order #${orderId}.\nUPI transaction number: ${ref}\nCheck your bank or UPI app. If the money is there, send RECEIVED ${orderId}. If not, send NOTRECEIVED ${orderId}.`,
  needPayment: (orderId: number) =>
    `Order #${orderId} is not paid yet. Wait for the customer to pay by UPI, check your bank app, then send RECEIVED ${orderId} before CONFIRM.`,
  receivedDone: (orderId: number) =>
    `Payment for order #${orderId} is marked as received. The customer has been told. Next: CONFIRM ${orderId}.`,
  notReceivedDone: (orderId: number) =>
    `Order #${orderId}: the customer has been told the money did not arrive and was asked to check and send PAID again.`,
  noPaymentWaiting: (orderId: number) =>
    `Order #${orderId} has no UPI payment waiting for your answer. The customer must send PAID first.`,
  upiCurrent: (upi: string | null) =>
    upi
      ? `Your UPI ID: ${upi}\nSend UPI yourname@bank to change it.`
      : 'You have not set a UPI ID yet. Send UPI yourname@bank to set it.',
};