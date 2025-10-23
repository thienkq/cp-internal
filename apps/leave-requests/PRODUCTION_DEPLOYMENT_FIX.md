# Production Deployment Fix for SessionTokenError

## Issues Identified and Fixed

### 1. **Database Connection Issues**
- **Problem**: No validation of database connection before auth operations
- **Fix**: Added `validateDatabase()` function to test connection before auth callbacks

### 2. **Missing Environment Variable Validation**
- **Problem**: DATABASE_URL not validated in auth setup
- **Fix**: Added DATABASE_URL validation to `validateEnvVars()`

### 3. **Improved Error Handling**
- **Problem**: Generic error handling in auth callbacks
- **Fix**: Added detailed error logging and database connection validation

### 4. **Session Management Issues**
- **Problem**: Potential issues with session token handling in production
- **Fix**: Enhanced session configuration and error handling

### 5. **Database Connection Issues**
- **Problem**: Database connection timeouts and "Failed to connect to upstream database" errors
- **Fix**: Enhanced connection pooling, retry logic, and connection diagnostics

### 6. **Serverless Performance Issues**
- **Problem**: Database works locally but slow/times out in Vercel production
- **Fix**: Serverless-optimized connection pooling, connection warming, and network latency handling

## Files Modified

1. **`auth.ts`**:
   - Added DATABASE_URL validation
   - Added `validateDatabase()` function
   - Improved error handling in signIn callback
   - Removed `getDbSafe()` fallback (causes issues in production)

2. **`db/index.ts`**:
   - Improved database connection pooling and timeout settings
   - Added connection retry logic with exponential backoff
   - Enhanced error handling for production environments
   - Added database health checks

3. **`scripts/migrate-production.js`**:
   - Script to run migrations in production

4. **`scripts/debug-database.js`**:
   - Script to debug database connection and schema issues

5. **`scripts/diagnose-db-connection.js`**:
   - Comprehensive database connection diagnostic tool
   - Tests network connectivity, authentication, and performance

6. **`SERVERLESS_OPTIMIZATION.md`**:
   - Detailed guide for serverless database optimization
   - Serverless-specific configuration recommendations

## Deployment Steps

### 1. **Deploy the Code Changes**
```bash
# Commit and push the changes
git add .
git commit -m "Fix SessionTokenError: schema mismatch and database connection issues"
git push origin main
```

### 2. **Verify Database Schema**
Since the database already has the correct schema, just verify the tables exist:

```bash
# Check if all required tables exist
psql $DATABASE_URL -c "\dt"
```

### 3. **Verify Environment Variables in Vercel**
Ensure these environment variables are set in Vercel dashboard:

- `DATABASE_URL` - Your production database connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret  
- `NEXTAUTH_SECRET` - NextAuth secret key
- `NEXTAUTH_URL` - Your production URL (e.g., https://your-app.vercel.app) - **CRITICAL**

### 4. **Diagnose Database Connection Issues**
If you're getting connection timeouts or "Failed to connect to upstream database" errors:

```bash
# Run comprehensive database connection diagnosis
node scripts/diagnose-db-connection.js
```

This will check:
- Environment variables
- Network connectivity to database server
- Database authentication
- Query performance
- Connection pool status
- Required table existence

### 5. **Debug Database Schema Issues (if needed)**
If you're still getting AdapterError, run the debug script:

```bash
# Run database debug script
node scripts/debug-database.js
```

This will check:
- Database connection
- Table existence and accessibility
- Foreign key relationships
- Specific query that's failing

### 6. **Test Authentication**
1. Visit your production URL
2. Try to sign in with Google
3. Check Vercel function logs for any remaining errors

### 7. **Serverless Performance Optimization**
If you're still experiencing slow database connections in production:

1. **Read the serverless optimization guide**: `SERVERLESS_OPTIMIZATION.md`
2. **Check database provider location**: Ensure it's close to Vercel regions
3. **Consider connection pooling services**: PgBouncer, Supabase, or PlanetScale
4. **Monitor performance**: Use Vercel Analytics to track improvements

## Troubleshooting

### If SessionTokenError persists:

1. **Check Database Connection**:
   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **Verify Tables Exist**:
   ```bash
   psql $DATABASE_URL -c "\dt"
   ```

3. **Check Sessions Table Schema**:
   ```bash
   psql $DATABASE_URL -c "\d sessions"
   ```

4. **Check Verification Tokens Table**:
   ```bash
   psql $DATABASE_URL -c "\d verification_tokens"
   ```

### Common Issues:

- **"Failed to connect to upstream database"**: Database server is down or unreachable
- **"timeout exceeded when trying to connect"**: Database connection timeout issues
- **Missing NEXTAUTH_URL**: This is the most common cause - must be set to your production URL
- **Missing DATABASE_URL**: Ensure it's set in Vercel environment variables
- **Database connection timeout**: Check if your database allows connections from Vercel
- **AdapterError**: Usually indicates database schema or connection issues
- **Session token corruption**: Clear browser cookies and try again
- **Wrong database**: Verify you're using the production database, not local
- **Connection limits**: Check if you've hit database connection limits
- **Missing tables**: Ensure all NextAuth tables exist (users, accounts, sessions, verification_tokens)

## Monitoring

After deployment, monitor:
- Vercel function logs for authentication errors
- Database connection pool usage
- Session creation/deletion patterns
- User sign-in success rates

## Rollback Plan

If issues persist:
1. Revert to previous commit
2. Check database schema manually
3. Run manual SQL fixes if needed
4. Re-deploy with fixes
