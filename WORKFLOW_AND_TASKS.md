# Sistema Ministerial - Workflow and Task List

## 🔄 User Workflow

The system follows a specific workflow for instructors to manage students and assignments:

1. **[/estudantes](file:///C:/Users/webbe/Documents/GitHub/career-pathways-31/src/pages/EstudantesPage.tsx#L24-L24) (Students)**
   - Manage student profiles
   - Add/remove students
   - Update student information and qualifications

2. **[/programas](file:///C:/Users/webbe/Documents/GitHub/career-pathways-31/src/pages/ProgramasPage.tsx#L51-L51) (Programs)**
   - Upload and process Watchtower publications
   - Parse PDFs to extract program content
   - Manage program schedules

3. **[/designacoes](file:///C:/Users/webbe/Documents/GitHub/career-pathways-31/src/pages/DesignacoesPage.tsx#L43-L43) (Assignments)**
   - Generate automatic assignments based on S-38 rules
   - Review and adjust assignments
   - Assign parts to students

4. **[/relatorios](file:///C:/Users/webbe/Documents/GitHub/career-pathways-31/src/pages/RelatoriosPage.tsx#L26-L26) (Reports)**
   - View assignment history
   - Generate qualification reports
   - Track student progress

## 🛠️ Technical Task List

### Authentication & Authorization
- [x] Fix Supabase client configuration
- [x] Standardize environment variables
- [x] Create test users for development
- [ ] Implement proper role-based access control
- [ ] Add user profile management
- [ ] Implement password reset functionality

### Student Management
- [x] Create student CRUD operations
- [ ] Implement student qualification tracking
- [ ] Add family member management
- [ ] Implement student search and filtering

### Program Management
- [x] PDF parsing functionality
- [ ] Program scheduling system
- [ ] Content validation and verification
- [ ] Program history tracking

### Assignment Generation
- [x] S-38 rule implementation
- [ ] Automatic assignment algorithm
- [ ] Manual assignment adjustments
- [ ] Assignment conflict resolution

### Reporting & Analytics
- [ ] Student progress reports
- [ ] Qualification tracking
- [ ] Assignment history
- [ ] Congregation statistics

### Offline Functionality
- [ ] Service worker implementation
- [ ] Local data caching
- [ ] Sync functionality
- [ ] Offline assignment management

### Notification System
- [ ] Email notifications
- [ ] WhatsApp notifications
- [ ] Assignment reminders
- [ ] System alerts

## 🔧 Supabase Edge Functions

The system requires three Supabase Edge Functions for full operation:

1. **list-programs-json** (read)
   - Reads program data from storage
   - Returns JSON formatted program content

2. **generate-assignments** (create/generate)
   - Implements S-38 assignment algorithm
   - Generates assignments based on student qualifications

3. **save-assignments** (update/persist)
   - Saves generated assignments to database
   - Handles assignment updates and modifications

## 📊 Database Schema

### Core Tables
- `profiles` - User profiles with roles
- `estudantes` - Student information and qualifications
- `programacoes` - Program schedules and content
- `designacoes` - Assignment records
- `familiares` - Family member information

### Relationships
- Users (profiles) → Students (estudantes)
- Programs (programacoes) → Assignments (designacoes)
- Students (estudantes) → Assignments (designacoes)
- Students (estudantes) → Family Members (familiares)

## 🌐 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /auth/logout` - User logout

### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create new student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Programs
- `GET /api/programs` - List all programs
- `POST /api/programs` - Create new program
- `GET /api/programs/:id` - Get program details
- `PUT /api/programs/:id` - Update program
- `DELETE /api/programs/:id` - Delete program

### Assignments
- `GET /api/assignments` - List all assignments
- `POST /api/assignments` - Create new assignment
- `GET /api/assignments/:id` - Get assignment details
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

### Reports
- `GET /api/reports/student-progress` - Student progress report
- `GET /api/reports/qualifications` - Qualification report
- `GET /api/reports/assignment-history` - Assignment history