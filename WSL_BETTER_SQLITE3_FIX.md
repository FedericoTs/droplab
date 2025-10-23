# WSL + better-sqlite3 Fix Guide

## Problem

When running the Next.js development server in WSL (Windows Subsystem for Linux) with the project located on a Windows mount (`/mnt/c/`), you encounter this error:

```
Error: /path/to/node_modules/better-sqlite3/build/Release/better_sqlite3.node: invalid ELF header
code: 'ERR_DLOPEN_FAILED'
```

**Root Cause**: The `better-sqlite3` native module was compiled for Windows but is being loaded in a Linux environment (WSL).

---

## Solution Options

### Option 1: Run from Windows (Recommended for Quick Testing)

**Pros**: No rebuild needed, works immediately
**Cons**: Slower file system access on large projects

```powershell
# Open Windows PowerShell or CMD
cd C:\Users\Samsung\Documents\Projects\Marketing_platform_AI\marketing-ai-demo

# Install dependencies (if needed)
npm install

# Run dev server
npm run dev
```

The `better-sqlite3.node` file is already compiled for Windows, so it will work correctly.

---

### Option 2: Copy Project to WSL Native Filesystem (Best Performance)

**Pros**: Best performance, native Linux compilation
**Cons**: Requires copying files

```bash
# In WSL terminal
# Copy project to WSL home directory
cp -r /mnt/c/Users/Samsung/Documents/Projects/Marketing_platform_AI/marketing-ai-demo ~/marketing-ai-demo

# Navigate to new location
cd ~/marketing-ai-demo

# Rebuild better-sqlite3 for Linux
npm rebuild better-sqlite3

# Run dev server
npm run dev
```

**Note**: Files in `~/` are stored in the WSL filesystem (ext4), which has better performance and no Windows file locking issues.

---

### Option 3: Rebuild better-sqlite3 in WSL (If File Unlocked)

**Pros**: Keep project on Windows filesystem
**Cons**: May encounter file locking issues

```bash
# Stop any running dev servers
pkill -f "next dev"

# Wait for file locks to release
sleep 5

# Force remove locked file
rm -rf node_modules/better-sqlite3/build

# Rebuild for Linux
npm rebuild better-sqlite3

# Restart dev server
npm run dev
```

**Common Issue**: If you get "Input/output error" or "EACCES: permission denied", the file is still locked by Windows. Restart your terminal or use Option 1/2.

---

### Option 4: Use Pre-built Binaries

```bash
# Install better-sqlite3 with specific platform
npm install --platform=linux --arch=x64 better-sqlite3

# Run dev server
npm run dev
```

---

## Verification

After applying any fix, verify it works:

```bash
# Check the native module architecture
file node_modules/better-sqlite3/build/Release/better_sqlite3.node

# Should output:
# ELF 64-bit LSB shared object, x86-64 (for WSL)
# OR
# PE32+ executable (for Windows)

# Test database connection
npm run dev
# Should see: ✓ Ready in Xs
```

---

## Database Testing (Current Status)

Even with the better-sqlite3 issue, the database **itself works fine** via command-line `sqlite3`:

```bash
# Works correctly in WSL
sqlite3 dm-tracking.db ".tables"

# Shows all tables:
# campaigns, campaign_landing_pages, landing_page_templates, etc.
```

**Database Verification Results**:
- ✅ 51 campaigns exist
- ✅ 8 landing page templates seeded (Professional, Modern, Minimal, Bold, Medical, etc.)
- ✅ Campaign `49hItcwaJfau3DDH` has 150 recipients
- ✅ Landing page configuration created for campaign with Medical template
- ✅ Brand profile exists for Miracle-Ear (teal color #00747A, logo URL, Inter font)

---

## Testing Without Fixing better-sqlite3

You can still verify the dual-mode system architecture by:

1. **Database Inspection** (Works Now):
```bash
# Check landing pages
sqlite3 dm-tracking.db "SELECT * FROM campaign_landing_pages LIMIT 5;"

# Check recipients with tracking IDs
sqlite3 dm-tracking.db "SELECT id, name, tracking_id FROM recipients LIMIT 5;"

# Check templates
sqlite3 dm-tracking.db "SELECT id, name FROM landing_page_templates;"
```

2. **Code Review** (Already Complete):
- ✅ `app/lp/campaign/[campaignId]/page.tsx` - Server component loads templates
- ✅ `components/landing/campaign-landing-page.tsx` - Client renders dual-mode
- ✅ `lib/templates/brand-kit-merger.ts` - Merges brand kit with templates
- ✅ All 8 templates seeded in database
- ✅ Tracking snippet injection implemented

3. **Run from Windows** (Recommended):
```powershell
# Windows PowerShell
cd C:\Users\Samsung\Documents\Projects\Marketing_platform_AI\marketing-ai-demo
npm run dev
# Should work without errors
```

---

## Next Steps

**Immediate**: Run from Windows PowerShell to test the live application

**Long-term**: Consider moving project to WSL native filesystem (`~/projects/`) for best performance in WSL

---

## Support

If none of these solutions work, check:
- Node.js version: `node --version` (should be v20.x)
- npm version: `npm --version` (should be 10.x)
- WSL version: `wsl --version` (should be WSL2)
