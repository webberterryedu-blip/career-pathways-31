# Treasures From God's Word Assignment Function

This documentation explains how to use the new Supabase Edge Function for generating assignments based on the "Treasures From God's Word" meeting structure.

## Overview

The `generate-treasures-assignments` function implements the official meeting structure with specific rules for each part, including gender requirements, role restrictions, and assistant matching.

## Meeting Structure Implementation

### 1. Talk (10 minutes)
- **Requirements**: Delivered by an elder or qualified ministerial servant
- **Rules**: Follows theme and outline in Life and Ministry Meeting Workbook

### 2. Spiritual Gems (10 minutes)
- **Requirements**: Managed by an elder or ministerial servant
- **Rules**: Question-and-answer segment with brief audience responses

### 3. Bible Reading (4 minutes)
- **Requirements**: Handled by a male student
- **Rules**: Accurate and fluent reading with proper pronunciation

### 4. Apply Yourself to the Field Ministry (15 minutes)
- **Requirements**: Can be assigned to qualified students
- **Practice Mode**: Detailed assignments for Starting a Conversation, Following Up, and Making Disciples

### 5. Starting a Conversation
- **Requirements**: Students of either gender with assistant of same gender or family member
- **Rules**: Focus on natural conversation and relevant Bible truths

### 6. Following Up
- **Requirements**: Students with assistant of same gender
- **Rules**: Clear, natural follow-up techniques

### 7. Making Disciples
- **Requirements**: Students with assistant of same gender
- **Rules**: Convey study material clearly, modeling effective teaching

### 8. Explaining Your Beliefs
- **Requirements**: Male students for talks, either gender for demonstrations
- **Rules**: Tactful answers using reference material

### 9. Talk (Student Assignment)
- **Requirements**: Male students presenting talks based on Love People brochure
- **Rules**: Practical application of verses in ministry

### 11. Living as Christians
- **Requirements**: Assignments for elders or ministerial servants
- **Rules**: Discussion encouraging audience participation

### 12. Congregation Bible Study (30 minutes)
- **Requirements**: Led by a qualified elder
- **Rules**: Thorough review with emphasis on key scriptures

## API Endpoint

```
POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/generate-treasures-assignments
```

### Headers
```
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json
```

### Request Body
```json
{
  "semana": "2024-12-09",
  "data_reuniao": "2024-12-09",
  "modo_pratica": false
}
```

### Parameters
- `semana`: Week identifier (string)
- `data_reuniao`: Meeting date (ISO format)
- `modo_pratica`: Boolean to enable detailed field ministry assignments

## Response Format

```json
{
  "success": true,
  "message": "Treasures From God's Word assignments generated successfully",
  "data": {
    "designacoes": [...],
    "estatisticas": {...},
    "resultados_completos": [...]
  }
}
```

## Deployment

To deploy the function:

1. Ensure Supabase CLI is installed:
   ```bash
   npm install -g @supabase/cli
   ```

2. Deploy the function:
   ```bash
   supabase functions deploy generate-treasures-assignments
   ```

3. Or use the provided batch file:
   ```bash
   deploy-treasures-function.bat
   ```

## Testing

Use the provided test file `test-treasures-function.html` to test the function in a browser.

## Frontend Integration

The new page `/treasures-designacoes` provides a user interface for generating these assignments with:
- Date selection
- Practice mode toggle
- Congregation selection
- Assignment display and statistics

## Rules Implementation

The function implements fair rotation algorithms that consider:
- Previous assignment history
- Role priorities (elders first)
- Qualification matching
- Gender requirements
- Assistant pairing rules