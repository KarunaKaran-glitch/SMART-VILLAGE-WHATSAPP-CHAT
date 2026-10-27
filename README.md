# Smart Village WhatsApp Marketplace

A WhatsApp bot and three small web pages for local sellers of **handmade products** (bags, handbags and similar). There is no shared marketplace: every seller has their own shop, and a customer only ever sees the seller whose link or ID they used. The customer flow is modelled on Chennai Metro Rail's WhatsApp ticket bot: say "Hi", pick a language, tap **Shop now**, and a **[Click here]** link opens a web page to choose and pay.

The bot works in four languages: English, Hindi, Odia and Assamese.

**Stack:** Node.js, TypeScript, Express 5, Prisma 6, PostgreSQL

> **Status: works with the Meta test number, not live for the public yet**
> - The whole flow is built and tested on two real phones with sample payment details: the admin adds a seller, the seller adds products and payment details on their dashboard, the admin approves the products, the customer orders and pays on the shop page, the seller confirms and delivers on the dashboard.
> - Meta's test account only delivers to numbers on its allowed recipient list.
> - Before going live: Meta business verification, a real HTTPS server address (instead of ngrok), `WHATSAPP_BOT_NUMBER`, sellers' real UPI IDs and QR photos, and approved message templates for messages sent more than 24 hours after a person's last message.

## How it works

### The people

| Who | Uses | Does |
|---|---|---|
| **Admin** | WhatsApp → **admin dashboard** page | Adds sellers (each gets a unique 4-digit ID), approves or rejects their products |
| **Seller** | WhatsApp → **seller dashboard** page | Adds products with photos, sets UPI ID / QR / state, shares the shop link, handles orders (money received → confirm → ship → deliver) |
| **Customer** | WhatsApp → **shop page** → **payment page** | Opens a seller's shop with its link or `Hi <ID>`, chooses products, pays the seller by UPI, taps "I have paid" |

### Step by step

1. **Admin adds a seller.** The admin sends `DASHBOARD` (or taps *Admin dashboard* in the admin menu) and gets a link to the admin page. The form takes the seller's name, WhatsApp number, shop name, state and what they make. The seller gets a **unique ID** (for example `5915`) and a WhatsApp welcome. That ID is both the seller's key to their dashboard and the shop code customers use.
2. **Seller sets up the shop.** The seller sends `hi` (or their ID) from **their own phone** and gets a link to their dashboard. There they add products (photo from the phone, name, price, description), set their UPI ID and QR photo, and share their shop link (`wa.me/<bot number>?text=Hi 5915`) with a *Share on WhatsApp* button.
3. **Admin approves products** on the admin page (big photo, Approve / Reject). Only approved products with a photo are shown to customers.
4. **Customer shops.** The customer taps the seller's link (or sends `Hi 5915`, or just `5915`), chooses English or the seller's state language, and taps **Shop now** → **Click here**. The shop page shows the seller's products with – / + quantity, the total and the delivery address. **Continue** places the order and opens the payment page: the seller's QR photo (or a QR made with the amount filled in), the UPI ID with Copy, a *Pay with UPI app* button and "I have paid" with the UPI transaction number.
5. **Seller handles the order** on the dashboard. WhatsApp only brings short notices ("New order #45", "The customer says they paid…") with a button that opens the dashboard. On the page the seller taps *Money received* (or *Not received*), then *Confirm order*, *Mark shipped*, *Mark delivered*. The customer gets a WhatsApp message at each step.

### Web pages and links

Every link carries a **secret** (`?t=…`) that belongs to one person and works for **24 hours**. A shop link stops working when the customer asks for a new one; dashboard links in seller notices reuse the current secret while it has 4+ hours left, so an open page keeps working.

| Page | Route | Code |
|---|---|---|
| Shop page | `GET /shop/<ID>?t=<secret>`, order: `POST /shop/<ID>/order` | [src/shopPage.ts](src/shopPage.ts) |
| Payment page | `GET /shop/<ID>/order/<order id>?t=…`, "I have paid": `POST …/paid` | [src/shopPage.ts](src/shopPage.ts) |
| Seller dashboard | `GET /seller?t=…`; `POST /seller/products`, `/seller/products/<id>`, `/seller/settings`, `/seller/orders/<id>` | [src/sellerPage.ts](src/sellerPage.ts) |
| Admin dashboard | `GET /admin?t=…`; `POST /admin/sellers`, `/admin/products/<id>` | [src/adminPage.ts](src/adminPage.ts) |
| Photos | `GET /images/<key>` | [src/images.ts](src/images.ts) |

Texts for the pages are in [src/webText.ts](src/webText.ts) (shop and payment) and [src/dashText.ts](src/dashText.ts) (dashboards), in all four languages.

### The chat

Meta sends each incoming WhatsApp message to `POST /webhook` (`GET /webhook` answers Meta's one-time verification with `VERIFY_TOKEN`). The server skips messages it has already handled (`ProcessedMessage`), looks up the sender by phone number, and answers based on their **role** (customer, seller, admin) and **state** (for example `CHOOSING_LANGUAGE`, `ENTERING_ADDRESS`). Replies are tap buttons, lists or one link button; every button sends a command as its id, so typing the command does the same.

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

### Run

```bash
npm run dev      # development, restarts on file changes
npm run build    # compile TypeScript to dist/
npm start        # run the compiled build
```

If PowerShell blocks `npm` or `npx` ("not digitally signed"), use `npm.cmd` and `npx.cmd` instead.

### WhatsApp and the public address

Add these to `.env` (never commit them):

| Key | Purpose |
|---|---|
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Turn on real sending (otherwise replies are only printed) |
| `WHATSAPP_APP_SECRET` | Turn on the `X-Hub-Signature-256` check |
| `PUBLIC_BASE_URL` | Public HTTPS address of this server (for example the ngrok URL); used in every link the bot sends |
| `WHATSAPP_BOT_NUMBER` | The bot's own WhatsApp number with country code (digits only), for the sellers' shop links `wa.me/<number>?text=Hi <ID>` |
| `GRAPH_API_VERSION` | Optional, default `v25.0` |

While testing with ngrok, every link printed in the console also has an **"On this PC: http://localhost:3000/…"** line. Use that one in a browser on the same computer.

### The first admin

The first admin must be set in the database directly, for example:

```sql
UPDATE "User" SET role = 'ADMIN', state = 'BROWSING' WHERE phone = '91XXXXXXXXXX';
```

After that, an admin can make more admins with `MAKEADMIN <phone>`.

## Testing

### Validation test

[scripts/validate.sh](scripts/validate.sh) runs about 50 checks: wrong input on every page (phone numbers, prices, quantities, addresses, photos, transaction numbers, HTML in names), other people's orders and products, steps in the wrong order, wrong shop codes, languages, seller notices and old links. It starts its own test server on port 3001 with WhatsApp sending off, uses only fake numbers, deletes its test data and stops the server, so your own server on port 3000 can keep running. Run it after every change:

```powershell
& "C:\Program Files\Git\bin\bash.exe" scripts/validate.sh
```

It needs the fake admin `919000000000` to be an ADMIN in the database, and `psql` at `C:\Program Files\PostgreSQL\18\bin` (or set `PSQL`). It ends with `RESULT: n passed, 0 failed`.

### Sending test messages by hand

Without WhatsApp, send fake webhook messages. The bot's reply appears in the server console. On Windows PowerShell, paste this helper once per terminal (run it from the project folder; it signs each message with `WHATSAPP_APP_SECRET` from `.env`, which the server requires when that key is set), then send for example `Send-Msg '919000000000' 'Test Admin' 'DASHBOARD'`:

```powershell
function Send-Msg($phone,$name,$text){ $secret=((Get-Content .env | Where-Object { $_ -match '^\s*WHATSAPP_APP_SECRET\s*=' }) -replace '^\s*WHATSAPP_APP_SECRET\s*=\s*','').Trim().Trim('"').Trim("'"); $obj=@{entry=@(@{changes=@(@{value=@{contacts=@(@{profile=@{name=$name};wa_id=$phone});messages=@(@{from=$phone;id=('wamid.'+[guid]::NewGuid());type='text';text=@{body=$text}})}})})}; $bytes=[Text.Encoding]::UTF8.GetBytes(($obj | ConvertTo-Json -Depth 10 -Compress)); $hmac=New-Object System.Security.Cryptography.HMACSHA256 (,[Text.Encoding]::UTF8.GetBytes($secret)); $sig='sha256='+(-join ($hmac.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') })); Invoke-RestMethod -Uri http://localhost:3000/webhook -Method Post -ContentType 'application/json; charset=utf-8' -Headers @{'X-Hub-Signature-256'=$sig} -Body $bytes }
```

Use only fake phone numbers, UPI IDs and transaction numbers in tests.

## Chat commands

Most people only tap. These commands still exist (not case-sensitive; `#` before a number is optional).

### Customers

| Command | What it does |
|---|---|
| `Hi <ID>` or just `<ID>` | Open that seller's shop (this is what the seller's link sends). English + the seller's state language are offered, then the shop's welcome: Shop now, My orders, More options. A number that is no shop's ID gets "There is no shop with the code …" and clears the previous shop |
| `SHOPNOW` | The [Click here] link to the shop page. `MENU`, `CART`, `ORDER` and a typed number answer the same way (they were the old chat shopping) |
| `LANG` | Choose the language again (only the languages the shop offers) |
| `MYORDERS` / `ORDERINFO <id>` | Your last orders and one order's details |
| `QR <id>` / `PAID <id> <transaction no.>` | Pay an order from WhatsApp (if the payment page was closed) |
| `CANCELORDER <id>` | Cancel an order while it is still pending and no payment has been reported |
| `ADDRESS` | Set or change the delivery address (the shop page fills it in) |

A customer without a shop gets only: "open the shop link your seller sent you, or send Hi and the shop code".

### Sellers

Sellers work on their dashboard. `hi`, `DASHBOARD` or their own ID (from their own phone) send the dashboard link; every seller message has a *My dashboard* button. The older seller chat commands still work: `ADD`, `PHOTO <id>`, `MYPRODUCTS`, `PRICE <id> <amount>`, `STOCK <id> <qty|OFF>`, `HIDE <id>`, `SHOW <id>`, `UPI`, `QR`, `QR REMOVE`, `MYORDERS`, `RECEIVED <id>`, `NOTRECEIVED <id>`, `CONFIRM <id>`, `SHIP <id>`, `DELIVER <id>`, `MYLINK`, `SHOPSTATE`, `SELLER` (menu), `HELP`.

### Admins

| Command | What it does |
|---|---|
| `DASHBOARD` | Link to the admin dashboard (add sellers, approve products) |
| `APPROVEPRODUCT <id>` / `REJECTPRODUCT <id>` | Also sent by the Approve / Reject buttons on the new-product message |
| `PENDINGPRODUCTS`, `PENDINGSELLERS`, `APPROVE <user id>`, `REJECT <user id>` | Check products and seller requests in the chat (`SELL` requests from customers still exist) |
| `BLOCK <user id>` / `UNBLOCK <user id>` | Remove a seller's role and hide all their products / let them sell again |
| `OPENORDERS <user id>`, `ADMINCANCEL <order id>` | A seller's open orders; cancel any undelivered order (stock is returned; if already paid, arrange a refund) |
| `MAKEADMIN <phone>`, `SALES`, `CATEGORIES`, `ADDCATEGORY <name>`, `ADMIN` (menu), `HELP` | |

## Business rules

- **One seller per customer:** a customer belongs to the shop whose link or ID they last opened. The shop page only shows and sells that seller's products.
- **Seller IDs:** 4 random digits, unique, made by the admin page (or when a `SELL` request is approved). The ID is the dashboard key (only from the seller's own phone) and the shop code.
- **Languages:** English plus the language of the seller's state (Odisha → Odia, Assam → Assamese, Hindi-speaking states → Hindi, other states → English only).
- **Handmade only:** a product is shown only when it has a photo and an admin has approved it. A new photo sends it back for approval.
- **Photos:** stored in the `Image` table (JPG, PNG or WebP, up to 5 MB), served at `GET /images/<key>`. The dashboard shrinks phone photos before uploading.
- **Stock:** `stock = null` means not counted. An order takes the stock; cancelling puts it back.
- **Payments:** [src/paymentConfig.ts](src/paymentConfig.ts) sets `UPI_DIRECT`: the customer pays the seller's UPI ID directly; the platform never holds money. Only the UPI ID is stored, never bank or card numbers. A shop without a UPI ID shows "cannot take orders yet".
- **UPI steps:** payment `INITIATED` → customer taps "I have paid" (`AWAITING_CONFIRMATION`) → seller: *Money received* (`SUCCESS`, order `PAID`) or *Not received* (back to `INITIATED`). A transaction number can be used for only one payment. An order can only be confirmed after the money is received.
- **Order steps:** `PENDING`/`PAID` → `CONFIRMED` → `SHIPPED` → `DELIVERED`, each step only from the one before.
- **Notifications:** customers get WhatsApp messages for news they cannot see on the page (payment received, confirmed, shipped, delivered); sellers get short notices with a dashboard button. If a notification fails, the change is still saved.

## Project structure

```
prisma/
  schema.prisma        Database models: User, Category, Product, ProductTranslation, Cart,
                       CartItem, Order, OrderItem, Payment, Image, ProcessedMessage
  migrations/          SQL migration history
assets/
  status/              Pictures sent with the customer's order updates (payment successful,
                       confirmed, shipped, delivered), served at /assets/status/...
scripts/
  validate.sh          The validation test (see Testing)
  validate-cleanup.sh  Removes the validation test's data
src/
  index.ts             Express server, webhook and chat handling, all web page routes
  shopPage.ts          Shop page (photo grid, cart bar) and payment page (QR, UPI, order progress)
  pageKit.ts           Shared look of all pages (app style, icons) and small HTML helpers
  sellerPage.ts        Seller dashboard
  adminPage.ts         Admin dashboard
  whatsapp.ts          WhatsApp Cloud API: send text, photos, buttons and links; signature check
  images.ts            Save and load photos, UPI payment links and QR codes
  lang.ts              Current language (and shop) of the person a message is written for
  db.ts                Shared Prisma client
  paymentConfig.ts     Active payment method
  seed.ts              Sample seller and handmade products (npx ts-node src/seed.ts)
  messages.ts          Language list and a few customer texts
  *Text.ts             Translated texts for one feature each (buttons, dashboards, web pages,
                       shop link, address, orders, payment, UPI steps, cancel, registration,
                       seller, stock)
```

### Adding a language

1. Add an entry to `LANGUAGES` and `CHOOSE_LANGUAGE` in [src/messages.ts](src/messages.ts).
2. Add the same language code to each `*Text.ts` file.
3. Product names fall back to the default name when a product has no translation for that language.

## Database changes

Edit [prisma/schema.prisma](prisma/schema.prisma), then:

```bash
npx prisma migrate dev --name describe_the_change
```

This creates the migration and regenerates the client. `migrate dev` needs an interactive terminal; in scripts, write the migration SQL into a new `prisma/migrations/<timestamp>_<name>/` folder and run `npx prisma migrate deploy` and `npx prisma generate`.
