// This script will search and replace camelCase field names with snake_case
// in server/routes.ts and other files

const fields = [
  { camel: 'userId', snake: 'user_id' },
  { camel: 'merchantId', snake: 'merchant_id' },
  { camel: 'commissionRate', snake: 'commission_rate' },
  { camel: 'createdAt', snake: 'created_at' },
  { camel: 'updatedAt', snake: 'updated_at' },
  { camel: 'referrerId', snake: 'referrer_id' },
  { camel: 'referredId', snake: 'referred_id' },
  { camel: 'storeName', snake: 'store_name' },
  { camel: 'totalEarned', snake: 'total_earned' },
  { camel: 'transactionId', snake: 'transaction_id' },
  { camel: 'productId', snake: 'product_id' },
  { camel: 'cashbackAmount', snake: 'cashback_amount' },
  { camel: 'paymentMethod', snake: 'payment_method' },
  { camel: 'businessHours', snake: 'business_hours' },
  { camel: 'companyLogo', snake: 'company_logo' },
  { camel: 'lastLogin', snake: 'last_login' },
  { camel: 'manualAmount', snake: 'manual_amount' },
  { camel: 'platformFee', snake: 'platform_fee' },
  { camel: 'merchantCut', snake: 'merchant_cut' },
  { camel: 'clientCut', snake: 'client_cut' },
  { camel: 'referralCut', snake: 'referral_cut' },
  { camel: 'ipAddress', snake: 'ip_address' },
  { camel: 'invitationCode', snake: 'invitation_code' },
  { camel: 'securityQuestion', snake: 'security_question' },
  { camel: 'securityAnswer', snake: 'security_answer' },
  { camel: 'productName', snake: 'product_name' }
];

console.log('This script will help identify field name inconsistencies in the codebase.');
console.log('Search for the following patterns:');
console.log('---------------------------------');

fields.forEach(field => {
  console.log(`Search for: merchants.${field.camel} and replace with: merchants.${field.snake}`);
  console.log(`Search for: users.${field.camel} and replace with: users.${field.snake}`);
  console.log(`Search for: transactions.${field.camel} and replace with: transactions.${field.snake}`);
  console.log(`Search for: cashbacks.${field.camel} and replace with: cashbacks.${field.snake}`);
  console.log(`Search for: referrals.${field.camel} and replace with: referrals.${field.snake}`);
  console.log(`Search for: products.${field.camel} and replace with: products.${field.snake}`);
  console.log(`Search for: transactionItems.${field.camel} and replace with: transactionItems.${field.snake}`);
  console.log(`Search for: transfers.${field.camel} and replace with: transfers.${field.snake}`);
  console.log(`Search for: qrCodes.${field.camel} and replace with: qrCodes.${field.snake}`);
  console.log(`Search for: settings.${field.camel} and replace with: settings.${field.snake}`);
  console.log(`Search for: commissionSettings.${field.camel} and replace with: commissionSettings.${field.snake}`);
  console.log(`Search for: auditLogs.${field.camel} and replace with: auditLogs.${field.snake}`);
  console.log('---------------------------------');
});