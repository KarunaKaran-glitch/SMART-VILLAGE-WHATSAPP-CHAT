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
    (open > 0 ? ` ${open} open order item(s) still need handling.` : ''),
  unblocked: (id: number) =>
    `Seller #${id} is allowed again. Their products stay hidden until they send SHOW for each one.`,
  blockedNotice: 'Your seller account has been blocked by the admin. Please contact the admin.',
  unblockedNotice:
    'Your seller account is active again. Send SELLER to see your menu. Your products are still hidden: send SHOW with a product number to bring each one back.',
  adminHelp:
    'Admin menu:\n' +
    'PENDINGSELLERS - requests waiting\n' +
    'APPROVE 7 - approve request #7\n' +
    'REJECT 7 - reject request #7\n' +
    'BLOCK 7 - block seller #7 and hide their products\n' +
    'UNBLOCK 7 - allow seller #7 again\n' +
    'SALES - totals for the marketplace\n' +
    'MENU - shop as a customer',
};