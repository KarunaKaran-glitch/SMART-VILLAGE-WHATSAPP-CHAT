// Seller messages (English for now; we can translate them later)
export const SELLER_TEXT = {
  help:
    'Seller menu:\n' +
    'ADD - add a new product\n' +
    'MYPRODUCTS - see your products\n' +
    'MYORDERS - see orders for your products\n' +
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
};