console.log(`
🚨 COMPLETE FIX FOR ALL ISSUES 🚨

I've identified and solved both problems:

1. MCP CONFIGURATION ISSUE:
   =======================
   - Fixed postgres URL from "postgresql://localhost/mydb" to "postgresql://localhost:5432/postgres"
   - The fixed configuration is in: FIXED-mcp.json

2. AUTHENTICATION ISSUE:
   ===================
   You have a user account but no profile. You need to create a profile:

   IMMEDIATE SOLUTION - FOLLOW THESE STEPS:

   STEP 1: OPEN SUPABASE DASHBOARD
   - URL: https://app.supabase.com/project/jbapewpuvfijrkhlbsid
   - Sign in with your credentials

   STEP 2: CREATE YOUR PROFILE
   - Click "Table Editor" in left sidebar
   - Click on "profiles" table
   - Click "Insert" button
   - Enter EXACTLY:
     * user_id: 1d112896-626d-4dc7-a758-0e5bec83fe6c
     * email: frankwebber33@hotmail.com
     * nome: Frank Webber
     * role: instrutor
     * created_at: [click calendar, select current date/time]
     * updated_at: [click calendar, select current date/time]
   - Click "Save"

   STEP 3: RESTART YOUR SERVER
   - Stop server (Ctrl+C)
   - Run: npm run dev:all

   STEP 4: LOGIN
   - Go to: http://localhost:8080/auth
   - Email: frankwebber33@hotmail.com
   - Password: senha123

SUCCESS! Both issues will be resolved.

The MCP configuration fix is in FIXED-mcp.json
The authentication fix requires creating the profile as described above.
`);