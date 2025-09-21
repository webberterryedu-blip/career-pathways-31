# Supabase Setup Instructions

## How to Get Your Service Role Key

To fix the "Invalid API key" error, you need to replace the placeholder service role key with your actual key from the Supabase dashboard:

1. Go to your Supabase project dashboard:
   https://app.supabase.com/project/jbapewpuvfijrkhlbsid/settings/api

2. In the "API Settings" section, find the "Service Role Secret" (not the anon key)

3. Copy that key (it should be a long string starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

4. Open your `.env` file and replace `YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE` with the copied key

## Example of a Valid Service Role Key

A valid service role key looks like this (example):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYXBld3B1dmZpanJraGxic2lkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODM3NDg3NywiZXhwIjoyMDczOTUwODc3fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## After Updating the Key

After replacing the placeholder with your actual service role key:

1. Save the `.env` file
2. Run the data insertion script:
   ```bash
   cd backend
   node run-insert-student-data.js
   ```

## Why Service Role Key?

The service role key is needed because:
- It provides full access to your Supabase database
- It bypasses Row Level Security (RLS) policies
- It's required for administrative operations like bulk data insertion
- The anon key has limited permissions and may not allow all operations

## Security Note

Never commit your actual service role key to version control. The `.env` file is in `.gitignore` to prevent this.