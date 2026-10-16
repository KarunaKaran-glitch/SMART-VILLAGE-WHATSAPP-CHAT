# Smart Village WhatsApp Marketplace

A WhatsApp chatbot backend for a multi-vendor village marketplace. Customers browse products, fill a cart and place orders by sending short text commands. Local sellers list and manage their products, and admins approve sellers, all inside the same WhatsApp chat.

The bot works in five languages: English, Tamil, Hindi, Telugu and Malayalam.

**Stack:** Node.js, TypeScript, Express 5, Prisma 6, PostgreSQL

> **Status: work in progress**
> - Replies are only **printed to the console** for now (`sendReply` in [src/index.ts](src/index.ts)). Sending through the WhatsApp Cloud API is not wired up yet.
> - The payment flow is being rewritten. `placeOrder` was removed in the last commit, but the `ORDER` command still calls it, so `npm run build` fails until it is added back. The `PAID` command shown to customers in [src/payText.ts](src/payText.ts) is not handled yet either.

## How it works

Meta sends each incoming WhatsApp message to `POST /webhook`. The server:

1. Skips messages it has already handled. Meta can deliver the same message twice, so message IDs are saved in `ProcessedMessage`.
2. Looks up the sender by phone number. A new sender is saved and asked to pick a language.
3. Sends the text to the right handler based on the user's **role** (customer, seller or admin) and **state** (for example `CHOOSING_QUANTITY` or `ENTERING_ADDRESS`). The state is saved in the database, so multi-step conversations survive a server restart.

`GET /webhook` answers Meta's one-time verification check using `VERIFY_TOKEN`.

## Getting started

### Requirements

- Node.js 20 or newer
- A PostgreSQL database

### Setup

```bash
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/marketplace"
VERIFY_TOKEN="any-secret-string-you-also-enter-in-meta"
PORT=3000
```

Run the migrations and generate the Prisma client. The client is written to `src/generated/prisma`, which is git-ignored:

```bash
npx prisma migrate dev
npx prisma generate
```

Optionally add a test seller and two sample products:

```bash
npx ts-node src/seed.ts
```

### Run

```bash
npm run dev      # development, restarts on file changes
npm run build    # compile TypeScript to dist/
npm start        # run the compiled build
```

### Try it without WhatsApp

Send a fake webhook payload with curl. The bot's reply appears in the server console.

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{
        "contacts":[{"profile":{"name":"Test"}}],
        "messages":[{"id":"msg-1","from":"919111111111","text":{"body":"MENU"}}]
      }}]}]}'
```

Use a new `id` for every message. A repeated ID is ignored as a duplicate.

### Make someone an admin

There is no chat command to create the first admin. Set the role in the database directly, for example with `npx prisma studio`, or:

```sql
UPDATE "User" SET role = 'ADMIN', state = 'BROWSING' WHERE phone = '91XXXXXXXXXX';
```

## Chat commands

Commands are not case-sensitive. `#` before a number is optional (`SHIP 12` and `SHIP #12` both work).

### Everyone

| Command | What it does |
|---|---|
| `LANG` | Choose the language again |
| `MENU` | List the products that are available |
| `<number>` | Pick a product from the menu, then send a quantity (1–99) |
| `CART` | Show the cart and its total |
| `REMOVE <line>` | Remove one line from the cart |
| `CLEAR` | Empty the cart |
| `ADDRESS` | Set or change the delivery address |
| `ORDER` | Place an order from the cart (asks for an address the first time) |
| `MYORDERS` | Show your last 5 orders with order and payment status |
| `CANCELORDER <id>` | Cancel an order while every item is still pending |
| `SELL` | Ask to become a seller (asks for a shop name, then waits for an admin) |
| `CANCEL` | Stop the current step (quantity, address, shop name, new product) |

### Sellers

| Command | What it does |
|---|---|
| `ADD` | Add a product (asks for a name, then a price) |
| `MYPRODUCTS` | List your products with price, stock and visibility |
| `PRICE <id> <amount>` | Change a product's price |
| `STOCK <id> <qty>` / `STOCK <id> OFF` | Set the stock count, or stop tracking stock |
| `HIDE <id>` / `SHOW <id>` | Hide a product from the menu, or show it again |
| `UPI` / `UPI <name@bank>` | Show or set the UPI ID that customers pay |
| `MYORDERS` | Show the last 10 order items for your products |
| `CONFIRM <id>` → `SHIP <id>` → `DELIVER <id>` | Move your items in an order forward. The customer is told at each step |
| `MYPURCHASES` | Show orders you placed as a customer |
| `HELP` | Show seller help |

### Admins

| Command | What it does |
|---|---|
| `PENDINGSELLERS` | List seller requests waiting for a decision |
| `APPROVE <user id>` / `REJECT <user id>` | Decide a seller request |
| `BLOCK <user id>` | Remove a seller's role and hide all their products |
| `UNBLOCK <user id>` | Let a blocked seller sell again (their products stay hidden) |
| `SALES` | Marketplace totals and delivered sales per seller |
| `HELP` | Show admin help |

## Business rules

- **Stock:** `stock = null` means unlimited. Products that are out of stock or hidden do not appear in `MENU`. Cancelling an order puts the quantities back into stock.
- **Order status:** each order item moves `PENDING`/`PAID` → `CONFIRMED` → `SHIPPED` → `DELIVERED`. The order itself takes a status once all of its items have it.
- **Payments:** [src/paymentConfig.ts](src/paymentConfig.ts) chooses the method for new orders. `UPI_DIRECT` (the current setting) means the customer pays each seller's UPI ID directly. `COD` means cash on delivery, and a COD payment is marked `SUCCESS` when the order is delivered.
- **Notifications:** customers, sellers and admins get a message when something changes for them (status updates, cancellations, seller requests). If a notification fails, the change is still saved.

## Project structure

```
prisma/
  schema.prisma        Database models: User, Product, ProductTranslation, Cart,
                       CartItem, Order, OrderItem, Payment, ProcessedMessage
  migrations/          SQL migration history
prisma.config.ts       Prisma CLI configuration
src/
  index.ts             Express server, webhook and all command handling
  db.ts                Shared Prisma client
  paymentConfig.ts     Active payment method
  seed.ts              Sample seller and products
  messages.ts          Language menu and main customer texts
  *Text.ts             Translated texts for one feature each (address, cart,
                       cancel, orders, payment, registration, seller, stock)
```

### Adding a language

1. Add an entry to `LANGUAGES`, `WELCOME` and `TEXT` in [src/messages.ts](src/messages.ts).
2. Add the same language code to each `*Text.ts` file.
3. Product names fall back to the default name when a product has no translation for that language.

## Database changes

Edit [prisma/schema.prisma](prisma/schema.prisma), then:

```bash
npx prisma migrate dev --name describe_the_change
```

This creates the migration and regenerates the client.
