#!/usr/bin/env bash
# Removes everything scripts/validate.sh created (fake numbers 919500000071-75, 79 and their data)
PSQL="${PSQL:-/c/Program Files/PostgreSQL/18/bin/psql.exe}"
DB="${DB:-postgresql://postgres:postgres@localhost:5432/smart-village}"
U="(select id from \"User\" where phone in ('919500000071','919500000072','919500000073','919500000074','919500000075','919500000079'))"
"$PSQL" "$DB" -q -c "
delete from \"Payment\" where \"orderId\" in (select id from \"Order\" where \"customerId\" in $U);
delete from \"OrderItem\" where \"orderId\" in (select id from \"Order\" where \"customerId\" in $U);
delete from \"Order\" where \"customerId\" in $U;
delete from \"CartItem\" where \"cartId\" in (select id from \"Cart\" where \"customerId\" in $U);
delete from \"Cart\" where \"customerId\" in $U;
delete from \"Image\" where key in (select \"imageKey\" from \"Product\" where \"sellerId\" in $U) or key in (select \"upiQrKey\" from \"User\" where id in $U);
delete from \"ProductTranslation\" where \"productId\" in (select id from \"Product\" where \"sellerId\" in $U);
delete from \"Product\" where \"sellerId\" in $U;
update \"User\" set \"shopId\" = null where \"shopId\" in $U;
delete from \"User\" where id in $U;
update \"User\" set \"dashToken\" = null, \"dashTokenAt\" = null where phone = '919000000000';"
echo "Validation test data removed."
