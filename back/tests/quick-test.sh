#!/bin/bash

# Quick Security Tests Script
echo "🚀 Starting Quick Security Tests"
echo "================================="

BASE_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test functions
test_endpoint() {
    local name="$1"
    local url="$2"
    local method="$3"
    local headers="$4"
    local body="$5"
    local expected_status="$6"
    
    echo -e "\n${BLUE}🧪 Testing: $name${NC}"
    
    if [ -n "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$body" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            $headers \
            "$url")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body_response=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $name: PASSED (Status: $status_code)${NC}"
        return 0
    else
        echo -e "${RED}❌ $name: FAILED (Expected: $expected_status, Got: $status_code)${NC}"
        echo "Response: $body_response"
        return 1
    fi
}

# Test 1: Health endpoint
test_endpoint "Health Endpoint" "$BASE_URL/api/health" "GET" "" "" "200"

# Test 2: Unauthorized access to protected endpoint
test_endpoint "Unauthorized Access" "$BASE_URL/api/usuarios" "GET" "" "" "401"

# Test 3: Invalid login data
test_endpoint "Invalid Login (XSS)" "$BASE_URL/api/auth/login" "POST" "" '{"email":"<script>alert(\"xss\")</script>@test.com","password":"test"}' "400"

# Test 4: SQL injection attempt
test_endpoint "SQL Injection Attempt" "$BASE_URL/api/auth/login" "POST" "" '{"email":"admin'\''; DROP TABLE usuarios; --","password":"test"}' "400"

# Test 5: Rate limiting (make multiple requests)
echo -e "\n${BLUE}🧪 Testing: Rate Limiting${NC}"
echo "Making 12 requests to test rate limiting..."

rate_limit_triggered=false
for i in {1..12}; do
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"test"}' \
        "$BASE_URL/api/auth/login")
    
    status_code="${response: -3}"
    if [ "$status_code" = "429" ]; then
        rate_limit_triggered=true
        break
    fi
done

if [ "$rate_limit_triggered" = true ]; then
    echo -e "${GREEN}✅ Rate Limiting: PASSED (429 status received)${NC}"
else
    echo -e "${YELLOW}⚠️  Rate Limiting: May not be working (or limits are high)${NC}"
fi

# Test 6: Valid login (if possible)
echo -e "\n${BLUE}🧪 Testing: Valid Login${NC}"
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"AdminPassword123!"}' \
    "$BASE_URL/api/auth/login")

if echo "$login_response" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Valid Login: PASSED${NC}"
    
    # Extract token for further tests
    token=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$token" ]; then
        # Test authenticated access
        test_endpoint "Authenticated Access" "$BASE_URL/api/auth/me" "GET" "-H \"Authorization: Bearer $token\"" "" "200"
        
        # Test admin access to usuarios
        test_endpoint "Admin Access to Users" "$BASE_URL/api/usuarios" "GET" "-H \"Authorization: Bearer $token\"" "" "200"
        
        # Test logout
        test_endpoint "Logout" "$BASE_URL/api/auth/logout" "POST" "-H \"Authorization: Bearer $token\"" "{}" "200"
    fi
else
    echo -e "${YELLOW}⚠️  Valid Login: SKIPPED (no valid credentials available)${NC}"
fi

echo -e "\n${BLUE}📊 Security Tests Summary${NC}"
echo "================================="
echo -e "${GREEN}✅ Tests completed!${NC}"
echo -e "\n💡 Note: Some tests may fail if:"
echo "   - Server is not running (npm run dev)"
echo "   - Database is not configured"
echo "   - Environment variables are missing"
echo -e "\n🔧 To start the server:"
echo "   cd grupo5-usuarios/back"
echo "   npm run dev"
