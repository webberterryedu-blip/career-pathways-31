// Test different import methods
console.log('Testing Supabase client import methods...');

try {
  // Method 1: Named import (ES module syntax)
  await import('./src/integrations/supabase/client.js').then(module => {
    console.log('✅ Named import successful');
    console.log('Module exports:', Object.keys(module));
    if (module.supabase) {
      console.log('✅ supabase named export found');
    } else {
      console.log('❌ supabase named export not found');
    }
  }).catch(err => {
    console.log('❌ Named import failed:', err.message);
  });
} catch (error) {
  console.log('❌ Named import test failed:', error.message);
}

try {
  // Method 2: Default import (ES module syntax)
  await import('./src/integrations/supabase/client.js').then(module => {
    console.log('✅ Default import successful');
    if (module.default) {
      console.log('✅ supabase default export found');
    } else {
      console.log('❌ supabase default export not found');
    }
  }).catch(err => {
    console.log('❌ Default import failed:', err.message);
  });
} catch (error) {
  console.log('❌ Default import test failed:', error.message);
}