import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SupabaseDebug: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const testSupabaseConnection = async () => {
    setIsLoading(true);
    try {
      // Test basic connection by querying a simple table
      console.log('Testing Supabase connection...');
      
      // First, let's check if we can access the client
      console.log('Supabase client:', supabase);
      
      // Test a simple query that should work with the ANON key
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        setTestResult(`❌ Error: ${error.message}`);
        console.error('Supabase Error:', error);
      } else {
        setTestResult(`✅ Success! Found ${data?.length || 0} profiles`);
        console.log('Profiles data:', data);
      }
    } catch (err) {
      setTestResult(`❌ Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Exception:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Run test on component mount
    testSupabaseConnection();
  }, []);

  return (
    <div className="p-4 bg-red-100 border border-red-400 rounded-lg mt-4">
      <h2 className="text-lg font-bold mb-2">Supabase Debug Test</h2>
      <button 
        onClick={testSupabaseConnection}
        disabled={isLoading}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Connection'}
      </button>
      
      <div className="mt-4 p-2 bg-white rounded">
        <p className="font-bold">Test Result:</p>
        <p>{testResult}</p>
      </div>
    </div>
  );
};

export default SupabaseDebug;