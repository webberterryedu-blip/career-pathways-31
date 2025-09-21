# Database Fixes for Career Pathways Application

This document provides instructions on how to apply the database fixes to resolve the "404 Not Found" error for `vw_estudantes_grid` and other database issues.

## Overview

The Career Pathways application was experiencing issues due to:
1. Missing `vw_estudantes_grid` view in the database
2. Schema inconsistencies between the application and database
3. Missing student data in the `estudantes` table

## Files Included

- `supabase/migrations/20250921100000_fix_missing_view_and_schema.sql` - Migration to fix schema issues
- `upload_estudantes.py` - Python script to convert Excel data to SQL
- `estudantes_insert_simplified.sql` - Simplified SQL insert statements for student data
- `estudantes_insert.sql` - Full SQL insert statements for student data
- `apply_database_fixes.sql` - Script to apply all fixes at once
- `FIX_DATABASE_SUMMARY.md` - Summary of all fixes implemented

## Prerequisites

1. Python 3.6 or higher
2. pandas library (`pip install pandas openpyxl`)
3. Access to the Supabase database
4. The Excel file `docs/Oficial/estudantes_corrigidos.xlsx`

## Step-by-Step Instructions

### 1. Apply the Schema Fixes

Run the migration to create the missing view and fix schema inconsistencies:

```sql
-- In your Supabase SQL editor, run:
\ir supabase/migrations/20250921100000_fix_missing_view_and_schema.sql
```

Or execute each part of the migration manually:
1. Create the missing view
2. Add missing columns to tables
3. Update existing data for consistency
4. Refresh the schema cache

### 2. Import Student Data

You can either:

**Option A: Use the simplified SQL file (recommended for initial setup)**
```sql
-- In your Supabase SQL editor, run:
\ir estudantes_insert_simplified.sql
```

**Option B: Use the full SQL file (for complete data import)**
```sql
-- In your Supabase SQL editor, run:
\ir estudantes_insert.sql
```

### 3. Apply All Fixes at Once

For convenience, you can apply all fixes with a single command:
```sql
-- In your Supabase SQL editor, run:
\ir apply_database_fixes.sql
```

## Verification

After applying the fixes, verify that everything is working correctly:

1. Check that the view exists:
   ```sql
   SELECT * FROM public.vw_estudantes_grid LIMIT 5;
   ```

2. Verify the student count:
   ```sql
   SELECT COUNT(*) as total_students FROM public.vw_estudantes_grid;
   ```

3. Test the application to ensure the "404 Not Found" error is resolved.

## Regenerating Student Data (if needed)

If you need to regenerate the SQL insert statements from the Excel file:

1. Make sure you have Python and pandas installed:
   ```bash
   pip install pandas openpyxl
   ```

2. Run the Python script:
   ```bash
   python upload_estudantes.py
   ```

This will regenerate the `estudantes_insert.sql` and `estudantes_insert_simplified.sql` files.

## Troubleshooting

### Issue: "Relation vw_estudantes_grid does not exist"
**Solution:** Make sure you've run the migration that creates the view.

### Issue: Missing columns in query results
**Solution:** Verify that the schema fixes have been applied to add the missing columns.

### Issue: No data in the view
**Solution:** Check that student data has been imported into the `estudantes` table.

## Additional Notes

- The fixes are designed to be non-destructive and will only add missing elements
- The schema refresh command (`NOTIFY pgrst, 'reload schema'`) is important for the changes to take effect
- The student data import can be run multiple times without creating duplicates (assuming the same data)