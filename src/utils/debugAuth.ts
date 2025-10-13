// @ts-nocheck
/**
 * Debug utilities for authentication issues
 */
import { supabase } from '@/integrations/supabase/client';

// Add debug utilities to window object for console access
declare global {
  interface Window {
    debugAuth: {
      checkUser: (email: string) => Promise<void>;
      listUsers: () => Promise<void>;
      createTestUser: (email: string, password: string) => Promise<void>;
      resetPassword: (email: string) => Promise<void>;
      checkConnection: () => Promise<void>;
      getSession: () => Promise<void>;
    };
  }
}

export const initializeAuthDebugUtils = () => {
  if (typeof window !== 'undefined') {
    window.debugAuth = {
      // Check if a specific user exists
      checkUser: async (email: string) => {
        try {
          console.log(`🔍 Checking user: ${email}`);
          
          // Try to get user info (this requires admin privileges)
          const { data, error } = await supabase.auth.admin.getUserById('user-id');
          
          if (error) {
            console.log('❌ Cannot check user directly (admin access required)');
            console.log('💡 Try signing in to see if user exists');
          } else {
            console.log('✅ User found:', data);
          }
        } catch (error) {
          console.error('❌ Error checking user:', error);
          console.log('💡 This is normal - admin access is required to check users');
        }
      },

      // List all users (requires admin access)
      listUsers: async () => {
        try {
          console.log('🔍 Attempting to list users...');
          const { data, error } = await supabase.auth.admin.listUsers();
          
          if (error) {
            console.log('❌ Cannot list users (admin access required)');
            console.log('💡 Check users in Supabase Dashboard instead');
          } else {
            console.log('✅ Users found:', data.users.length);
            data.users.forEach(user => {
              console.log(`- ${user.email} (${user.id})`);
            });
          }
        } catch (error) {
          console.error('❌ Error listing users:', error);
          console.log('💡 This is normal - admin access is required');
        }
      },

      // Create a test user
      createTestUser: async (email: string, password: string) => {
        try {
          console.log(`🔧 Creating test user: ${email}`);
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });
          
          if (error) {
            console.error('❌ Error creating user:', error);
          } else {
            console.log('✅ Test user created:', data);
            console.log('📧 Check email for confirmation link');
          }
        } catch (error) {
          console.error('❌ Error creating test user:', error);
        }
      },

      // Reset password
      resetPassword: async (email: string) => {
        try {
          console.log(`🔄 Sending password reset to: ${email}`);
          
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
          });
          
          if (error) {
            console.error('❌ Error sending reset email:', error);
          } else {
            console.log('✅ Password reset email sent');
            console.log('📧 Check email for reset link');
          }
        } catch (error) {
          console.error('❌ Error resetting password:', error);
        }
      },

      // Check Supabase connection
      checkConnection: async () => {
        try {
          console.log('🔍 Checking Supabase connection...');
          
          // Try a simple query
          const { data, error } = await supabase
            .from('profiles')
            .select('count')
            .limit(1);
          
          if (error) {
            console.error('❌ Connection error:', error);
            console.log('💡 Check your Supabase URL and keys in .env');
          } else {
            console.log('✅ Supabase connection working');
            console.log('🔗 URL:', supabase.supabaseUrl);
          }
        } catch (error) {
          console.error('❌ Connection test failed:', error);
        }
      },

      // Get current session
      getSession: async () => {
        try {
          console.log('🔍 Checking current session...');
          
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ Session error:', error);
          } else if (session) {
            console.log('✅ Active session found:');
            console.log('- User:', session.user.email);
            console.log('- Expires:', new Date(session.expires_at! * 1000));
          } else {
            console.log('ℹ️ No active session');
          }
        } catch (error) {
          console.error('❌ Error checking session:', error);
        }
      },
    };

    console.log('🔧 Auth Debug utilities loaded. Available commands:');
    console.log('  debugAuth.checkConnection() - Test Supabase connection');
    console.log('  debugAuth.getSession() - Check current session');
    console.log('  debugAuth.checkUser("email") - Check if user exists');
    console.log('  debugAuth.createTestUser("email", "password") - Create test user');
    console.log('  debugAuth.resetPassword("email") - Send password reset');
    console.log('  debugAuth.listUsers() - List all users (admin only)');
  }
};