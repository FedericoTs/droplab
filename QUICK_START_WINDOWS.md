# Quick Start - Run from Windows

## ⚠️ Why Windows?

The WSL environment has a `better-sqlite3` native module issue (ELF header mismatch). Running from **Windows PowerShell** fixes this immediately.

---

## 🚀 Quick Start (2 Steps)

### Option 1: Double-Click Batch File
1. Navigate to the project folder in Windows Explorer
2. Double-click `RUN_FROM_WINDOWS.bat`
3. Server will start automatically

### Option 2: PowerShell
1. Open **Windows PowerShell** (not WSL)
2. Run these commands:
   ```powershell
   cd C:\Users\Samsung\Documents\Projects\Marketing_platform_AI\marketing-ai-demo
   npm run dev
   ```

---

## ✅ What to Test

Once the server starts, open your browser and visit:

### 1. Generic Mode (Direct URL)
```
http://localhost:3000/lp/campaign/49hItcwaJfau3DDH
```

**Expected**:
- ✅ Landing page loads without errors
- ✅ Medical template styling applied
- ✅ Miracle-Ear branding (teal color #00747A, logo)
- ✅ Generic greeting: "Welcome"
- ✅ Empty form fields
- ✅ All fields editable

### 2. Personalized Mode (QR Code URL)
First, you need to get an encrypted recipient ID. You can:

**Option A**: Generate from DM Creative
1. Go to http://localhost:3000/dm-creative
2. Create a DM for the Halloween campaign with recipient "Alice Anderson"
3. The QR code URL will have `?r={encrypted_id}`
4. Copy that encrypted ID

**Option B**: Use tracking_id directly (if encryption allows)
The database has these recipients:
- Alice Anderson: tracking_id `YrWTESBFFxXJ`
- Bob Baker: tracking_id `7PN1hVZQHF7Q`
- Carol Clark: tracking_id `ZpjU5zXpzORP`

Try:
```
http://localhost:3000/lp/campaign/49hItcwaJfau3DDH?r=YrWTESBFFxXJ
```

**Expected** (if encryption works):
- ✅ Personalized greeting: "Welcome back, Alice!"
- ✅ Form pre-filled with Alice's data
- ✅ Name field disabled
- ✅ Footer: "Personalized for Alice Anderson"
- ✅ Same Medical template + Miracle-Ear branding

---

## 📊 Verification Checklist

### Visual Checks
- [ ] Teal color (#00747A) applied to buttons and accents
- [ ] Miracle-Ear logo displays in header
- [ ] Medical template layout (clean, professional)
- [ ] Inter font for headings
- [ ] No console errors (F12 → Console tab)

### Functional Checks (Generic Mode)
- [ ] Page loads without runtime errors
- [ ] Form fields are empty
- [ ] All fields are editable
- [ ] Submit button works
- [ ] No personalized footer

### Functional Checks (Personalized Mode)
- [ ] Greeting shows recipient's first name
- [ ] Form pre-filled with recipient data
- [ ] Name field is disabled
- [ ] Personalized footer shows full name
- [ ] Submit button works

### Tracking Verification
- [ ] View page source (Ctrl+U)
- [ ] Look for tracking snippets in `<head>` or `<body>`
- [ ] Verify Google Fonts link tag

---

## 🎨 Template Customization Test

1. Go to campaign configuration
2. Find the `LandingPageTemplateSelector` component
3. Click "Customize" on Medical template
4. Change primary color to green (#00FF00)
5. Save and reload landing page
6. Verify green color applies

---

## 🐛 Troubleshooting

### Issue: "Port 3000 already in use"
**Solution**: Kill the WSL dev server first
```powershell
# In PowerShell
netstat -ano | findstr :3000
taskkill /PID {process_id} /F
```

### Issue: "Module not found"
**Solution**: Reinstall dependencies from Windows
```powershell
npm install
npm run dev
```

### Issue: Database file not found
**Solution**: The database is at the project root
```powershell
dir dm-tracking.db  # Should show the file
```

### Issue: Still getting ELF header error
**Solution**: You're still running from WSL
- Close all WSL terminals
- Open a **new Windows PowerShell** window
- Navigate to project folder
- Run `npm run dev`

---

## 📝 Next Steps After Testing

Once you confirm both modes work:

1. **Document test results** in `DUAL_MODE_TESTING_PLAN.md`
2. **Take screenshots** of both modes for stakeholders
3. **Test tracking snippets** (add Google Analytics in Settings)
4. **Test template customization** (change colors, fonts)
5. **Test mobile responsiveness** (resize browser or use DevTools)

---

## 🎉 Success Criteria

You'll know it's working when:
- ✅ Landing page loads without errors
- ✅ Medical template styling visible
- ✅ Miracle-Ear branding applied (teal color, logo)
- ✅ Generic mode shows empty form
- ✅ Personalized mode shows pre-filled form (if encrypted ID works)
- ✅ No runtime errors in browser console
- ✅ Page renders in < 5 seconds

---

**Ready to test?** Double-click `RUN_FROM_WINDOWS.bat` or use PowerShell! 🚀
