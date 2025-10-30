#!/bin/bash
source .env.local

# Login as Acme Owner
ACME_TOKEN=$(curl -s -X POST "https://egccqmlhzqiirovstpal.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@acme-corp.test","password":"Test123456!"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "✅ Acme Owner logged in"
echo ""

# Query user_profiles as Acme Owner (should only see Acme users)
echo "🔍 Querying user_profiles as Acme Owner (should see 3 Acme profiles only):"
curl -s "https://egccqmlhzqiirovstpal.supabase.co/rest/v1/user_profiles?select=full_name,role,organization_id" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACME_TOKEN"

echo ""
echo ""

# Login as TechStart Owner
TECH_TOKEN=$(curl -s -X POST "https://egccqmlhzqiirovstpal.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@techstart.test","password":"Test123456!"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "✅ TechStart Owner logged in"
echo ""

# Query user_profiles as TechStart Owner (should only see TechStart users)
echo "🔍 Querying user_profiles as TechStart Owner (should see 2 TechStart profiles only):"
curl -s "https://egccqmlhzqiirovstpal.supabase.co/rest/v1/user_profiles?select=full_name,role,organization_id" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $TECH_TOKEN"

echo ""
