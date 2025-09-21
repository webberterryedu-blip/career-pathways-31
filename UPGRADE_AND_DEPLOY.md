# Upgrading Supabase and Deploying Edge Functions

## Current Limitation

The free-tier Supabase account does not support Edge Functions deployment, which is why you're seeing 403 Forbidden errors when the application tries to call the Edge Functions.

## Step-by-Step Upgrade Process

### 1. Upgrade Your Supabase Account

1. Go to the [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to "Billing" in the left sidebar
4. Click "Upgrade Project"
5. Choose the "Pro" plan (starts at $25/month)
6. Complete the payment process

### 2. Get Your Project Reference

1. In the Supabase Dashboard, go to "Project Settings"
2. Copy your "Reference ID" (it looks like a random string of letters and numbers)

### 3. Deploy Edge Functions

Run the deployment script:
```powershell
# On Windows
.\deploy-edge-functions.ps1

# On macOS/Linux
chmod +x deploy-edge-functions.sh
./deploy-edge-functions.sh
```

Or deploy manually:
```bash
cd supabase
supabase functions deploy list-programs-json --project-ref YOUR_PROJECT_ID
supabase functions deploy generate-assignments --project-ref YOUR_PROJECT_ID
supabase functions deploy save-assignments --project-ref YOUR_PROJECT_ID
```

### 4. Set Function Permissions

```bash
supabase functions set-invoker list-programs-json authenticated --project-ref YOUR_PROJECT_ID
supabase functions set-invoker generate-assignments authenticated --project-ref YOUR_PROJECT_ID
supabase functions set-invoker save-assignments authenticated --project-ref YOUR_PROJECT_ID
```

## Verifying Deployment

### Check Function Status
1. Go to Supabase Dashboard
2. Navigate to "Edge Functions" in the left sidebar
3. You should see all three functions listed with "Deployed" status

### Test Functions
Use curl or Postman to test the functions:
```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/list-programs-json \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Benefits of Using Edge Functions

Once deployed, the Edge Functions will provide:

1. **Better Performance**: Functions run closer to your users
2. **Reduced Backend Load**: Processing happens at the edge
3. **Improved Security**: Database operations are encapsulated in functions
4. **S-38 Compliance**: Official assignment algorithm with validation
5. **Automatic Scaling**: Functions scale automatically with demand

## Cost Considerations

The Pro plan includes:
- 500,000 function invocations per month
- 2GB database storage
- 10GB bandwidth
- Up to 50 concurrent users

Additional usage is billed according to the [Supabase pricing](https://supabase.com/pricing).

## Alternative: Local Development

For development and testing, you can run the Edge Functions locally:

```powershell
# Start local Supabase environment
.\start-local-edge-functions.ps1
```

This creates a complete local development environment with all services including Edge Functions.

## Troubleshooting

### Common Issues

1. **Deployment Fails**: Ensure your project is on a paid plan
2. **Permission Errors**: Check that function permissions are set correctly
3. **CORS Issues**: Verify the CORS headers in the Edge Functions
4. **Timeout Errors**: Check function execution time limits

### Logs and Monitoring

View function logs in the Supabase Dashboard or via CLI:
```bash
supabase functions logs FUNCTION_NAME --project-ref YOUR_PROJECT_ID
```

## Rollback Plan

If you need to revert to the fallback system:
1. The application will automatically use backend APIs when Edge Functions are unavailable
2. No code changes are required
3. All functionality remains intact with slightly reduced performance

## Support

For issues with deployment or Supabase account upgrades, contact:
- [Supabase Support](https://supabase.com/support)
- Community forums: [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)