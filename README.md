# Smart Village WhatsApp Marketplace

A WhatsApp chatbot backend for a multi-vendor marketplace of **handmade products** (bags, handbags and similar). Customers browse products with photos, fill a cart, place orders and pay the seller by UPI ID or QR code, by sending short text commands. Local sellers list their products with a photo, and admins approve sellers and every product, all inside the same WhatsApp chat.

The bot works in four languages: English, Hindi, Odia and Assamese.

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

`GET /shop/<code>?t=<secret>` is the shop web page opened from the [Click here] button: the seller's approved products with photos, – / + quantity, the total and the delivery address ([src/shopPage.ts](src/shopPage.ts), texts in [src/webText.ts](src/webText.ts)). Its [Continue] button calls `POST /shop/<code>/order`, which places one order for that seller (same stock checks and seller notice as the chat order), and the payment details are sent to the customer's WhatsApp.

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

When `WHATSAPP_APP_SECRET` is set in `.env`, the server answers unsigned messages with `Unauthorized`. Use this version instead (run it from the project folder; it reads the secret from `.env` and signs each message):

```powershell
function Send-Msg($phone,$name,$text){ $secret=((Get-Content .env | Where-Object { $_ -match '^\s*WHATSAPP_APP_SECRET\s*=' }) -replace '^\s*WHATSAPP_APP_SECRET\s*=\s*','').Trim().Trim('"').Trim("'"); $obj=@{entry=@(@{changes=@(@{value=@{contacts=@(@{profile=@{name=$name};wa_id=$phone});messages=@(@{from=$phone;id=('wamid.'+[guid]::NewGuid());type='text';text=@{body=$text}})}})})}; $bytes=[Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json -Depth 10 -Compress)); $hmac=New-Object System.Security.Cryptography.HMACSHA256 (,[Text.Encoding]::UTF8.GetBytes($secret)); $sig='sha256='+(-join ($hmac.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') })); Invoke-RestMethod -Uri http://localhost:3000/webhook -Method Post -ContentType 'application/json; charset=utf-8' -Headers @{'X-Hub-Signature-256'=$sig} -Body $bytes }
```

To send a test photo (product photo or UPI QR code), define `Send-Img` the same way and call `Send-Img '918888888888' 'Ravi' 'D:\photos\bag.png'` (`.jpg`, `.png` or `.webp`):

```powershell
function Send-Img($phone,$name,$file){ $ext=[IO.Path]::GetExtension($file).ToLower(); $mime=@{'.png'='image/png';'.jpg'='image/jpeg';'.jpeg'='image/jpeg';'.webp'='image/webp'}[$ext]; if(-not $mime){ Write-Host 'Use a .jpg, .png or .webp photo'; return }; $obj=@{entry=@(@{changes=@(@{value=@{contacts=@(@{profile=@{name=$name};wa_id=$phone});messages=@(@{from=$phone;id=('wamid.'+[guid]::NewGuid());type='image';image=@{id='test';mime_type=$mime;test_data=[Convert]::ToBase64String([IO.File]::ReadAllBytes($file))}})}})})}; $b=[Text.Encoding]::UTF8.GetBytes(($obj|ConvertTo-Json -Depth 10 -Compress)); Invoke-RestMethod -Uri http://localhost:3000/webhook -Method Post -ContentType 'application/json; charset=utf-8' -Body $b }
```

The photo goes in a `test_data` field that the server only accepts while WhatsApp sending is off; live, photos are downloaded from Meta by media ID. Sent photos are printed as `http://localhost:3000/images/<key>` links you can open in a browser.

If PowerShell blocks `npm` or `npx` ("not digitally signed"), use `npm.cmd` and `npx.cmd` instead.

### Going live

Add these to `.env` (never commit them):

| Key | Purpose |
|---|---|
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Turn on real sending (otherwise replies are only printed) |
| `WHATSAPP_APP_SECRET` | Turn on the `X-Hub-Signature-256` check |
| `PUBLIC_BASE_URL` | Public HTTPS address of this server (for example the ngrok URL), so WhatsApp can fetch product photos and QR codes from `/images/<key>` |
| `WHATSAPP_BOT_NUMBER` | The bot's own WhatsApp number with country code (digits only), used to make each seller's shop link `wa.me/<number>?text=Hi <CODE>` |
| `GRAPH_API_VERSION` | Optional, default `v25.0` |

### Make someone an admin

The **first** admin must be set in the database directly, for example with `npx prisma studio`, or:

```sql
UPDATE "User" SET role = 'ADMIN', state = 'BROWSING' WHERE phone = '91XXXXXXXXXX';
```

After that, an admin can make more admins from WhatsApp with `MAKEADMIN <phone>`.

## Chat commands

People mostly **tap**: the bot sends WhatsApp reply buttons (up to 3) and lists (up to 10 rows) for languages, products, quantities, the cart, ordering, the QR code, "I have paid", and the seller's Received / Confirm / Ship / Deliver steps. Only the delivery address (first order) and the seller's product name, price and UPI ID are typed. Every button and list row sends one of the commands below as its id (for example `QR 12`), so typing a command does exactly the same as tapping. Extra tap-only commands: `MAINMENU`, `PRODUCT <id>`, `BUY <id>`, `REMOVEMENU`, `PLACEORDER`, `ORDERINFO <id>`, `MENU <page>`. `PAID <order>` works without a transaction number.

Commands are not case-sensitive. `#` before a number is optional (`SHIP 12` and `SHIP #12` both work).

### Everyone

| Command | What it does |
|---|---|
| `LANG` | Choose the language again |
| `Hi <shop code>` | Open one seller's shop (this is what the seller's link sends). The customer is offered English + the seller's language, then sees that shop's welcome: Shop now, My orders, More options |
| `SHOPNOW` | Get a [Click here] link to the shop's web page. The link holds a secret for this customer, works for 24 hours, and an older link stops working when a new one is made |
| `MENU` | List the approved products (name and price) |
| `<number>` | Pick a product from the menu: the bot sends its photo and price, then send a quantity (1–99) |
| `CART` | Show the cart and its total |
| `REMOVE <line>` | Remove one line from the cart |
| `CLEAR` | Empty the cart |
| `ADDRESS` | Set or change the delivery address |
| `ORDER` | Place an order from the cart (asks for an address the first time). Creates one order per seller and shows each seller's UPI ID |
| `QR <order id>` | Get a QR code to pay that order: the seller's own QR photo, or a QR made from the seller's UPI ID with the amount and note filled in |
| `PAID <order id> <transaction no.>` | Report a UPI payment; the seller is asked to check it (`PAID` alone shows how) |
| `MYORDERS` | Show your last 5 orders with order and payment status |
| `CANCELORDER <id>` | Cancel an order while every item is still pending and no payment has been reported |
| `SELL` | Ask to become a seller (asks for a shop name, then waits for an admin) |
| `CANCEL` | Stop the current step (quantity, address, shop name, new product) |

### Sellers

| Command | What it does |
|---|---|
| `ADD` | Add a handmade product (asks for a name, a price, then a photo). It is hidden until an admin approves it |
| `PHOTO <id>` | Send a new photo for a product (the admin checks it again) |
| `MYPRODUCTS` | List your products with price, stock, approval and visibility |
| `PRICE <id> <amount>` | Change a product's price |
| `STOCK <id> <qty>` / `STOCK <id> OFF` | Set the stock count, or stop tracking stock |
| `HIDE <id>` / `SHOW <id>` | Hide a product from the menu, or show it again |
| `UPI` / `UPI <name@bank>` | Show or set the UPI ID that customers pay |
| `QR` / `QR REMOVE` | Upload a photo of your UPI QR code, or delete it |
| `MYORDERS` | Show the last 10 order items for your products |
| `RECEIVED <id>` / `NOTRECEIVED <id>` | Answer a customer's `PAID`: the money reached your bank, or it did not |
| `CONFIRM <id>` → `SHIP <id>` → `DELIVER <id>` | Move your items in an order forward. The customer is told at each step. A UPI order can only be confirmed after `RECEIVED` |
| `MYPURCHASES` | Show orders you placed as a customer |
| `MYLINK` | Show your shop link to share with customers (asks your shop's state the first time). Customers who open it, or send `Hi <shop code>`, are offered English + your state's language |
| `SHOPSTATE` | Change your shop's state (Odisha, Assam, a Hindi-speaking state, or another state = English only) |
| `HELP` | Show seller help |

### Admins

| Command | What it does |
|---|---|
| `PENDINGPRODUCTS` | Get the photo of every product waiting for approval |
| `APPROVEPRODUCT <id>` / `REJECTPRODUCT <id>` | Show a product to customers, or refuse it (not handmade). Rejecting also hides an approved product |
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

- **Categories:** each seller makes one kind of product (for example Keychains, Handbags, Wallets) and chooses it when applying; every product they add goes into that category. Customers first pick a category, then a product. Admins list categories with `CATEGORIES` and add one with `ADDCATEGORY <name>`.
- **Batch approval:** new products are drafts. When the seller taps "Send all to admin" (`SUBMIT`), each admin gets one message with "Review now" (`REVIEW <seller id>`) and "Approve all" (`APPROVEALL <seller id>`).
- **Handmade only:** a product appears in `MENU` only when it has a photo and an admin has approved it. A new photo sends it back for approval.
- **Photos:** stored in the `Image` table (JPG, PNG or WebP, up to 5 MB) under a random key and served at `GET /images/<key>`.
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
  whatsapp.ts          WhatsApp Cloud API: send text and photos, download photos, signature check
  images.ts            Save and load photos, make UPI QR codes
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
