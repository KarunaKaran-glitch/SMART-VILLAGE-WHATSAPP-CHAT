# Smart Village WhatsApp Marketplace

A WhatsApp chatbot backend for a multi-vendor village marketplace. Customers browse products, fill a cart and place orders by sending short text commands. Local sellers list and manage their products, and admins approve sellers, all inside the same WhatsApp chat.

The bot works in five languages: English, Tamil, Hindi, Telugu and Malayalam.

**Stack:** Node.js, TypeScript, Express 5, Prisma 6, PostgreSQL

> **Status: works locally, not live on WhatsApp yet**
> - The full flow is built and tested with fake messages: shopping, one order per seller, UPI payment reporting and confirmation, delivery steps, seller registration and admin tools.
> - Replies are only **printed to the console** for now (`sendReply` in [src/index.ts](src/index.ts)). Sending through the WhatsApp Cloud API is not wired up yet; it waits for Meta business verification.
> - Before going live: verify the `X-Hub-Signature-256` header on incoming webhooks, and use approved message templates for messages sent more than 24 hours after the customer's last message.

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

On Windows PowerShell, define this helper once per terminal (paste it as one line), then send messages with `Send-Msg '917777777777' 'Meena' 'MENU'`:

```powershell
function Send-Msg($phone,$name,$text,$id=('wamid.'+[guid]::NewGuid().ToString())){ $obj=@{entry=@(@{changes=@(@{value=@{contacts=@(@{profile=@{name=$name};wa_id=$phone});messages=@(@{from=$phone;id=$id;type='text';text=@{body=$text}})}})})}; $json=$obj | ConvertTo-Json -Depth 10; Invoke-RestMethod -Uri http://localhost:3000/webhook -Method Post -ContentType "application/json" -Body $json }
```

If PowerShell blocks `npm` or `npx` ("not digitally signed"), use `npm.cmd` and `npx.cmd` instead.

### Make someone an admin

The **first** admin must be set in the database directly, for example with `npx prisma studio`, or:

```sql
UPDATE "User" SET role = 'ADMIN', state = 'BROWSING' WHERE phone = '91XXXXXXXXXX';
```

After that, an admin can make more admins from WhatsApp with `MAKEADMIN <phone>`.

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
| `ORDER` | Place an order from the cart (asks for an address the first time). Creates one order per seller and shows each seller's UPI ID |
| `PAID <order id> <transaction no.>` | Report a UPI payment; the seller is asked to check it (`PAID` alone shows how) |
| `MYORDERS` | Show your last 5 orders with order and payment status |
| `CANCELORDER <id>` | Cancel an order while every item is still pending and no payment has been reported |
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
| `RECEIVED <id>` / `NOTRECEIVED <id>` | Answer a customer's `PAID`: the money reached your bank, or it did not |
| `CONFIRM <id>` → `SHIP <id>` → `DELIVER <id>` | Move your items in an order forward. The customer is told at each step. A UPI order can only be confirmed after `RECEIVED` |
| `MYPURCHASES` | Show orders you placed as a customer |
| `HELP` | Show seller help |

### Admins

| Command | What it does |
|---|---|
| `PENDINGSELLERS` | List seller requests waiting for a decision |
| `APPROVE <user id>` / `REJECT <user id>` | Decide a seller request |
| `BLOCK <user id>` | Remove a seller's role and hide all their products |
| `UNBLOCK <user id>` | Let a blocked seller sell again (their products stay hidden) |
| `OPENORDERS <user id>` | List a seller's orders that are not delivered or cancelled |
| `ADMINCANCEL <order id>` | Cancel any order that is not delivered yet. Stock is returned; if the customer already paid, the admin is told to arrange a refund |
| `MAKEADMIN <phone>` | Make an existing customer an admin (a 10-digit number gets `91` in front) |
| `SALES` | Marketplace totals and delivered sales per seller |
| `HELP` | Show admin help |

## Business rules

- **Stock:** `stock = null` means unlimited. Products that are out of stock or hidden do not appear in `MENU`. Cancelling an order puts the quantities back into stock.
- **Order status:** each order item moves `PENDING`/`PAID` → `CONFIRMED` → `SHIPPED` → `DELIVERED`. The order itself takes a status once all of its items have it.
- **Payments:** [src/paymentConfig.ts](src/paymentConfig.ts) chooses the method for new orders. `UPI_DIRECT` (the current setting) means the customer pays each seller's UPI ID directly. `COD` means cash on delivery, and a COD payment is marked `SUCCESS` when the order is delivered.
- **UPI flow:** payment `INITIATED` → customer sends `PAID` → `AWAITING_CONFIRMATION` → seller sends `RECEIVED` (payment `SUCCESS`, order `PAID`) or `NOTRECEIVED` (back to `INITIATED`). A transaction number can be used for only one payment. Only the UPI ID is stored, never bank account or card numbers.
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
                       cancel, orders, payment, UPI flow, registration, seller, stock)
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

This creates the migration and regenerates the client. `migrate dev` needs an interactive terminal; in scripts or CI, write the migration SQL into a new `prisma/migrations/<timestamp>_<name>/` folder and run `npx prisma migrate deploy` and `npx prisma generate`.
