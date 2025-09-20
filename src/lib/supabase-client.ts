import { supabase } from "@/integrations/supabase/client";

// Temporary type helper until database types refresh
export const supabaseClient = supabase as any;

export default supabaseClient;