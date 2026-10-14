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
    'MYORDERS - see orders for your products\n' +
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
};