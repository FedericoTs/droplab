# Quick CSV Test (2 Minutes)

## The Fastest Way to Test CSV Workflow

### 1. Create Template (30 sec)
```
1. Go to http://localhost:3000/templates
2. Click "Add" → "Title"
3. Type: Hello {firstName} {lastName}!
4. Click "Add" → "Text"
5. Type: {email}
6. Right panel → Template Name: "Quick Test"
7. Click Save button
```

### 2. Start Campaign (10 sec)
```
1. Click "Load Template" button
2. Hover over "Quick Test"
3. Click "⚡ Create Campaign"
```

### 3. Download CSV Sample (10 sec)
```
1. See "Detected 3 variables" ✅
2. Click "Download CSV Template"
3. Check Downloads folder
```

### 4. Upload Sample Data (30 sec)
```
1. Click "Continue to Upload"
2. Drag sample_campaign_data.csv from project folder
   (or browse to: marketing-ai-demo/sample_campaign_data.csv)
3. See ✅ "Valid CSV - Ready to process"
4. Preview shows first 5 rows
```

### 5. Generate! (10 sec)
```
1. Click "Generate Campaign (15 variants)"
2. Watch progress bar: 0% → 100%
3. See ✅ "Campaign Generated Successfully!"
4. List shows 15 personalized variants
```

### 6. Verify (10 sec)
```
Check variants show different names:
- Variant 1: "John • Smith"
- Variant 2: "Sarah • Johnson"
- Variant 3: "Michael • Williams"
✅ Personalization working!
```

---

## What You're Testing

✅ Variable detection from `{firstName}` patterns
✅ CSV template generation
✅ Drag & drop file upload
✅ Column validation
✅ Data preview
✅ Batch processing (processes in chunks of 50)
✅ Progress tracking
✅ Personalized variant generation

---

## Troubleshooting One-Liners

**"No variables detected"** → Add `{variableName}` to your text
**CSV validation fails** → Need at least 10 rows, check column names
**Button disabled** → Upload CSV first
**Progress stuck** → Check browser console, refresh if needed

---

## Files You Need

**Sample CSV**: `sample_campaign_data.csv` (in project root)
**15 rows** with: firstName, lastName, email, city, company

**Full Guides**:
- `CSV_TESTING_GUIDE.md` - Detailed testing (10 pages)
- `VDP_TESTING_GUIDE.md` - Complete workflow (8 pages)

---

**Total Time**: ~2 minutes for full happy path test! 🚀
