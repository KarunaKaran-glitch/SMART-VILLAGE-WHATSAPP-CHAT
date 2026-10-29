#!/usr/bin/env bash
# Validation test: about 50 checks of the chat, the admin page, the seller dashboard, the shop
# page and the payment page (wrong input, other people's data, old links, steps in the wrong order).
#
# It starts its own test server on port 3001 with WhatsApp sending OFF, uses only fake numbers
# (919000000000 as admin, 9195000000 71-75 as sellers/customers), deletes its test data at the end
# and stops the server. Your own server on port 3000 can keep running.
#
# Run from the project folder in Git Bash:   bash scripts/validate.sh
# From PowerShell:   & "C:\Program Files\Git\bin\bash.exe" scripts/validate.sh
# Needs: the local database from .env reachable with psql (set PSQL if psql is elsewhere),
# and the fake admin 919000000000 to be an ADMIN.
cd "$(dirname "$0")/.."
SP="$(mktemp -d)"
LOG="$SP/val.log"
PSQL="${PSQL:-/c/Program Files/PostgreSQL/18/bin/psql.exe}"
DB="${VALIDATE_DB:-postgresql://postgres:postgres@localhost:5432/smart-village}"
B=http://localhost:3001
export PATH="/c/Program Files/nodejs:$PATH"

cleanup() { PSQL="$PSQL" DB="$DB" bash scripts/validate-cleanup.sh; }
stop_server() {
  if [ -n "$SERVER_PID" ]; then kill "$SERVER_PID" 2>/dev/null; fi
  powershell -NoProfile -Command '$p=(Get-NetTCPConnection -LocalPort 3001 -State Listen -EA SilentlyContinue).OwningProcess; if($p){Stop-Process -Id $p -Force}' 2>/dev/null
}
# The test logs in as the fake admin, which makes a new admin link and so ends the one you are
# using in your browser. Its link is saved here and put back at the end, so your admin page keeps working.
ADMIN_TOKEN=""
restore_admin() {
  [ -n "$ADMIN_TOKEN" ] || return 0
  "$PSQL" "$DB" -qtAc "update \"User\" set \"dashToken\" = nullif(split_part('$ADMIN_TOKEN','|',1),''), \"dashTokenAt\" = nullif(split_part('$ADMIN_TOKEN','|',2),'')::timestamp where phone='919000000000'" >/dev/null
}
trap 'stop_server; cleanup; restore_admin; rm -rf "$SP"' EXIT

if [ "$("$PSQL" "$DB" -tAc "select role from \"User\" where phone='919000000000'")" != "ADMIN" ]; then
  echo "The fake admin 919000000000 is missing or not an ADMIN. Make it an admin first."; exit 1
fi
ADMIN_TOKEN=$("$PSQL" "$DB" -tAc "select coalesce(\"dashToken\",'') || '|' || coalesce(\"dashTokenAt\"::text,'') from \"User\" where phone='919000000000'")
cleanup
echo "Starting a test server on port 3001 (sending off) ..."
PORT=3001 WHATSAPP_TOKEN= WHATSAPP_PHONE_NUMBER_ID= WHATSAPP_APP_SECRET= WHATSAPP_BOT_NUMBER=15556478208 \
  PUBLIC_BASE_URL=http://localhost:3001 npx.cmd ts-node --transpile-only src/index.ts > "$LOG" 2>&1 &
SERVER_PID=$!
for i in $(seq 1 60); do curl -s $B/ >/dev/null && break; sleep 1; done
curl -s $B/ >/dev/null || { echo "Test server did not start:"; tail -20 "$LOG"; exit 1; }

pass=0; fail=0
ok()   { if [ "$1" = "1" ]; then echo "PASS  $2"; pass=$((pass+1)); else echo "FAIL  $2"; fail=$((fail+1)); fi; }
has()  { echo "$1" | grep -q -- "$2" && echo 1 || echo 0; }
sql()  { "$PSQL" "$DB" -tAc "$1"; }
msg()  { curl -s -o /dev/null -X POST $B/webhook -H 'Content-Type: application/json' -d "{\"entry\":[{\"changes\":[{\"value\":{\"contacts\":[{\"profile\":{\"name\":\"Tester\"}}],\"messages\":[{\"from\":\"$1\",\"id\":\"v$RANDOM$RANDOM\",\"type\":\"text\",\"text\":{\"body\":\"$2\"}}]}}]}]}"; sleep 0.7; }
# reply printed for the last message (everything after the last "Message from")
last() { awk '/^Message from:/{buf=""} {buf=buf"\n"$0} END{print buf}' "$LOG"; }
post() { curl -s -w ' %{http_code}' -X POST "$B$1" -H 'Content-Type: application/json' --data-binary "$2"; }
tok()  { grep -o "$1" "$LOG" | tail -1 | sed 's/.*t=//'; }

ADM=919000000000; SA=919500000071; SB=919500000072; C=919500000073; D=919500000074

echo "== Setup: admin page, two fake sellers"
msg $ADM DASHBOARD; AT=$(tok 'localhost:3001/admin?t=[^ ]*')
r=$(post /admin/sellers "{\"t\":\"$AT\",\"name\":\"  Test   Maker\\nA \",\"phone\":\"09500000071\",\"shopName\":\"Shop  A\",\"sellerState\":\"Rajasthan\",\"categoryId\":2}")
ok $(has "$r" '"ok":true') "admin: number with 0 in front (09500000071) accepted"
IDA=$(sql "select \"shopCode\" from \"User\" where phone='$SA'")
ok $([ "$(sql "select name from \"User\" where phone='$SA'")" = "Test Maker A" ] && echo 1 || echo 0) "admin: extra spaces and line break in the name tidied"
r=$(post /admin/sellers "{\"t\":\"$AT\",\"name\":\"<b>Bad</b>\",\"phone\":\"+91 95000 00072\",\"shopName\":\"Shop B\",\"sellerState\":\"Assam\",\"categoryId\":2}")
ok $(has "$r" '"ok":true') "admin: number written +91 95000 00072 accepted"
IDB=$(sql "select \"shopCode\" from \"User\" where phone='$SB'")
ok $(has "$(post /admin/sellers "{\"t\":\"$AT\",\"name\":\"X Y\",\"phone\":\"12345\",\"shopName\":\"Shop X\",\"sellerState\":\"Assam\",\"categoryId\":2}")" ' 400') "admin: short number refused"
ok $(has "$(post /admin/sellers "{\"t\":\"$AT\",\"name\":\"X Y\",\"phone\":\"9500000073\",\"shopName\":\"Shop X\",\"categoryId\":2}")" 'choose the state') "admin: seller without a state refused"
ok $(has "$(post /admin/sellers "{\"t\":\"$AT\",\"name\":\"X Y\",\"phone\":\"9500000073\",\"shopName\":\"Shop X\",\"sellerState\":\"Odisha\",\"newCategory\":\"P\"}")" 'type the product type') "admin: 'Others' with a 1-letter product type refused"
ok $(has "$(post /admin/sellers "{\"t\":\"$AT\",\"name\":\"X Y\",\"phone\":\"9500000071\",\"shopName\":\"Shop X\",\"sellerState\":\"Assam\",\"categoryId\":2}")" 'already a seller') "admin: same number twice refused"
page=$(curl -s "$B/admin?t=$AT")
ok $(has "$page" '&lt;b&gt;Bad&lt;/b&gt;') "admin page: HTML in a name is shown as text, not run"

echo "== Seller A dashboard"
msg $SA "$IDA"; ST=$(tok 'localhost:3001/seller?t=[^ ]*')
ok $([ -n "$ST" ] && echo 1 || echo 0) "seller: own ID without Hi opens the dashboard"
KEY=$(sql "select \"imageKey\" from \"Product\" where \"imageKey\" is not null order by id limit 1")
curl -s "$B/images/$KEY" -o "$SP/v.img"; MIME=$(curl -s -o /dev/null -w "%{content_type}" "$B/images/$KEY")
printf '{"t":"%s","name":"<i>Red</i> Bag","price":"450","photo":"data:%s;base64,%s"}' "$ST" "$MIME" "$(base64 -w0 "$SP/v.img")" > "$SP/vp.json"
r=$(post /seller/products "@$SP/vp.json"); PID=$(echo "$r" | grep -o '"id":[0-9]*' | cut -d: -f2)
ok $(has "$r" '"ok":true') "seller: product with photo added"
ok $(has "$(post /seller/products "{\"t\":\"$ST\",\"name\":\"Bag\",\"price\":\"abc\",\"photo\":\"data:$MIME;base64,$(base64 -w0 "$SP/v.img" | head -c 0)\"}")" ' 400') "seller: price 'abc' refused"
printf '{"t":"%s","name":"Bag","price":"100001","photo":"data:%s;base64,%s"}' "$ST" "$MIME" "$(base64 -w0 "$SP/v.img")" > "$SP/vp2.json"
ok $(has "$(post /seller/products "@$SP/vp2.json")" ' 400') "seller: price above 1,00,000 refused"
printf '{"t":"%s","name":"Bag","price":"100","description":"%s","photo":"data:%s;base64,%s"}' "$ST" "$(printf 'x%.0s' $(seq 1 301))" "$MIME" "$(base64 -w0 "$SP/v.img")" > "$SP/vp3.json"
ok $(has "$(post /seller/products "@$SP/vp3.json")" '300') "seller: description over 300 letters refused"
ok $(has "$(post /seller/settings "{\"t\":\"$ST\",\"sellerState\":\"Tamil Nadu\"}")" ' 400') "seller: state not in the list refused"
ok $(has "$(post /seller/settings "{\"t\":\"$ST\",\"qr\":\"data:image/png;base64,aGVsbG8=\"}")" ' 400') "seller: fake QR photo refused"
ok $(has "$(post /seller/products/26 "{\"t\":\"$ST\",\"price\":1,\"stock\":null}")" ' 404') "seller: cannot change another seller's product"
ok $(has "$(post /admin/sellers "{\"t\":\"$ST\",\"name\":\"X Y\",\"phone\":\"9500000079\",\"shopName\":\"S\",\"sellerState\":\"Assam\",\"categoryId\":2}")" ' 403') "seller link cannot be used on the admin page"
sql "update \"Product\" set approval='APPROVED', stock=2 where id=$PID" >/dev/null
page=$(curl -s "$B/seller?t=$ST")
ok $(has "$page" '&lt;i&gt;Red&lt;/i&gt; Bag') "seller page: HTML in a product name is shown as text"

echo "== Customer C: shop without UPI ID"
msg $C "Hi $IDA"; msg $C 2; msg $C SHOPNOW; CT=$(tok "localhost:3001/shop/$IDA?t=[^ ]*")
page=$(curl -s "$B/shop/$IDA?t=$CT")
ok $(has "$page" 'warnbox') "shop page: no UPI ID -> 'cannot take orders yet' notice"
ok $([ "$(echo "$page" | grep -c 'id="go"')" = "0" ] && echo 1 || echo 0) "shop page: no UPI ID -> no Continue button"
ok $(has "$(post /shop/$IDA/order "{\"t\":\"$CT\",\"items\":[{\"id\":$PID,\"qty\":1}],\"address\":\"12 Temple Street, Puri 752001\"}")" ' 409') "order refused while the seller has no UPI ID"
post /seller/settings "{\"t\":\"$ST\",\"upi\":\"sampleseller@fakebank\"}" >/dev/null
page=$(curl -s "$B/shop/$IDA?t=$CT")
ok $(has "$page" 'id="go"') "shop page: with UPI ID the Continue button is back"

echo "== Order inputs"
o() { post /shop/$IDA/order "{\"t\":\"$CT\",\"items\":$1,\"address\":\"$2\"}"; }
ok $(has "$(o "[{\"id\":$PID,\"qty\":0}]" '12 Temple Street, Puri 752001')" ' 400') "order: quantity 0 refused"
ok $(has "$(o "[{\"id\":$PID,\"qty\":100}]" '12 Temple Street, Puri 752001')" ' 400') "order: quantity 100 refused"
ok $(has "$(o "[{\"id\":$PID,\"qty\":\"2x\"}]" '12 Temple Street, Puri 752001')" ' 400') "order: quantity '2x' refused"
ok $(has "$(o "[{\"id\":26,\"qty\":1}]" '12 Temple Street, Puri 752001')" ' 400') "order: another shop's product refused"
ok $(has "$(o "[{\"id\":$PID,\"qty\":1}]" 'Puri')" ' 400') "order: too short address refused"
ok $(has "$(o "[{\"id\":$PID,\"qty\":1}]" "$(printf 'a%.0s' $(seq 1 201))")" ' 400') "order: address over 200 letters refused"
ok $(has "$(o "[{\"id\":$PID,\"qty\":3}]" '12 Temple Street, Puri 752001')" ' 409') "order: more than the stock (2) refused"
r=$(o "[{\"id\":$PID,\"qty\":1}]" '<script>alert(1)</script> Temple St, Puri')
OID=$(echo "$r" | grep -o '"orderId":[0-9]*' | cut -d: -f2)
ok $(has "$r" '"ok":true') "order: a normal order is placed"
ok $([ "$(sql "select stock from \"Product\" where id=$PID")" = "1" ] && echo 1 || echo 0) "order: stock went down from 2 to 1"
page=$(curl -s "$B/seller?t=$ST")
ok $(has "$page" '&lt;script&gt;alert(1)&lt;/script&gt;') "seller page: HTML in the customer's address is shown as text"

echo "== Seller notices open the dashboard"
newo=$(grep -A6 ">> Link button to $SA" "$LOG" | grep -A5 "#$OID!")
ok $(has "$newo" '/seller?t=') "new order notice to the seller has a dashboard link"
echo "== Payment inputs"
ok $(has "$(post /shop/$IDA/order/$OID/paid "{\"t\":\"$CT\",\"ref\":\"12-34\"}")" ' 409') "paid: wrong transaction number refused"
ok $(has "$(post /shop/$IDA/order/$OID/paid "{\"t\":\"$CT\",\"ref\":\"555566667777\"}")" '"ok":true') "paid: good transaction number accepted"
sleep 0.5; paidn=$(grep -A6 ">> Link button to $SA" "$LOG" | grep -A5 "#$OID ")
ok $(has "$paidn" '/seller?t=') "paid notice to the seller has a dashboard link"
ok $([ "$(echo "$paidn" | grep -c 'RECEIVED')" = "0" ] && echo 1 || echo 0) "paid notice has no Received / Not received buttons in WhatsApp"
ok $([ "$(curl -s -o /dev/null -w '%{http_code}' "$B/seller?t=$ST")" = "200" ] && echo 1 || echo 0) "the seller's open dashboard page still works after the notices"
msg $SA hi; ok $(has "$(last)" '/seller?t=') "seller 'hi' -> dashboard link straight away"
ok $([ "$(last | grep -c 'MYPRODUCTS\|SELLER$')" = "0" ] && echo 1 || echo 0) "seller 'hi' -> no My products / Seller menu buttons"
msg 919500000075 hi; msg 919500000075 1
ok $([ "$(last | grep -c '>> Reply to')" = "1" ] && [ "$(last | grep -c -- '->')" = "0" ] && echo 1 || echo 0) "new customer without a shop -> after the language, only the 'send the shop ID' message (no menu)"
msg $D "Hi $IDA"; msg $D 1; msg $D SHOPNOW; DT=$(tok "localhost:3001/shop/$IDA?t=[^ ]*")
ok $([ "$(curl -s -o /dev/null -w '%{http_code}' "$B/shop/$IDA/order/$OID?t=$DT")" = "403" ] && echo 1 || echo 0) "pay page: another customer cannot open this order"
ok $(has "$(post /seller/orders/$OID "{\"t\":\"$ST\",\"action\":\"SHIP\"}")" ' 409') "seller: Ship before the money is received refused"
ok $(has "$(post /seller/orders/$OID "{\"t\":\"$ST\",\"action\":\"RECEIVED\"}")" '"ok":true') "seller: Money received"

echo "== Chat: shop codes and languages"
msg $C "Hi 5918"; ok $([ "$(last | grep -c '>> Reply to')" = "1" ] && [ "$(last | grep -c -- '->')" = "0" ] && echo 1 || echo 0) "chat: Hi + unknown number -> 'no shop' message, no buttons"
msg $C SHOPNOW; ok $([ "$(last | grep -c '/shop/')" = "0" ] && echo 1 || echo 0) "chat: after a wrong code, Shop now does not open the old shop"
msg $C "$IDA"; ok $(has "$(last)" 'हिन्दी') "chat: shop ID typed without Hi opens that shop (language question)"
msg $C 3; ok $(has "$(last)" 'हिन्दी') "chat: a language the shop does not offer (3 = Odia) is refused"
msg $C 2; ok $(has "$(last)" 'Shop A') "chat: an offered language (2 = Hindi) is accepted"
msg $C 5917; ok $(has "$(last)" '5917') "chat: unknown 4-digit number alone -> 'no shop'"
msg $D "Hi $IDB"; msg $D LANG; ok $([ "$(last | grep -F -c '[অসমীয়া] -> 4   [हिन्दी] -> 2   [English] -> 1')" = "1" ] && echo 1 || echo 0) "chat: Assam shop -> LANG shows Assamese first, then Hindi and English"
msg $SB ADD; msg $SB "Blue Wallet"; msg $SB "$IDA"
ok $(has "$(last)" 'SKIP') "chat: seller typing a price equal to a shop ID is taken as the price (next: the description)"
msg $SB CANCEL

echo "== Old links"
sql "update \"User\" set \"webTokenAt\" = (now() at time zone 'utc') - interval '25 hours' where phone='$D'" >/dev/null
ok $([ "$(curl -s -o /dev/null -w '%{http_code}' "$B/shop/$IDA?t=$DT")" = "403" ] && echo 1 || echo 0) "shop link older than 24 hours refused"

echo
echo "RESULT: $pass passed, $fail failed"
[ "$fail" = "0" ]
