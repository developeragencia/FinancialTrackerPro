#!/bin/bash
# This script replaces a specific pattern in line 1074

sed -i '1074s/merchants.userId/merchants.user_id/g' server/routes.ts
echo "Changed line 1074 of server/routes.ts"