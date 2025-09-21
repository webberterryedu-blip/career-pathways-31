# Local Development Script for Supabase Edge Functions
# This script starts the Supabase local development environment with Edge Functions

Write-Host "🚀 Starting Supabase Local Development Environment..." -ForegroundColor Green

# Check if Supabase CLI is installed
try {
    $supabaseVersion = supabase --version
    Write-Host "✅ Supabase CLI found: $supabaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found or not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Start Supabase local development environment
Write-Host "🔄 Starting Supabase services..." -ForegroundColor Cyan
try {
    supabase start
    Write-Host "✅ Supabase services started successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start Supabase services: $_" -ForegroundColor Red
    exit 1
}

# Deploy functions to local environment
Write-Host "📦 Deploying functions to local environment..." -ForegroundColor Cyan
try {
    supabase functions deploy list-programs-json --local
    supabase functions deploy generate-assignments --local
    supabase functions deploy save-assignments --local
    Write-Host "✅ Functions deployed to local environment" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to deploy functions locally: $_" -ForegroundColor Red
}

Write-Host "🔧 Setting up local function permissions..." -ForegroundColor Cyan
try {
    supabase functions set-invoker list-programs-json authenticated --local
    supabase functions set-invoker generate-assignments authenticated --local
    supabase functions set-invoker save-assignments authenticated --local
    Write-Host "✅ Local function permissions set successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Failed to set local function permissions: $_" -ForegroundColor Yellow
}

Write-Host "🎉 Local development environment is ready!" -ForegroundColor Green
Write-Host "🌐 Supabase Studio: http://localhost:54323" -ForegroundColor White
Write-Host "🔌 Edge Functions URL: http://localhost:54321/functions/v1/" -ForegroundColor White
Write-Host "📝 Test functions with curl:" -ForegroundColor Cyan
Write-Host "   curl -X POST http://localhost:54321/functions/v1/list-programs-json \`" -ForegroundColor White
Write-Host "     -H 'Authorization: Bearer YOUR_ANON_KEY' \`" -ForegroundColor White
Write-Host "     -H 'Content-Type: application/json'" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "⚠️  To stop the local environment, run: supabase stop" -ForegroundColor Yellow