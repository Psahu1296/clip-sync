#!/bin/bash

# Clip Sync Server - Installation Verification Script
# This script checks if everything is set up correctly

echo "🔍 Clip Sync Server - Installation Verification"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counters
PASSED=0
FAILED=0

# Function to check and report
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
    fi
}

# 1. Check Node.js version
echo "1️⃣  Checking Node.js..."
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓${NC} Node.js $(node -v) installed"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} Node.js 18+ required (found: $(node -v 2>/dev/null || echo 'not installed'))"
    ((FAILED++))
fi

# 2. Check if dependencies are installed
echo ""
echo "2️⃣  Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Dependencies not installed. Run: npm install"
    ((FAILED++))
fi

# 3. Check if .env file exists
echo ""
echo "3️⃣  Checking configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    ((PASSED++))
    
    # Check required variables
    REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY" "SUPABASE_JWT_SECRET" "DATABASE_URL")
    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${VAR}=" .env 2>/dev/null; then
            VALUE=$(grep "^${VAR}=" .env | cut -d'=' -f2)
            if [ -n "$VALUE" ] && [ "$VALUE" != "your-" ] && [[ ! "$VALUE" =~ ^your- ]]; then
                echo -e "${GREEN}✓${NC} $VAR is set"
                ((PASSED++))
            else
                echo -e "${YELLOW}⚠${NC} $VAR needs to be configured"
                ((FAILED++))
            fi
        else
            echo -e "${RED}✗${NC} $VAR is missing"
            ((FAILED++))
        fi
    done
else
    echo -e "${RED}✗${NC} .env file not found. Run: cp .env.example .env"
    ((FAILED++))
fi

# 4. Check TypeScript compilation
echo ""
echo "4️⃣  Checking TypeScript..."
if command -v tsc &> /dev/null; then
    npx tsc --noEmit &> /dev/null
    check "TypeScript type checking passed"
else
    echo -e "${YELLOW}⚠${NC} TypeScript not found (will be installed with npm install)"
fi

# 5. Check source files
echo ""
echo "5️⃣  Checking source files..."
REQUIRED_FILES=(
    "src/index.ts"
    "src/app.ts"
    "src/config/index.ts"
    "src/middleware/auth.ts"
    "src/services/userService.ts"
    "src/controllers/syncController.ts"
    "src/routes/index.ts"
    "migrations/001_initial_schema.sql"
)

for FILE in "${REQUIRED_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Missing: $FILE"
        ((FAILED++))
    fi
done

if [ ${#REQUIRED_FILES[@]} -eq $((PASSED - $(($PASSED - ${#REQUIRED_FILES[@]})) )) ]; then
    echo -e "${GREEN}✓${NC} All required source files present"
fi

# 6. Check documentation
echo ""
echo "6️⃣  Checking documentation..."
DOC_FILES=("README.md" "QUICKSTART.md" "API.md" "DEPLOYMENT.md" "ARCHITECTURE.md")
for FILE in "${DOC_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Missing: $FILE"
        ((FAILED++))
    fi
done

if [ ${#DOC_FILES[@]} -eq $((PASSED - $(($PASSED - ${#DOC_FILES[@]})) )) ]; then
    echo -e "${GREEN}✓${NC} All documentation files present"
fi

# Summary
echo ""
echo "================================================"
echo "📊 Verification Summary"
echo "================================================"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! You're ready to go!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Make sure .env is configured with your Supabase credentials"
    echo "  2. Run: npm run migrate"
    echo "  3. Run: npm run dev"
    echo "  4. Test: curl http://localhost:3000/api/v1/health"
    echo ""
    echo "📚 Read QUICKSTART.md for detailed setup instructions"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some checks failed. Please fix the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  • Install dependencies: npm install"
    echo "  • Create .env file: cp .env.example .env"
    echo "  • Configure .env with your Supabase credentials"
    echo ""
    echo "📚 Read QUICKSTART.md for help"
    exit 1
fi
