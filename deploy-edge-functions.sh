#!/bin/bash

# Deployment Script for Supabase Edge Functions
# This script deploys all Edge Functions to Supabase

echo -e "\033[0;32m🚀 Deploying Supabase Edge Functions...\033[0m"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo -e "\033[0;31m❌ Supabase CLI not found. Please install it first:\033[0m"
    echo -e "\033[0;33m   npm install -g supabase\033[0m"
    exit 1
fi

supabaseVersion=$(supabase --version)
echo -e "\033[0;32m✅ Supabase CLI found: $supabaseVersion\033[0m"

# Get project reference from supabase config or prompt user
projectRef=""
if [ -f "./supabase/config.toml" ]; then
    projectRef=$(grep "project_id" ./supabase/config.toml | sed -E 's/.*project_id = "(.*)".*/\1/')
fi

if [ -z "$projectRef" ]; then
    echo -e "\033[0;33m⚠️  Project ID not found in config. Please enter your Supabase Project Reference:\033[0m"
    read -p "Project Reference: " projectRef
fi

if [ -z "$projectRef" ]; then
    echo -e "\033[0;31m❌ Project Reference is required\033[0m"
    exit 1
fi

echo -e "\033[0;36m📦 Deploying list-programs-json function...\033[0m"
if supabase functions deploy list-programs-json --project-ref "$projectRef"; then
    echo -e "\033[0;32m✅ list-programs-json deployed successfully\033[0m"
else
    echo -e "\033[0;31m❌ Failed to deploy list-programs-json\033[0m"
fi

echo -e "\033[0;36m📦 Deploying generate-assignments function...\033[0m"
if supabase functions deploy generate-assignments --project-ref "$projectRef"; then
    echo -e "\033[0;32m✅ generate-assignments deployed successfully\033[0m"
else
    echo -e "\033[0;31m❌ Failed to deploy generate-assignments\033[0m"
fi

echo -e "\033[0;36m📦 Deploying save-assignments function...\033[0m"
if supabase functions deploy save-assignments --project-ref "$projectRef"; then
    echo -e "\033[0;32m✅ save-assignments deployed successfully\033[0m"
else
    echo -e "\033[0;31m❌ Failed to deploy save-assignments\033[0m"
fi

echo -e "\033[0;36m🔧 Setting up function permissions...\033[0m"
if supabase functions set-invoker list-programs-json authenticated --project-ref "$projectRef" && \
   supabase functions set-invoker generate-assignments authenticated --project-ref "$projectRef" && \
   supabase functions set-invoker save-assignments authenticated --project-ref "$projectRef"; then
    echo -e "\033[0;32m✅ Function permissions set successfully\033[0m"
else
    echo -e "\033[0;33m⚠️  Failed to set function permissions\033[0m"
fi

echo -e "\033[0;32m🎉 Deployment complete!\033[0m"
echo -e "\033[0;36m📝 Next steps:\033[0m"
echo -e "\033[0;37m   1. Verify functions are working in the Supabase dashboard\033[0m"
echo -e "\033[0;37m   2. Test the application to ensure Edge Functions are being used\033[0m"
echo -e "\033[0;37m   3. Check logs for any errors: supabase functions logs FUNCTION_NAME --project-ref $projectRef\033[0m"