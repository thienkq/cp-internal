#!/usr/bin/env node

/**
 * Production Database Migration Script
 * 
 * This script runs the database migrations in production.
 * It should be run after deploying to Vercel to ensure the database schema is up to date.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting production database migration...');

try {
  // Change to the app directory
  process.chdir(path.join(__dirname, '..'));
  
  console.log('📦 Running database migrations...');
  
  // Run the migration command
  execSync('pnpm db:migrate', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
  console.log('✅ Database migration completed successfully!');
  
} catch (error) {
  console.error('❌ Database migration failed:', error.message);
  process.exit(1);
}
