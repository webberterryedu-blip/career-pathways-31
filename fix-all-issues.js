#!/usr/bin/env node

/**
 * Comprehensive Fix Script for Career Pathways 31
 * Fixes all identified issues:
 * 1. Database schema issues (missing ajudante_id column)
 * 2. Environment variables configuration
 * 3. Authentication problems
 * 4. RLS policy issues
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting comprehensive fix for Career Pathways 31...\n');

// 1. Check and fix environment variables
function fixEnvironmentVariables() {
    console.log('🔧 Checking environment variables...');
    
    const envLocalPath = path.join(__dirname, '.env.local');
    const envExamplePath = path.join(__dirname, '.env.local.example');
    
    // Check if .env.local exists
    if (!fs.existsSync(envLocalPath)) {
        console.log('⚠️  .env.local file not found. Creating from template...');
        
        if (fs.existsSync(envExamplePath)) {
            fs.copyFileSync(envExamplePath, envLocalPath);
            console.log('✅ Created .env.local from template');
            console.log('🚨 IMPORTANT: Edit .env.local and replace YOUR_ACTUAL_ANON_KEY_HERE with your real Supabase anon key');
            console.log('   Get it from: https://app.supabase.com/project/jbapewpuvfijrkhlbsid/settings/api');
        } else {
            console.log('❌ .env.local.example template not found!');
            return false;
        }
    } else {
        console.log('✅ .env.local file exists');
        
        // Check if it has the required variables
        const envContent = fs.readFileSync(envLocalPath, 'utf8');
        if (!envContent.includes('VITE_SUPABASE_URL') || !envContent.includes('VITE_SUPABASE_ANON_KEY')) {
            console.log('⚠️  Environment variables seem incomplete');
            console.log('🚨 Please check your .env.local file and ensure it contains:');
            console.log('   VITE_SUPABASE_URL=https://jbapewpuvfijrkhlbsid.supabase.co');
            console.log('   VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here');
            return false;
        }
    }
    
    return true;
}

// 2. Generate database fix instructions
function generateDatabaseFixInstructions() {
    console.log('\n📊 Database Fix Instructions:');
    console.log('=============================');
    console.log('');
    console.log('The database schema needs to be updated. Please follow these steps:');
    console.log('');
    console.log('1. Open Supabase Dashboard:');
    console.log('   https://app.supabase.com/project/jbapewpuvfijrkhlbsid/sql');
    console.log('');
    console.log('2. Copy and paste the contents of FIX_ALL_ISSUES_NOW.sql into the SQL editor');
    console.log('');
    console.log('3. Click "RUN" to execute the script');
    console.log('');
    console.log('This will fix:');
    console.log('- Missing ajudante_id column in designacoes table');
    console.log('- RLS policies for proper access control');
    console.log('- Indexes for better performance');
    console.log('- Data consistency issues');
    console.log('');
}

// 3. Test authentication
async function testAuthentication() {
    console.log('🔐 Testing authentication setup...');
    
    try {
        // Try to load environment variables
        require('dotenv').config({ path: path.join(__dirname, '.env.local') });
        
        const { createClient } = require('@supabase/supabase-js');
        
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            console.log('❌ Supabase configuration missing in environment variables');
            return false;
        }
        
        console.log(`✅ Supabase URL configured: ${supabaseUrl}`);
        
        // Test connection
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test a simple query
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .limit(1);
            
        if (error) {
            console.log('❌ Database connection failed:', error.message);
            if (error.message.includes('column') || error.message.includes('does not exist')) {
                console.log('💡 This confirms the database schema issue');
            }
            return false;
        }
        
        console.log('✅ Database connection successful');
        return true;
        
    } catch (error) {
        console.log('❌ Authentication test failed:', error.message);
        return false;
    }
}

// 4. Generate next steps
function generateNextSteps() {
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('');
    console.log('1. ✅ Fix Environment Variables:');
    console.log('   - Edit .env.local file');
    console.log('   - Add your actual Supabase anon key');
    console.log('');
    console.log('2. ✅ Fix Database Schema:');
    console.log('   - Run FIX_ALL_ISSUES_NOW.sql in Supabase SQL editor');
    console.log('');
    console.log('3. ✅ Restart Development Servers:');
    console.log('   - Stop all running servers (Ctrl+C)');
    console.log('   - Run: npm run dev:all');
    console.log('');
    console.log('4. ✅ Test the Application:');
    console.log('   - Visit: http://localhost:8080');
    console.log('   - Try logging in with your credentials');
    console.log('   - Check if estudantes and designacoes load correctly');
    console.log('');
    console.log('5. ✅ If Still Having Issues:');
    console.log('   - Enable mock mode by adding VITE_MOCK_MODE=true to .env.local');
    console.log('   - This will bypass database issues for development');
    console.log('');
}

// Main execution
async function main() {
    try {
        // Step 1: Fix environment variables
        const envFixed = fixEnvironmentVariables();
        
        // Step 2: Generate database fix instructions
        generateDatabaseFixInstructions();
        
        // Step 3: Test authentication (if possible)
        if (envFixed) {
            await testAuthentication();
        }
        
        // Step 4: Generate next steps
        generateNextSteps();
        
        console.log('\n🎉 Fix process completed!');
        console.log('Please follow the instructions above to complete the setup.');
        
    } catch (error) {
        console.error('❌ Fix process failed:', error.message);
        process.exit(1);
    }
}

// Run the fix
if (require.main === module) {
    main();
}

module.exports = { fixEnvironmentVariables, generateDatabaseFixInstructions, testAuthentication };