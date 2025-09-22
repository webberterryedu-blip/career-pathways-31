// Simple test to verify AuthProvider export
import { AuthProvider } from '@/contexts/AuthContext';

console.log('AuthProvider import test:');
console.log('AuthProvider is defined:', typeof AuthProvider !== 'undefined');
console.log('AuthProvider type:', typeof AuthProvider);