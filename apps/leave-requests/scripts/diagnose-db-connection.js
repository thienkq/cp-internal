#!/usr/bin/env node

/**
 * Database Connection Diagnostic Script
 * 
 * This script helps diagnose database connection issues in production.
 * It tests various aspects of the database connection and provides detailed feedback.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Starting database connection diagnosis...');

async function diagnoseConnection() {
  try {
    // Change to the app directory
    process.chdir(path.join(__dirname, '..'));
    
    console.log('📊 Environment Variables Check...');
    
    // Check if DATABASE_URL is set
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL environment variable is not set');
      return;
    }
    
    console.log('✅ DATABASE_URL is set');
    console.log('🔗 Database URL (masked):', databaseUrl.replace(/:[^:]*@/, ':***@'));
    
    // Parse DATABASE_URL to extract components
    try {
      const url = new URL(databaseUrl);
      console.log('📋 Database Details:');
      console.log('  - Host:', url.hostname);
      console.log('  - Port:', url.port || '5432');
      console.log('  - Database:', url.pathname.slice(1));
      console.log('  - SSL:', url.searchParams.get('sslmode') || 'not specified');
    } catch (error) {
      console.error('❌ Invalid DATABASE_URL format:', error.message);
      return;
    }
    
    console.log('\n🌐 Network Connectivity Test...');
    
    // Test basic network connectivity
    try {
      const url = new URL(databaseUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      
      console.log(`Testing connection to ${host}:${port}...`);
      
      // Use netcat or telnet to test connectivity
      try {
        execSync(`timeout 10 bash -c "</dev/tcp/${host}/${port}"`, { stdio: 'inherit' });
        console.log('✅ Network connectivity to database server is working');
      } catch (error) {
        console.error('❌ Network connectivity failed:', error.message);
        console.log('💡 This might indicate:');
        console.log('  - Database server is down');
        console.log('  - Firewall blocking the connection');
        console.log('  - Wrong host/port in DATABASE_URL');
        return;
      }
    } catch (error) {
      console.error('❌ Network test failed:', error.message);
    }
    
    console.log('\n🔐 Database Authentication Test...');
    
    // Test database connection with psql
    try {
      console.log('Testing database authentication...');
      execSync('psql $DATABASE_URL -c "SELECT version();"', { 
        stdio: 'inherit',
        timeout: 30000 // 30 second timeout
      });
      console.log('✅ Database authentication successful');
    } catch (error) {
      console.error('❌ Database authentication failed:', error.message);
      console.log('💡 This might indicate:');
      console.log('  - Wrong username/password in DATABASE_URL');
      console.log('  - Database user lacks permissions');
      console.log('  - Database server is rejecting connections');
      return;
    }
    
    console.log('\n📊 Database Performance Test...');
    
    // Test query performance
    try {
      console.log('Testing query performance...');
      const start = Date.now();
      execSync('psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"', { 
        stdio: 'inherit',
        timeout: 10000 // 10 second timeout
      });
      const duration = Date.now() - start;
      console.log(`✅ Query completed in ${duration}ms`);
      
      if (duration > 5000) {
        console.log('⚠️  Query is slow - this might indicate database performance issues');
      }
    } catch (error) {
      console.error('❌ Query performance test failed:', error.message);
    }
    
    console.log('\n🔍 Connection Pool Test...');
    
    // Test connection pool settings
    try {
      console.log('Testing connection pool...');
      execSync('psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = \'active\';"', { 
        stdio: 'inherit',
        timeout: 10000
      });
      console.log('✅ Connection pool test successful');
    } catch (error) {
      console.error('❌ Connection pool test failed:', error.message);
    }
    
    console.log('\n📋 Database Schema Check...');
    
    // Check if required tables exist
    const requiredTables = ['users', 'accounts', 'sessions', 'verification_tokens'];
    
    for (const table of requiredTables) {
      try {
        execSync(`psql $DATABASE_URL -c "SELECT COUNT(*) FROM ${table} LIMIT 1;"`, { 
          stdio: 'inherit',
          timeout: 5000
        });
        console.log(`✅ Table ${table} exists and is accessible`);
      } catch (error) {
        console.error(`❌ Table ${table} has issues:`, error.message);
      }
    }
    
    console.log('\n🎯 Recommendations:');
    console.log('1. If network connectivity failed: Check your database server status');
    console.log('2. If authentication failed: Verify DATABASE_URL credentials');
    console.log('3. If queries are slow: Consider database performance optimization');
    console.log('4. If tables are missing: Run database migrations');
    console.log('5. For production: Consider using connection pooling services');
    
    console.log('\n✅ Database connection diagnosis completed!');
    
  } catch (error) {
    console.error('❌ Database diagnosis failed:', error.message);
    process.exit(1);
  }
}

diagnoseConnection();
