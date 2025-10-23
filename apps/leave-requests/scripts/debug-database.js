#!/usr/bin/env node

/**
 * Database Debug Script
 * 
 * This script helps debug database connection and schema issues
 * that might be causing the AdapterError.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Starting database debug...');

async function debugDatabase() {
  try {
    // Change to the app directory
    process.chdir(path.join(__dirname, '..'));
    
    console.log('📊 Checking database connection...');
    
    // Test basic connection
    try {
      execSync('psql $DATABASE_URL -c "SELECT 1;"', { stdio: 'inherit' });
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }
    
    console.log('📋 Checking required tables...');
    
    // Check if all required tables exist
    const tables = ['users', 'accounts', 'sessions', 'verification_tokens'];
    
    for (const table of tables) {
      try {
        execSync(`psql $DATABASE_URL -c "SELECT COUNT(*) FROM ${table};"`, { stdio: 'inherit' });
        console.log(`✅ Table ${table} exists and is accessible`);
      } catch (error) {
        console.error(`❌ Table ${table} has issues:`, error.message);
      }
    }
    
    console.log('🔗 Checking foreign key relationships...');
    
    // Check foreign key constraints
    try {
      execSync('psql $DATABASE_URL -c "SELECT conname, contype FROM pg_constraint WHERE conrelid = \'accounts\'::regclass;"', { stdio: 'inherit' });
      console.log('✅ Foreign key constraints checked');
    } catch (error) {
      console.error('❌ Foreign key check failed:', error.message);
    }
    
    console.log('📊 Checking accounts table structure...');
    
    // Check accounts table structure
    try {
      execSync('psql $DATABASE_URL -c "\\d accounts"', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Accounts table structure check failed:', error.message);
    }
    
    console.log('🎯 Testing specific query that failed...');
    
    // Test the specific query that's failing
    try {
      execSync('psql $DATABASE_URL -c "SELECT COUNT(*) FROM accounts WHERE provider = \'google\' LIMIT 1;"', { stdio: 'inherit' });
      console.log('✅ Google provider query successful');
    } catch (error) {
      console.error('❌ Google provider query failed:', error.message);
    }
    
    console.log('✅ Database debug completed!');
    
  } catch (error) {
    console.error('❌ Database debug failed:', error.message);
    process.exit(1);
  }
}

debugDatabase();
