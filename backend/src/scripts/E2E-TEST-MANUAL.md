# E2E Tests for create-admin CLI

## Test Setup

The E2E tests run the actual CLI script and verify real behavior.

## Manual E2E Tests (run in terminal)

```bash
# Navigate to backend directory
cd backend

# Test 1: --help flag
npm run create-admin -- --help

# Expected: Display help message and exit with code 0

# Test 2: Invalid email format (scripted mode)
npm run create-admin -- --email=invalid --password=TestPass123

# Expected: "Invalid email format. Please provide a valid email address."

# Test 3: Weak password (scripted mode)
npm run create-admin -- --email=admin@test.com --password=weak

# Expected: "Password must be at least 8 characters..."

# Test 4: Valid admin creation (scripted mode)
# Note: This will fail if admin already exists from previous tests
npm run create-admin -- --email=newadmin@test.com --password=TestPass123

# Expected: "✅ Admin user created successfully: newadmin@test.com"

# Test 5: Duplicate admin prevention
npm run create-admin -- --email=another@test.com --password=TestPass123

# Expected: "An admin user already exists. Only one superadmin is allowed."

# Test 6: Missing .env (if .env is removed or DB vars unset)
# Unset DB env vars and run:
DB_HOST= DB_PORT= npm run create-admin -- --email=test@test.com --password=TestPass123

# Expected: "Configuration file (.env) not found..."

# Test 7: Interactive mode (manual test - run without arguments)
# Run: npm run create-admin
# Enter "invalid@email" when prompted for email
# Expected: Should reprompt with validation error
# Then enter "valid@test.com"
# Enter "weak" when prompted for password
# Expected: Should reprompt with validation error
# Then enter "ValidPass123"
# Expected: Should create admin successfully

# Test 8: Hybrid mode (email provided, password prompted)
npm run create-admin -- --email=hybrid@test.com
# When prompted for password, enter "TestPass123"
# Expected: Creates admin successfully

# Test 9: Ctrl+C during interactive mode
# Run: npm run create-admin
# Press Ctrl+C during prompt
# Expected: "Operation cancelled." and clean exit

# Test 10: Database connection failure (if DB is down)
# Stop MySQL and run:
npm run create-admin -- --email=test@test.com --password=TestPass123

# Expected: "Failed to connect to database..."
```

## Automated E2E Test Cases

The following test cases should be added to a dedicated E2E test file using supertest or similar CLI testing approach:

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| E2E-01 | `npm run create-admin -- --help` | Help displayed, exit 0 |
| E2E-02 | `npm run create-admin -- --email=invalid --password=Pass1234` | Email validation error |
| E2E-03 | `npm run create-admin -- --email=test@test.com --password=weak` | Password validation error |
| E2E-04 | `npm run create-admin -- --email=test@test.com --password=ValidPass123` | Admin created, exit 0 |
| E2E-05 | Run E2E-04 again | Duplicate admin error |
| E2E-06 | `npm run create-admin` (interactive) | Prompts for email + password |
| E2E-07 | Interactive with invalid email input | Reprompts |
| E2E-08 | `npm run create-admin -- --email=x@y.com` | Prompts for password only |
| E2E-09 | Ctrl+C during prompt | Clean exit |
| E2E-10 | No .env file | Missing env error |