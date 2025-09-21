import { supabase } from "@/integrations/supabase/client";

export const createTestUsers = async () => {
  console.log("Creating test users...");
  
  // Create instructor user
  const instructorEmail = "frankwebber33@hotmail.com";
  const instructorPassword = "13a21r15";
  
  const { data: instructorData, error: instructorError } = await supabase.auth.signUp({
    email: instructorEmail,
    password: instructorPassword,
    options: {
      data: {
        nome: "Frank Webber",
        role: "instrutor"
      }
    }
  });
  
  if (instructorError) {
    console.error("Error creating instructor user:", instructorError.message);
  } else {
    console.log("Instructor user created successfully:", instructorData.user?.id);
  }
  
  // Create student user
  const studentEmail = "franklinmarceloferreiradelima@gmail.com";
  const studentPassword = "13a21r15";
  
  const { data: studentData, error: studentError } = await supabase.auth.signUp({
    email: studentEmail,
    password: studentPassword,
    options: {
      data: {
        nome: "Franklin Marcelo",
        role: "estudante"
      }
    }
  });
  
  if (studentError) {
    console.error("Error creating student user:", studentError.message);
  } else {
    console.log("Student user created successfully:", studentData.user?.id);
  }
  
  console.log("Test users creation process completed.");
};