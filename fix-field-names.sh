#!/bin/bash
# This script fixes camelCase field names to snake_case in server/routes.ts

echo "Fixing field name inconsistencies in server/routes.ts..."

# Replace userId with user_id
sed -i 's/merchants\.userId/merchants\.user_id/g' server/routes.ts
echo "✓ Replaced merchants.userId with merchants.user_id"

# Replace merchantId with merchant_id
sed -i 's/transactions\.merchantId/transactions\.merchant_id/g' server/routes.ts
echo "✓ Replaced transactions.merchantId with transactions.merchant_id"

# Replace commissionRate with commission_rate
sed -i 's/merchants\.commissionRate/merchants\.commission_rate/g' server/routes.ts
echo "✓ Replaced merchants.commissionRate with merchants.commission_rate"

# Replace createdAt with created_at
sed -i 's/merchants\.createdAt/merchants\.created_at/g' server/routes.ts
sed -i 's/transactions\.createdAt/transactions\.created_at/g' server/routes.ts
echo "✓ Replaced createdAt with created_at"

# Replace cashbackAmount with cashback_amount
sed -i 's/transactions\.cashbackAmount/transactions\.cashback_amount/g' server/routes.ts
echo "✓ Replaced transactions.cashbackAmount with transactions.cashback_amount"

# Replace paymentMethod with payment_method
sed -i 's/transactions\.paymentMethod/transactions\.payment_method/g' server/routes.ts
echo "✓ Replaced transactions.paymentMethod with transactions.payment_method"

# Replace storeName with store_name
sed -i 's/merchants\.storeName/merchants\.store_name/g' server/routes.ts
echo "✓ Replaced merchants.storeName with merchants.store_name"

# Replace transactionId with transaction_id
sed -i 's/transactionItems\.transactionId/transactionItems\.transaction_id/g' server/routes.ts
echo "✓ Replaced transactionItems.transactionId with transactionItems.transaction_id"

# Replace productId with product_id
sed -i 's/transactionItems\.productId/transactionItems\.product_id/g' server/routes.ts
echo "✓ Replaced transactionItems.productId with transactionItems.product_id"

# Replace productName with product_name
sed -i 's/transactionItems\.productName/transactionItems\.product_name/g' server/routes.ts
echo "✓ Replaced transactionItems.productName with transactionItems.product_name"

# Replace totalEarned with total_earned
sed -i 's/cashbacks\.totalEarned/cashbacks\.total_earned/g' server/routes.ts
echo "✓ Replaced cashbacks.totalEarned with cashbacks.total_earned"

# Replace referrerId with referrer_id
sed -i 's/referrals\.referrerId/referrals\.referrer_id/g' server/routes.ts
echo "✓ Replaced referrals.referrerId with referrals.referrer_id"

# Replace referredId with referred_id
sed -i 's/referrals\.referredId/referrals\.referred_id/g' server/routes.ts
echo "✓ Replaced referrals.referredId with referrals.referred_id"

# Replace businessHours with business_hours
sed -i 's/merchants\.businessHours/merchants\.business_hours/g' server/routes.ts
echo "✓ Replaced merchants.businessHours with merchants.business_hours"

# Fix camelCase in destructuring and object properties
sed -i 's/\([^\.]\)userId:/\1user_id:/g' server/routes.ts
sed -i 's/\([^\.]\)merchantId:/\1merchant_id:/g' server/routes.ts
sed -i 's/\([^\.]\)createdAt:/\1created_at:/g' server/routes.ts
sed -i 's/\([^\.]\)storeName:/\1store_name:/g' server/routes.ts
sed -i 's/\([^\.]\)companyLogo:/\1company_logo:/g' server/routes.ts
sed -i 's/\([^\.]\)commissionRate:/\1commission_rate:/g' server/routes.ts
sed -i 's/\([^\.]\)businessHours:/\1business_hours:/g' server/routes.ts
echo "✓ Fixed camelCase in object properties and destructuring"

echo "Field name inconsistencies fixed in server/routes.ts"