// deno-lint-ignore-file
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare Deno namespace for TypeScript
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Assignment Validation Class - Implements S-38 Rules Validation
 */
class AssignmentValidator {
  
  /**
   * Validate assignment against S-38 rules
   */
  validateAssignment(assignment: any, students: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Find student data
    const student = students.find(s => s.user_id === assignment.student_id);
    const assistant = assignment.assistant_id ? 
      students.find(s => s.user_id === assignment.assistant_id) : null;
    
    if (!student) {
      errors.push(`Student not found: ${assignment.student_id}`);
      return { valid: false, errors };
    }
    
    // Check if student is active
    if (!student.ativo) {
      errors.push(`Student ${student.nome} is not active`);
    }
    
    // Validate assignment type rules
    const assignmentType = assignment.assignment_type;
    
    // Bible Reading - Males only
    if (assignmentType === 'bible_reading' && student.genero !== 'masculino') {
      errors.push(`Bible reading requires male student, got ${student.genero}`);
    }
    
    // Treasures Talk and Spiritual Gems - Males only, elders/ministerial servants only
    if ((assignmentType === 'treasures_talk' || assignmentType === 'spiritual_gems') 
        && student.genero !== 'masculino') {
      errors.push(`${assignmentType} requires male student`);
    }
    
    if ((assignmentType === 'treasures_talk' || assignmentType === 'spiritual_gems') 
        && !['anciao', 'servo_ministerial'].includes(student.cargo)) {
      errors.push(`${assignmentType} requires elder or ministerial servant, student is ${student.cargo}`);
    }
    
    // Congregation Bible Study - Males only, elders only
    if (assignmentType === 'congregation_study' && student.genero !== 'masculino') {
      errors.push(`${assignmentType} requires male student`);
    }
    
    if (assignmentType === 'congregation_study' && student.cargo !== 'anciao') {
      errors.push(`${assignmentType} requires elder, student is ${student.cargo}`);
    }
    
    // Talks - Males only, qualified speakers
    if (assignmentType === 'talk' && student.genero !== 'masculino') {
      errors.push(`${assignmentType} requires male student`);
    }
    
    // Opening Comments - Elders/Servants only
    if (assignmentType === 'opening_comments' && 
        !['anciao', 'servo_ministerial'].includes(student.cargo)) {
      errors.push(`Opening comments requires elder or ministerial servant, student is ${student.cargo}`);
    }
    
    // Check qualifications
    const qualificationMap: { [key: string]: string } = {
      'opening_comments': 'chairman',
      'treasures_talk': 'tresures',
      'spiritual_gems': 'gems',
      'bible_reading': 'reading',
      'starting_conversation': 'starting',
      'following_up': 'following',
      'making_disciples': 'making',
      'explaining_beliefs_demo': 'explaining',
      'explaining_beliefs_talk': 'explaining',
      'talk': 'talk',
      'congregation_study': 'talk'
    };
    
    const requiredQualification = qualificationMap[assignmentType];
    if (requiredQualification && !student[requiredQualification]) {
      errors.push(`Student ${student.nome} lacks required qualification: ${requiredQualification}`);
    }
    
    // Validate assistant if present
    if (assistant) {
      // Check if assistant is active
      if (!assistant.ativo) {
        errors.push(`Assistant ${assistant.nome} is not active`);
      }
      
      // For demonstrations, check gender/family rules
      if (['starting_conversation', 'following_up', 'making_disciples', 'explaining_beliefs_demo'].includes(assignmentType)) {
        const sameGender = assistant.genero === student.genero;
        const sameFamily = assistant.family_id === student.family_id;
        
        // For starting_conversation and explaining_beliefs, same gender OR family is allowed
        // For following_up and making_disciples, same gender is required
        if (assignmentType === 'starting_conversation' || assignmentType === 'explaining_beliefs_demo') {
          if (!sameGender && !sameFamily) {
            errors.push(`Assistant must be same gender or family member. Student: ${student.genero}, Assistant: ${assistant.genero}`);
          }
        } else {
          // following_up and making_disciples require same gender
          if (!sameGender) {
            errors.push(`Assistant must be same gender as student. Student: ${student.genero}, Assistant: ${assistant.genero}`);
          }
        }
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  /**
   * Validate all assignments in a batch
   */
  validateAssignmentBatch(assignments: any[], students: any[]): { valid: boolean; results: any[] } {
    const results = assignments.map(assignment => {
      const validation = this.validateAssignment(assignment, students);
      return {
        assignment,
        valid: validation.valid,
        errors: validation.errors
      };
    });
    
    const allValid = results.every(r => r.valid);
    return { valid: allValid, results };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { assignments, program_id, week_date, validate_only = false } = await req.json();
    
    if (!assignments || !Array.isArray(assignments)) {
      throw new Error('assignments array is required');
    }
    
    console.log(`💾 Saving ${assignments.length} assignments for program ${program_id}...`);
    
    // 1. Fetch all active students for validation
    const { data: studentsData, error: studentsError } = await supabase
      .from('vw_estudantes_grid')
      .select('*')
      .eq('ativo', true);
    
    if (studentsError) {
      console.error('Students fetch error:', studentsError);
      throw studentsError;
    }
    
    console.log(`👥 Found ${studentsData?.length || 0} active students for validation`);
    
    // 2. Validate assignments against S-38 rules
    const validator = new AssignmentValidator();
    const validation = validator.validateAssignmentBatch(assignments, studentsData || []);
    
    // If validation only, return validation results
    if (validate_only) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Assignments validated',
          validation_results: validation.results,
          all_valid: validation.valid
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    }
    
    // 3. If validation fails, return errors
    if (!validation.valid) {
      const errorSummary = validation.results
        .filter(r => !r.valid)
        .map(r => `${r.assignment.assignment_title}: ${r.errors.join(', ')}`)
        .join('\n');
      
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Assignment validation failed',
          validation_results: validation.results,
          error_summary: errorSummary
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }
    
    // 4. Prepare assignments for database insertion
    const assignmentsToSave = assignments.map((assignment: any) => ({
      week: week_date || new Date().toISOString().split('T')[0],
      meeting_date: week_date || new Date().toISOString().split('T')[0],
      assignment_type: assignment.assignment_type,
      assignment_title: assignment.assignment_title,
      student_id: assignment.student_id,
      student_name: assignment.student_name,
      assistant_id: assignment.assistant_id || null,
      assistant_name: assignment.assistant_name || null,
      assignment_duration: assignment.assignment_duration || 5,
      observations: assignment.observations || '',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // 5. Check for existing assignments for this week
    if (week_date) {
      const { data: existingAssignments, error: checkError } = await supabase
        .from('assignment_history')
        .select('id')
        .eq('week', week_date);
      
      if (checkError) {
        console.warn('Error checking existing assignments:', checkError);
      } else if (existingAssignments && existingAssignments.length > 0) {
        // Delete existing assignments for this week
        const { error: deleteError } = await supabase
          .from('assignment_history')
          .delete()
          .eq('week', week_date);
        
        if (deleteError) {
          console.warn('Error deleting existing assignments:', deleteError);
        } else {
          console.log(`🗑️ Deleted ${existingAssignments.length} existing assignments for week ${week_date}`);
        }
      }
    }
    
    // 6. Insert new assignments
    const { data: savedAssignments, error: saveError } = await supabase
      .from('assignment_history')
      .insert(assignmentsToSave)
      .select();
    
    if (saveError) {
      console.error('Save error:', saveError);
      throw saveError;
    }
    
    console.log(`✅ Successfully saved ${savedAssignments?.length || 0} assignments`);
    
    // 7. Generate success statistics
    const statistics = {
      total_assignments: assignments.length,
      saved_assignments: savedAssignments?.length || 0,
      validation_passed: validation.valid,
      students_involved: [...new Set(assignments.map((a: any) => a.student_id))].length,
      assistants_involved: [...new Set(assignments.filter((a: any) => a.assistant_id).map((a: any) => a.assistant_id))].length
    };
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Assignments saved successfully',
        data: {
          assignments: savedAssignments,
          statistics,
          validation_results: validation.results
        },
        saved_count: savedAssignments?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Error saving assignments',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});