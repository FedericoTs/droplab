# LightningCSS Native Module Issue in WSL

**Date**: October 24, 2025
**Environment**: WSL2 (Windows Subsystem for Linux)
**Issue**: Tailwind CSS v4 build failure due to missing native binaries

---

## Problem

### Error Message
```
Error: Cannot find module '../lightningcss.linux-x64-gnu.node'
Require stack:
- /mnt/c/Users/Samsung/Documents/Projects/Marketing_platform_AI/marketing-ai-demo/node_modules/lightningcss/node/index.js
- node_modules/@tailwindcss/node/dist/index.js
- node_modules/@tailwindcss/postcss/dist/index.js
```

### Root Cause
1. **Tailwind CSS v4** uses `lightningcss` for faster CSS processing
2. **LightningCSS** is a Rust-based tool that requires platform-specific native binaries (`.node` files)
3. **WSL2** environment has issues with:
   - Installing native binaries for Linux when Windows binaries exist
   - File system I/O errors when trying to remove/reinstall
   - Mixed Windows/Linux binaries in node_modules

### Why It Happens in WSL
- Node.js in WSL requires `lightningcss.linux-x64-gnu.node`
- npm sometimes downloads `lightningcss.win32-x64-msvc.node` instead
- WSL file system (mounted Windows drive) has permission/lock issues
- Cannot cleanly remove Windows binaries to reinstall Linux ones

---

## Solutions (Ordered by Recommendation)

### **Solution 1: Use Windows Terminal/PowerShell** ⭐ RECOMMENDED

**Why**: Avoid WSL entirely for development

**Steps**:
```powershell
# From Windows PowerShell or Command Prompt
cd C:\Users\Samsung\Documents\Projects\Marketing_platform_AI\marketing-ai-demo
npm install
npm run dev
# OR
npm run build
```

**Pros**:
- ✅ No WSL filesystem issues
- ✅ Native Windows binaries work correctly
- ✅ Faster file operations (no WSL overhead)
- ✅ No native module conflicts

**Cons**:
- ⚠️ May need to install Node.js for Windows if not present

---

### **Solution 2: Downgrade to Tailwind CSS v3**

**Why**: Tailwind v3 doesn't use lightningcss

**Steps**:
```bash
# Remove Tailwind v4
npm uninstall tailwindcss @tailwindcss/postcss

# Install Tailwind v3
npm install -D tailwindcss@^3.4.0 postcss autoprefixer

# Create tailwind.config.js (v3 format)
npx tailwindcss init -p
```

**Update `tailwind.config.js`**:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Update `postcss.config.js`**:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Pros**:
- ✅ Avoids lightningcss entirely
- ✅ Works in WSL
- ✅ Stable and well-tested

**Cons**:
- ⚠️ Slower CSS compilation than v4
- ⚠️ Missing some v4 features
- ⚠️ Requires configuration migration

---

### **Solution 3: Force Reinstall Native Modules**

**Why**: Try to fix the current setup

**Steps**:
```bash
# Exit all WSL terminals
# Reopen fresh WSL terminal

# Clear everything
rm -rf node_modules
rm -rf .next
rm package-lock.json
npm cache clean --force

# Reinstall with platform-specific flags
npm install --platform=linux --arch=x64

# Rebuild native modules
npm rebuild

# Try build
npm run build
```

**Pros**:
- ✅ Keeps Tailwind v4
- ✅ Stays in WSL

**Cons**:
- ⚠️ May not work due to filesystem locks
- ⚠️ Time-consuming
- ⚠️ No guarantee of success

---

### **Solution 4: Use Docker** (Advanced)

**Why**: Consistent Linux environment

**Steps**:
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
```

```bash
# Build and run
docker build -t marketing-ai .
docker run -p 3000:3000 -v $(pwd):/app marketing-ai
```

**Pros**:
- ✅ Completely isolated environment
- ✅ Consistent native binaries
- ✅ Production-like setup

**Cons**:
- ⚠️ Requires Docker installation
- ⚠️ More complex setup
- ⚠️ Slower file watching

---

### **Solution 5: Build Without Turbopack**

**Why**: Webpack might handle native modules better

**Steps**:
```bash
# Update package.json
"build": "next build"  # Remove --turbopack

# Try build
npm run build
```

**Pros**:
- ✅ Quick to try
- ✅ Webpack is more mature

**Cons**:
- ⚠️ Much slower build (2-3x)
- ⚠️ May still fail with lightningcss
- ⚠️ Loses Turbopack benefits

---

## Current Status

### What Works
- ✅ TypeScript compilation (npx tsc --noEmit)
- ✅ Code is valid
- ✅ All functionality implemented

### What's Blocked
- ❌ Production build in WSL (lightningcss error)
- ⚠️ Development mode (untested, likely same issue)

---

## Recommended Action Plan

### **Immediate (Today)**
1. **Try Solution 1** - Switch to Windows Terminal
   - Fastest and most reliable
   - No code changes needed
   - Just run from Windows instead of WSL

### **If Solution 1 Doesn't Work**
2. **Try Solution 2** - Downgrade to Tailwind v3
   - Proven to work in WSL
   - Minor configuration changes
   - Lose some v4 features (not critical)

### **Long Term**
3. **Consider Docker** for production builds
   - Consistent environment
   - Matches deployment environment
   - No WSL quirks

---

## Prevention

### For Future Projects in WSL
1. Use Tailwind v3 by default
2. OR use Docker from the start
3. OR develop in Windows Terminal for Next.js projects
4. Keep node_modules in Linux filesystem (not /mnt/c)
   - Move project to `~/projects/` instead of `/mnt/c/Users/`

### Platform-Specific Native Modules to Avoid in WSL
- lightningcss
- sharp (sometimes)
- canvas (sometimes)
- better-sqlite3 (works but needs rebuild)
- puppeteer (works but slower)

---

## Testing Each Solution

### Test Solution 1 (Windows)
```powershell
cd C:\Users\Samsung\Documents\Projects\Marketing_platform_AI\marketing-ai-demo
npm install
npm run build
```

### Test Solution 2 (Tailwind v3)
```bash
npm uninstall tailwindcss @tailwindcss/postcss
npm install -D tailwindcss@^3.4.0 postcss autoprefixer
npx tailwindcss init -p
npm run build
```

### Test Solution 3 (Force Reinstall)
```bash
rm -rf node_modules .next package-lock.json
npm cache clean --force
npm install
npm run build
```

---

## Additional Context

### Project Details
- **Next.js**: 15.5.4
- **Tailwind CSS**: v4 (current)
- **Environment**: WSL2 on Windows
- **Node.js**: v20 (LTS)

### Why This Wasn't an Issue Before
- Previous builds succeeded (mentioned in commits)
- Likely:
  1. Built from Windows Terminal originally
  2. OR node_modules had correct binaries from earlier install
  3. OR WSL filesystem wasn't locked

### Why It's Happening Now
- Fresh WSL session
- OR npm install downloaded wrong binaries
- OR WSL filesystem corruption/locks

---

## References

- [Tailwind CSS v4 Alpha Docs](https://tailwindcss.com/docs/v4-alpha)
- [LightningCSS GitHub](https://github.com/parcel-bundler/lightningcss)
- [WSL Native Module Issues](https://github.com/microsoft/WSL/issues/)
- [Next.js Turbopack Docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)

---

**Recommendation**: **Try Solution 1 first** (Windows Terminal). It's the fastest path to a working build with zero code changes.

If Windows development isn't an option, **use Solution 2** (Tailwind v3 downgrade). It's the most reliable workaround for WSL.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

**Status**: Documented - Awaiting user to try recommended solutions
