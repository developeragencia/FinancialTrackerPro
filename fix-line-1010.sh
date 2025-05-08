#!/bin/bash
# This script replaces a specific pattern in line 1010

sed -i '1010s/merchants.userId/merchants.user_id/g' server/routes.ts
echo "Changed line 1010 of server/routes.ts"