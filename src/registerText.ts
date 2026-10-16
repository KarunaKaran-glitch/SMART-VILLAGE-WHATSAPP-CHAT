// Seller registration and admin messages (English for now)
export const REG_TEXT = {
  askShop: 'What is your shop name? (2 to 40 characters) Or send CANCEL.',
  invalidShop: 'The shop name must be 2 to 40 characters. Try again, or send CANCEL.',
  requested:
    'Thank you! Your request to become a seller has been sent to the admin. You will get a message when it is decided.',
  cancelled: 'Cancelled. Reply MENU to see products.',
  alreadySeller: 'You are already a seller. Send SELLER to see your menu.',
  alreadyPending: 'Your seller request is waiting for the admin. Please wait for the decision.',
  adminCannot: 'Admins cannot apply as sellers.',
  sellBlocked: 'Your seller account is blocked. Please contact the admin.',
  adminNotice: (id: number, shop: string, phone: string) =>
    `New seller request #${id}\nShop: ${shop}\nPhone: ${phone}\nSend APPROVE ${id} or REJECT ${id}.`,
  notPending: (id: number) =>
    `Request #${id} was not found or is not waiting for a decision. Send PENDINGSELLERS to see the waiting requests.`,
  decided: (id: number, result: string) =>
    `Request #${id} is now ${result}. The applicant has been told.`,
  approvedNotice: (shop: string) =>
    `Your seller request for "${shop}" was approved. Send SELLER to see your seller menu, and ADD to add your first product.`,
  rejectedNotice: 'Your seller request was not approved. You can send SELL to apply again.',
  noPending: 'No seller requests are waiting.',
  pendingTitle: 'Seller requests waiting:',
  notSeller: (id: number) => `User #${id} is not an active seller.`,
  notBlocked: (id: number) => `User #${id} is not blocked.`,
  blocked: (id: number, open: number) =>
    `Seller #${id} is blocked and their products are hidden.` +
    (open > 0
      ? ` ${open} open order item(s) still need handling. Send OPENORDERS ${id} to see them.`
      : ''),
  unblocked: (id: number) =>
    `Seller #${id} is allowed again. Their products stay hidden until they send SHOW for each one.`,
  blockedNotice: 'Your seller account has been blocked by the admin. Please contact the admin.',
  unblockedNotice:
    'Your seller account is active again. Send SELLER to see your menu. Your products are still hidden: send SHOW with a product number to bring each one back.',
  openOrdersTitle: (sellerId: number) => `Open orders of seller #${sellerId}:`,
  noOpenOrders: (sellerId: number) => `Seller #${sellerId} has no open orders.`,
  orderMissing: (orderId: number) => `Order #${orderId} was not found.`,
  cannotAdminCancel: (orderId: number, status: string) =>
    `Order #${orderId} is ${status}, so it cannot be cancelled.`,
  adminCancelled: (orderId: number) =>
    `Order #${orderId} is cancelled. Stock was returned, and the customer and seller have been told.`,
  adminCancelledPaid: (orderId: number, amount: number) =>
    `Order #${orderId} is cancelled. Stock was returned, and the customer and seller have been told.\n` +
    `IMPORTANT: the customer already paid ₹${amount} to the seller by UPI. Arrange the refund with the seller outside WhatsApp.`,
  makeAdminUsage: 'Send MAKEADMIN with the phone number, for example: MAKEADMIN 919876543210',
  userNotFound: (phone: string) =>
    `No user with phone ${phone}. Ask them to send any message to this WhatsApp number first, then try again.`,
  alreadyAdmin: (phone: string) => `${phone} is already an admin.`,
  cannotMakeAdmin: (phone: string) =>
    `${phone} is a seller or has a seller request. A seller cannot also be an admin.`,
  madeAdmin: (phone: string) => `${phone} is now an admin and has been told.`,
  newAdminNotice: 'You are now an admin of this marketplace. Send ADMIN to see the admin menu.',
  adminProductNotice: (id: number, name: string, price: number, shop: string) =>
    `New product #${id} to check\n${name} - ₹${price}\nShop: ${shop}\nIs it handmade? Send APPROVEPRODUCT ${id} or REJECTPRODUCT ${id}.`,
  noPendingProducts: 'No products are waiting for approval.',
  pendingProductsSent: (n: number) =>
    `${n} product(s) waiting: their photos are above. Send APPROVEPRODUCT <number> or REJECTPRODUCT <number>.`,
  productNotFound: (id: number) => `Product #${id} was not found.`,
  productNoPhoto: (id: number) =>
    `Product #${id} has no photo yet, so it cannot be approved. The seller must send PHOTO ${id} first.`,
  productDecided: (id: number, result: string) =>
    `Product #${id} is now ${result}. The seller has been told.`,
  adminHelp:
    'Admin menu:\n' +
    'PENDINGPRODUCTS - new products waiting for approval (with photos)\n' +
    'APPROVEPRODUCT 5 - show product #5 to customers\n' +
    'REJECTPRODUCT 5 - refuse product #5 (not handmade); also hides an approved one\n' +
    'PENDINGSELLERS - requests waiting\n' +
    'APPROVE 7 - approve request #7\n' +
    'REJECT 7 - reject request #7\n' +
    'BLOCK 7 - block seller #7 and hide their products\n' +
    'UNBLOCK 7 - allow seller #7 again\n' +
    'OPENORDERS 7 - open orders of seller #7\n' +
    'ADMINCANCEL 12 - cancel order #12 (not yet delivered)\n' +
    'MAKEADMIN 919876543210 - make that user an admin\n' +
    'SALES - totals for the marketplace\n' +
    'MENU - shop as a customer',
};