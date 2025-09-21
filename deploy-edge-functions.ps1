# Deployment Script for Supabase Edge Functions
# This script deploys all Edge Functions to Supabase

Write-Host "🚀 Deploying Supabase Edge Functions..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Get project reference from supabase config or prompt user
$projectRef = ""
try {
    $config = Get-Content -Path ".\supabase\config.toml" -ErrorAction Stop
    $projectRef = ($config | Select-String "project_id").Line -replace '.*project_id = "(.*)".*', '$1'
} catch {
    Write-Host "⚠️  Project ID not found in config. Please enter your Supabase Project Reference:" -ForegroundColor Yellow
    $projectRef = Read-Host "Project Reference"
}

if ([string]::IsNullOrEmpty($projectRef)) {
    Write-Host "❌ Project Reference is required" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Deploying list-programs-json function..." -ForegroundColor Cyan
try {
    supabase functions deploy list-programs-json --project-ref $projectRef
    Write-Host "✅ list-programs-json deployed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy list-programs-json: $_" -ForegroundColor Red
}

Write-Host "📦 Deploying generate-assignments function..." -ForegroundColor Cyan
try {
    supabase functions deploy generate-assignments --project-ref $projectRef
    Write-Host "✅ generate-assignments deployed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy generate-assignments: $_" -ForegroundColor Red
}

Write-Host "📦 Deploying save-assignments function..." -ForegroundColor Cyan
try {
    supabase functions deploy save-assignments --project-ref $projectRef
    Write-Host "✅ save-assignments deployed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy save-assignments: $_" -ForegroundColor Red
}

Write-Host "🔧 Setting up function permissions..." -ForegroundColor Cyan
try {
    # Set function permissions (adjust as needed)
    supabase functions set-invoker list-programs-json authenticated --project-ref $projectRef
    supabase functions set-invoker generate-assignments authenticated --project-ref $projectRef
    supabase functions set-invoker save-assignments authenticated --project-ref $projectRef
    Write-Host "✅ Function permissions set successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Failed to set function permissions: $_" -ForegroundColor Yellow
}

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify functions are working in the Supabase dashboard" -ForegroundColor White
Write-Host "   2. Test the application to ensure Edge Functions are being used" -ForegroundColor White
Write-Host "   3. Check logs for any errors: supabase functions logs FUNCTION_NAME --project-ref $projectRef" -ForegroundColor White