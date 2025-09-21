# 🚨 MANUAL PROFILE CREATION - IMMEDIATE SOLUTION 🚨

## FOLLOW THESE EXACT STEPS TO CREATE YOUR PROFILE

### 1. OPEN SUPABASE DASHBOARD
- Go to: https://app.supabase.com/project/jbapewpuvfijrkhlbsid
- Sign in with your Supabase account credentials

### 2. NAVIGATE TO THE PROFILES TABLE
- In the left sidebar, click "Table Editor"
- Click on the "profiles" table

### 3. CREATE A PROFILE FOR YOUR USER
- Click the "Insert" button (usually a "+" or "Insert row" button)
- Fill in the following fields EXACTLY:

| Field | Value |
|-------|-------|
| **user_id** | `1d112896-626d-4dc7-a758-0e5bec83fe6c` |
| **email** | `frankwebber33@hotmail.com` |
| **nome** | `Frank Webber` |
| **role** | `instrutor` |
| **created_at** | Click the calendar icon and select current date/time |
| **updated_at** | Click the calendar icon and select current date/time |

- Click "Save" or "Insert" button

### 4. VERIFY THE PROFILE WAS CREATED
- You should see your new profile in the table
- Make sure all the fields match exactly what's shown above

### 5. RESTART YOUR DEVELOPMENT SERVER
- In your terminal, stop the current server (Ctrl+C)
- Run: `npm run dev:all`

### 6. LOGIN TO YOUR APPLICATION
- Go to: http://localhost:8080/auth
- Enter your credentials:
  - **Email**: `frankwebber33@hotmail.com`
  - **Password**: `senha123`
- Click "Login"

## ✅ SUCCESS!
You should now be able to log in without the "Invalid login credentials" error.

## 🛠️ TROUBLESHOOTING
If you still have issues:

1. **Double-check the user_id**:
   - Make sure it's exactly: `1d112896-626d-4dc7-a758-0e5bec83fe6c`
   - No extra spaces or characters

2. **Verify all fields are filled**:
   - All fields in the table must have values
   - Dates should be properly formatted

3. **Check for duplicate profiles**:
   - Make sure there isn't already a profile with the same user_id
   - If there is, delete it and create a new one with the correct values

4. **Restart everything**:
   - Stop your development server
   - Refresh the Supabase dashboard
   - Restart your development server

## 📞 NEED MORE HELP?
If you're still having issues after following these steps:
1. Make sure you're using the exact credentials provided
2. Check that email confirmation is not required (it should already be confirmed based on your user data)
3. Verify that your Supabase project settings are correct