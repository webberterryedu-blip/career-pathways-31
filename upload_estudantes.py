import pandas as pd
import uuid
from datetime import datetime
import numpy as np

# Read the Excel file
input_file = r"C:\Users\webbe\Documents\GitHub\career-pathways-31\docs\Oficial\estudantes_corrigidos.xlsx"
print(f"📂 Reading spreadsheet: {input_file}")

try:
    df = pd.read_excel(input_file)
    print(f"✅ Successfully read {len(df)} records from the spreadsheet")
except Exception as e:
    print(f"❌ Error reading Excel file: {e}")
    exit(1)

# Display column names to understand the structure
print("\n📋 Columns in the Excel file:")
for i, col in enumerate(df.columns):
    print(f"  {i+1}. {col}")

# Map Excel columns to database columns
# Based on the database schema, we need to map to the 'estudantes' table:
# id, profile_id, genero, qualificacoes, disponibilidade, ativo, congregacao_id, created_at

column_mapping = {
    'user_id': 'user_id',  # Will be used as id in the database
    'nome': 'nome',
    'genero': 'genero',
    'cargo': 'qualificacoes',  # Using cargo as qualificacoes
    'ativo': 'ativo',
    'created_at': 'created_at',
    'updated_at': 'updated_at'
}

# Create a new DataFrame with the mapped columns
df_db = pd.DataFrame()

# Generate UUIDs for id column
df_db['id'] = [str(uuid.uuid4()) for _ in range(len(df))]

# Map the columns
for excel_col, db_col in column_mapping.items():
    if excel_col in df.columns:
        df_db[db_col] = df[excel_col]
    else:
        print(f"⚠️  Column '{excel_col}' not found in Excel file")

# Handle special cases
# Convert 'M'/'F' to 'masculino'/'feminino'
if 'genero' in df_db.columns:
    # Create a mapping function to handle the conversion
    def map_genero(val):
        if pd.isna(val):
            return None
        if val == 'M':
            return 'masculino'
        elif val == 'F':
            return 'feminino'
        else:
            return str(val)
    df_db['genero'] = df_db['genero'].apply(map_genero)

# Convert cargo to array format for qualificacoes
if 'qualificacoes' in df_db.columns:
    df_db['qualificacoes'] = df_db['qualificacoes'].apply(lambda x: [x] if pd.notna(x) else [])

# Set default values for missing columns
if 'disponibilidade' not in df_db.columns:
    df_db['disponibilidade'] = None

if 'congregacao_id' not in df_db.columns:
    df_db['congregacao_id'] = None

# Ensure created_at and updated_at are properly formatted
for date_col in ['created_at', 'updated_at']:
    if date_col in df_db.columns:
        df_db[date_col] = pd.to_datetime(df_db[date_col], errors='coerce')

# Set default values for ativo if not present
if 'ativo' not in df_db.columns:
    df_db['ativo'] = True

# Add profile_id column (can be same as user_id or None for now)
if 'user_id' in df_db.columns:
    df_db['profile_id'] = df_db['user_id']
else:
    df_db['profile_id'] = None

# Reorder columns to match database schema
db_columns = ['id', 'profile_id', 'genero', 'qualificacoes', 'disponibilidade', 'ativo', 'congregacao_id', 'created_at']
df_db = df_db[[col for col in db_columns if col in df_db.columns]]

# Function to check if a value is empty
def is_empty_value(value):
    # Check for empty collections (but not strings, which are also collections)
    if hasattr(value, '__len__') and not isinstance(value, (str, bytes)):
        try:
            return len(value) == 0
        except:
            return False
    return False

# Generate SQL insert statements
print("\n📝 Generating SQL insert statements...")

sql_statements = []
for index, row in df_db.iterrows():
    values = []
    for col in df_db.columns:
        value = row[col]
        # Handle different data types properly
        # Convert pandas values to Python native types
        if hasattr(value, 'item'):
            value = value.item()  # Convert numpy scalars to Python scalars
        
        # Check for null/empty values
        is_null = value is None or (isinstance(value, float) and np.isnan(value))
        is_empty = is_empty_value(value)
        
        if is_null or is_empty:
            values.append('NULL')
        elif col == 'qualificacoes':
            # Convert array to PostgreSQL format
            if isinstance(value, list):
                # Escape single quotes in the list elements
                escaped_list = [str(item).replace("'", "''") for item in value]
                values.append(f"ARRAY{escaped_list}::TEXT[]")
            else:
                values.append("'{}'")
        elif col == 'ativo':
            # Handle boolean values
            bool_value = bool(value) if not is_null else False
            values.append(str(bool_value).upper())
        elif col in ['genero']:
            # Handle text values
            str_value = str(value).replace("'", "''")
            values.append(f"'{str_value}'")
        elif col in ['created_at', 'updated_at']:
            # Handle datetime values
            if is_null:
                values.append('NULL')
            else:
                values.append(f"'{value}'")
        else:
            # Handle other values
            str_value = str(value).replace("'", "''")
            values.append(f"'{str_value}'")
    
    sql = f"INSERT INTO public.estudantes ({', '.join(df_db.columns)}) VALUES ({', '.join(values)});"
    sql_statements.append(sql)

# Save SQL statements to a file
output_sql_file = r"C:\Users\webbe\Documents\GitHub\career-pathways-31\estudantes_insert.sql"
try:
    with open(output_sql_file, 'w', encoding='utf-8') as f:
        f.write("-- SQL statements to insert students data\n")
        f.write("-- Generated on: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\n\n")
        for sql in sql_statements:
            f.write(sql + "\n")
    print(f"✅ SQL statements saved to: {output_sql_file}")
except Exception as e:
    print(f"❌ Error saving SQL file: {e}")

# Also save a simplified version that matches the existing estudantes_rows_corrigido.sql format
print("\n📝 Generating simplified SQL insert statements...")

simplified_sql_statements = []
for index, row in df_db.iterrows():
    # Only include the columns that exist in the target table
    cols = ['id', 'profile_id', 'genero', 'qualificacoes', 'ativo', 'created_at']
    values = []
    
    for col in cols:
        if col in df_db.columns:
            value = row[col]
            # Convert pandas values to Python native types
            if hasattr(value, 'item'):
                value = value.item()  # Convert numpy scalars to Python scalars
            
            # Check for null/empty values
            is_null = value is None or (isinstance(value, float) and np.isnan(value))
            is_empty = is_empty_value(value)
            
            if is_null or is_empty:
                values.append('NULL')
            elif col == 'qualificacoes':
                # Convert array to PostgreSQL format
                if isinstance(value, list) and len(value) > 0:
                    # Escape single quotes in the list elements
                    escaped_list = [str(item).replace("'", "''") for item in value]
                    values.append(f"ARRAY{escaped_list}::TEXT[]")
                else:
                    values.append("'{}'")
            elif col == 'ativo':
                # Handle boolean values
                bool_value = bool(value) if not is_null else False
                values.append(str(bool_value).upper())
            elif col in ['genero']:
                # Handle text values
                str_value = str(value).replace("'", "''")
                values.append(f"'{str_value}'")
            elif col in ['created_at', 'updated_at']:
                # Handle datetime values
                if is_null:
                    values.append('NULL')
                else:
                    values.append(f"'{value}'")
            else:
                # Handle other values
                str_value = str(value).replace("'", "''")
                values.append(f"'{str_value}'")
        else:
            values.append('NULL')
    
    sql = f"INSERT INTO public.estudantes ({', '.join([c for c in cols if c in df_db.columns])}) VALUES ({', '.join(values)});"
    simplified_sql_statements.append(sql)

# Save simplified SQL statements to a file
simplified_output_file = r"C:\Users\webbe\Documents\GitHub\career-pathways-31\estudantes_insert_simplified.sql"
try:
    with open(simplified_output_file, 'w', encoding='utf-8') as f:
        f.write("-- Simplified SQL statements to insert students data\n")
        f.write("-- Generated on: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + "\n\n")
        for sql in simplified_sql_statements:
            f.write(sql + "\n")
    print(f"✅ Simplified SQL statements saved to: {simplified_output_file}")
except Exception as e:
    print(f"❌ Error saving simplified SQL file: {e}")

print(f"\n📊 Summary:")
print(f"  - Records processed: {len(df)}")
print(f"  - SQL statements generated: {len(sql_statements)}")
print(f"  - Simplified SQL statements generated: {len(simplified_sql_statements)}")
print(f"\n📋 Next steps:")
print(f"  1. Review the generated SQL files:")
print(f"     - {output_sql_file}")
print(f"     - {simplified_output_file}")
print(f"  2. Execute the SQL statements in your Supabase database")
print(f"  3. Verify the data was inserted correctly")