# 🔐 Secret Handling Guide - Resolving GitHub Push Protection

## Problem
GitHub's push protection is blocking your push because it detected a GitHub Personal Access Token in commit `6f2a23520714340ee3fe608b868b8900405dd84f` in the file [FIXED-mcp.json](file://c:\Users\webbe\Documents\GitHub\career-pathways-31\FIXED-mcp.json).

## Solution Options

### Option 1: Allow the Secret (Recommended)
Since you've already removed the secret from the current codebase, you can simply allow this specific secret through GitHub's interface:

1. **Click the link** provided in the error message:
   ```
   https://github.com/webberterryedu-blip/career-pathways-31/security/secret-scanning/unblock-secret/331ZzNpjPMhfcJcXWyjRd6bZD2k
   ```

2. **Review and confirm** that this secret is no longer in use

3. **Allow the secret** to proceed with the push

### Option 2: Rewrite Git History (Advanced)
If you prefer to completely remove the secret from git history:

1. **Install BFG Repo-Cleaner** (easier than git filter-branch):
   ```bash
   # Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
   ```

2. **Create a file** with the secret to remove:
   ```bash
   echo "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" > secrets.txt
   ```

3. **Run BFG** to remove the secret:
   ```bash
   java -jar bfg.jar --replace-text secrets.txt
   ```

4. **Clean up** the repository:
   ```bash
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   ```

5. **Force push** the cleaned history:
   ```bash
   git push origin main --force
   ```

### Option 3: Create a New Branch (Safest)
1. **Create a new branch** from the current state:
   ```bash
   git checkout -b clean-main
   ```

2. **Push the new branch**:
   ```bash
   git push origin clean-main
   ```

3. **Switch the default branch** on GitHub to `clean-main`

4. **Delete the old main branch** (after confirming everything works)

## Best Practices Going Forward

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Add sensitive files** to `.gitignore`
4. **Provide example files** (`.env.example`) for team members
5. **Enable GitHub Secret Scanning** for your repository

## Verification

After resolving the issue:
- ✅ You can successfully push to the repository
- ✅ No sensitive data is exposed in the codebase
- ✅ MCP servers still function with environment variables
- ✅ Other developers can set up their environment using the example file