# 🚀 Sistema Ministerial - Edge Functions Implementation

## ✅ CORS Issues RESOLVED - Complete Solution

This document provides comprehensive setup instructions for the **Sistema Ministerial** with fully implemented Supabase Edge Functions that resolve all CORS issues and provide complete workflow functionality.

## 🎯 What's Been Implemented

### **✅ Complete Edge Functions Suite**

1. **`list-programs-json`** - Program data retrieval with CORS handling
2. **`generate-assignments`** - Full S-38 algorithm implementation for assignment generation  
3. **`save-assignments`** - Assignment persistence with validation

### **✅ Frontend Integration**
- Updated `ProgramasPage.tsx` to use Edge Functions
- Updated `DesignacoesPage.tsx` to use Edge Functions
- Replaced all backend API calls with Edge Function calls
- Proper authentication with `VITE_SUPABASE_ANON_KEY`

### **✅ Testing & Deployment Tools**
- Automated deployment script (`deploy-functions.bat`)
- Complete workflow testing (`test-complete-workflow.html`)
- Edge Function testing (`test-edge-function.html`)

---

## 🛠️ Installation & Setup

### **Prerequisites**
- Node.js 18+
- Supabase CLI installed (`npm i -g @supabase/cli`)
- Active Supabase project

### **Step 1: Environment Setup**

Create `.env.local` in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://dlvojolvdsqrfczjjjuw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsdm9qb2x2ZHNxcmZjempqanV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE0MDcyNzMsImV4cCI6MjA0Njk4MzI3M30.nUrN2bCd-pX6bJOV1fTxhI8CamBW1yZpFQLX6qTLzsk

# Development Settings
NODE_ENV=development
VITE_APP_ENV=development
VITE_API_BASE=http://localhost:3001
```

### **Step 2: Install Dependencies**

```bash
npm install
```

### **Step 3: Deploy Edge Functions**

#### **Option A: Automated Deployment (Recommended)**
```bash
# Run the automated deployment script
deploy-functions.bat
```

#### **Option B: Manual Deployment**
```bash
# Login to Supabase (if not already logged in)
supabase login

# Link to project
supabase link --project-ref dlvojolvdsqrfczjjjuw

# Deploy functions individually
supabase functions deploy list-programs-json
supabase functions deploy generate-assignments  
supabase functions deploy save-assignments
```

### **Step 4: Verify Deployment**

Open `test-complete-workflow.html` in your browser and run the complete test to verify all functions are working correctly.

---

## 🔧 Edge Functions Details

### **1. list-programs-json**
- **Purpose**: Load program data with proper CORS handling
- **URL**: `https://dlvojolvdsqrfczjjjuw.supabase.co/functions/v1/list-programs-json`
- **Method**: POST
- **Body**: `{ "limit": 10 }`

### **2. generate-assignments**  
- **Purpose**: Generate assignments using S-38 algorithm
- **URL**: `https://dlvojolvdsqrfczjjjuw.supabase.co/functions/v1/generate-assignments`
- **Method**: POST
- **Body**: 
```json
{
  "semana": "2024-12-09",
  "data_reuniao": "2024-12-09",
  "partes_customizadas": [...]
}
```

### **3. save-assignments**
- **Purpose**: Save assignments with S-38 validation
- **URL**: `https://dlvojolvdsqrfczjjjuw.supabase.co/functions/v1/save-assignments` 
- **Method**: POST
- **Body**:
```json
{
  "assignments": [...],
  "program_id": "program_id",
  "week_date": "2024-12-09"
}
```

---

## 🎯 User Workflow (CORS-Free)

### **1. Students Management** (`/estudantes`)
- Load and manage student data
- Students are stored in Supabase database
- Real-time synchronization

### **2. Programs Management** (`/programas`)  
- **✅ CORS RESOLVED**: Uses `list-programs-json` Edge Function
- Load programs from database via Edge Function
- No more "Unexpected token '<'" errors
- Import PDF functionality

### **3. Assignments Generation** (`/designacoes`)
- **✅ CORS RESOLVED**: Uses `generate-assignments` Edge Function
- Full S-38 algorithm implementation:
  - Gender-based assignment rules
  - Role-based priorities (elders, servants)  
  - Qualification filtering
  - Fair rotation system
  - Assistant matching with family support
- Real-time assignment generation with validation

### **4. Assignment Persistence**
- **✅ CORS RESOLVED**: Uses `save-assignments` Edge Function
- S-38 rule validation before saving
- Conflict detection and reporting
- Assignment history tracking

---

## 🚨 CORS Issues - COMPLETELY RESOLVED

### **Before (Problems)**
```javascript
// This caused CORS errors:
fetch('http://localhost:3001/api/programacoes/mock')
// Error: "Unexpected token '<'" 
```

### **After (Solutions)**
```javascript
// Now uses Edge Functions with proper CORS:
fetch(`${VITE_SUPABASE_URL}/functions/v1/list-programs-json`, {
  headers: { 'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY}` }
})
// Result: ✅ Perfect JSON responses with CORS headers
```

---

## 🧪 Testing & Validation

### **Automated Testing**
```bash
# Open test interface
start test-complete-workflow.html

# Or test individual functions
start test-edge-function.html
```

### **Manual Testing**
1. **Programs**: Navigate to `/programas` → Click "Carregar Programas"
2. **Assignments**: Navigate to `/designacoes` → Select program → Click "Gerar Designações"
3. **Persistence**: After generating assignments → Click "Salvar Designações"

### **Expected Results**
- ✅ No CORS errors
- ✅ Real JSON data from Edge Functions
- ✅ S-38 algorithm working correctly
- ✅ Assignment validation and persistence

---

## 📊 S-38 Algorithm Features

### **Official JW Organization Rules Implemented**

#### **Gender Rules**
- Bible Reading: Males only
- Talks (Treasures, Gems, Congregation Study): Males only  
- Demonstrations: Any gender with proper assistant matching

#### **Role-Based Priorities**
- Opening Comments: Elders or Ministerial Servants only
- Talks: Prioritize Elders, then Ministerial Servants
- Other parts: Based on qualifications

#### **Qualification System**  
- `chairman`: Can handle opening comments
- `tresures`: Can give Treasures talks
- `gems`: Can give Spiritual Gems
- `reading`: Can do Bible reading
- `starting`, `following`, `making`, `explaining`: Ministry demonstrations
- `talk`: Can give talks

#### **Fair Rotation**
- Tracks assignment history per student
- Distributes assignments based on previous participation
- Prevents overloading specific students

#### **Assistant Matching**
- Same gender requirement for demonstrations
- Family member exception (allows opposite gender if family)
- Automatic assistant selection based on availability

---

## 🔒 Authentication & Security

### **Environment Variables**
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Public anon key for authentication
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side key (Edge Functions only)

### **Security Features**
- Row Level Security (RLS) policies in Supabase
- JWT-based authentication
- Input validation in Edge Functions
- S-38 rule validation before saving

---

## 🚀 Deployment to Production

### **Frontend Deployment**
```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify
# Set environment variables in deployment platform
```

### **Edge Functions**
- Already deployed to Supabase cloud
- No additional configuration needed
- Monitor via Supabase Dashboard → Edge Functions

---

## 🆘 Troubleshooting

### **Common Issues & Solutions**

#### **CORS Errors**
- ✅ **RESOLVED**: All CORS issues fixed with Edge Functions
- If still occurring: Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

#### **Function Not Found (404)**  
```bash
# Redeploy functions
deploy-functions.bat
```

#### **Authentication Errors (401)**
- Check `VITE_SUPABASE_ANON_KEY` in `.env.local`
- Verify key is correct in Supabase Dashboard

#### **Function Timeout/Error (500)**
- Check Supabase function logs in Dashboard
- Verify database connection and student data exists

### **Debug Tools**
1. **Complete Workflow Test**: `test-complete-workflow.html`
2. **Individual Function Test**: `test-edge-function.html`  
3. **Browser DevTools**: Check Network tab for detailed error messages
4. **Supabase Dashboard**: Monitor function execution logs

---

## 🎉 Success Criteria

After following this setup, you should have:

✅ **Zero CORS errors** in browser console  
✅ **Working program loading** from Edge Functions  
✅ **Functional assignment generation** with S-38 algorithm  
✅ **Assignment persistence** with validation  
✅ **Complete workflow**: Students → Programs → Assignments → Reports  
✅ **Production-ready deployment** with automated testing  

---

## 📞 Support & Updates

This implementation provides a **complete, production-ready solution** for the Sistema Ministerial with:

- **Full CORS resolution**
- **Official S-38 algorithm implementation**  
- **Real-time database integration**
- **Comprehensive testing suite**
- **Automated deployment tools**

The system is now **fully functional** and ready for production use! 🚀