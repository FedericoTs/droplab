# CSV Campaign Testing Guide

## Quick Start Guide (5 Minutes)

### What You'll Test:
1. ✅ Variable detection from templates
2. ✅ CSV sample download
3. ✅ CSV file upload with drag & drop
4. ✅ Column validation
5. ✅ Data preview
6. ✅ Batch personalization processing
7. ✅ Real-time progress tracking
8. ✅ Results view with generated variants

---

## Step 1: Create a Template with Variables (2 min)

### 1.1 Navigate to Templates Page
```
http://localhost:3000/templates
```

### 1.2 Create New Template
1. Click canvas to deselect any object
2. Select format: **"4×6 Postcard"** from dropdown (top toolbar)
3. Add text with variables:

   **Option A - Simple Test (3 variables):**
   - Click "Add" → "Title"
   - Type: `Hello {firstName} {lastName}!`
   - Add another text: `Contact: {email}`

   **Option B - Full Test (5 variables):**
   - Click "Add" → "Title"
   - Type: `Hello {firstName} {lastName}!`
   - Add text: `📧 {email}`
   - Add text: `🏙️ {city}`
   - Add text: `🏢 {company}`

4. In **Layers Panel** (right side):
   - Expand "Template Settings" if collapsed
   - Enter **Template Name**: `CSV Test Template`
   - Enter **Description**: `Testing VDP with CSV data`

5. Click **💾 Save Template** button (top toolbar)
   - Should see: "✅ Template saved successfully"

### 1.3 Verify Template Saved
- Click **📁 Load Template** button
- You should see "CSV Test Template" in the library
- Close the library modal

---

## Step 2: Open Campaign Creation (30 seconds)

1. Click **📁 Load Template** button again
2. **Hover** over your "CSV Test Template" card
3. Two buttons should appear:
   - **Load Template** (blue)
   - **⚡ Create Campaign** (white with lightning icon)
4. Click **⚡ Create Campaign**

The **Campaign Creation Modal** opens!

---

## Step 3: Variable Detection & CSV Download (1 min)

### What You Should See:

**Step Indicator:**
```
● Step 1: Variables     ○ Step 2: Upload Data
```

**Variable Detection Section:**
- ✅ Green checkmark icon
- "Detected X variables" (3 or 5 depending on your template)
- Purple variable badges: `{firstName}`, `{lastName}`, `{email}`, etc.

**Variable List Table:**
Each variable shows:
- **Display Name**: "First Name", "Last Name", etc.
- **Sample Value**: "John", "Smith", "john.smith@example.com"

**CSV Sample Preview:**
```
firstName,lastName,email
John,Smith,john.smith@example.com
Sarah,Johnson,sarah.johnson@example.com
Michael,Williams,michael.williams@example.com
```

### Test Actions:

1. **Download CSV Template**
   - Click **"Download CSV Template"** button
   - Check your Downloads folder
   - File name: `csv_test_template_sample.csv`
   - Open with Excel/Notepad to verify format

2. **Verify Instructions Box** (blue)
   - Should show 4 numbered steps
   - Explains: Download → Fill → Upload → Generate

3. **Continue Button**
   - Should be **enabled** (blue)
   - Click **"Continue to Upload"**

---

## Step 4: CSV Upload - Using Downloaded Sample (2 min)

Now you're on **Step 2: Upload Data**

### Test 4A: Upload the Downloaded CSV (Quick Test)

The downloaded CSV has only **3 rows** (not enough for validation).

1. **Try uploading it** (drag & drop or browse)
2. You should see:
   - ❌ Red error state
   - "CSV must contain at least 10 rows (found 3)"
   - This is **correct behavior** - row validation working!

### Test 4B: Upload the Pre-made Sample (15 rows)

Use the provided sample file: `sample_campaign_data.csv`

**Location**: Project root folder
```
marketing-ai-demo/sample_campaign_data.csv
```

**Method 1 - Drag & Drop:**
1. Open your file explorer
2. Navigate to project folder
3. Drag `sample_campaign_data.csv` into the upload area
4. Watch the border turn blue while dragging
5. Drop the file

**Method 2 - Browse:**
1. Click **"Browse Files"** button
2. Navigate to project folder
3. Select `sample_campaign_data.csv`
4. Click Open

### What Should Happen:

**✅ Success State:**
- Green border around file card
- ✅ "Valid CSV - Ready to process"
- File info: `sample_campaign_data.csv`, size, row count

**Column Detection:**
- Shows detected columns as chips with checkmarks:
  - `firstName ✓`
  - `lastName ✓`
  - `email ✓`
  - `city ✓` (if you used Option B)
  - `company ✓` (if you used Option B)

**Data Preview Table:**
- Shows **first 5 rows** in a clean table
- Columns match your template variables
- Data looks correct (John Smith, Sarah Johnson, etc.)
- Below table: "Showing 5 of 15 rows"

**Generate Button:**
- Button now **enabled** (blue)
- Shows: "Generate Campaign (15 variants)"

---

## Step 5: Error Testing (Optional - 2 min)

Test the validation by creating bad CSV files:

### Test 5A: Missing Column
1. Remove the CSV file (click X button)
2. Edit `sample_campaign_data.csv`:
   - Remove the `email` column header
   - Save as `test_missing_column.csv`
3. Upload this file
4. **Expected**: ❌ "Missing required columns: email"

### Test 5B: Wrong File Type
1. Remove CSV
2. Try uploading a `.txt` or `.xlsx` file
3. **Expected**: ❌ "Please upload a CSV file"

### Test 5C: Too Few Rows (< 10)
Already tested in 4A! ✅

### Test 5D: Empty File
1. Create empty CSV file
2. Upload
3. **Expected**: ❌ "CSV file is empty"

**After testing errors, re-upload the valid `sample_campaign_data.csv`**

---

## Step 6: Generate Campaign - Watch the Magic! (30 seconds)

With valid CSV uploaded:

1. Click **"Generate Campaign (15 variants)"** button

### What Happens:

**Stage 1: Processing (1-2 seconds)**
- Modal switches to Step 3
- Blue progress card appears:
  - **Progress Bar**: Animates 0% → 100%
  - **Percentage**: Shows "0%" → "100%"
  - **Batch Info**: "Processing batch 1 of 1"
  - **Count**: "0 of 15 variants generated" → "15 of 15"

**Stage 2: Success View**
- Green success card:
  - ✅ Big green checkmark
  - "Campaign Generated Successfully!"
  - "15 personalized variants ready for export"

**Variants List** (shows first 10):
- Each variant displayed in a card:
  - 🔵 Number badge (1, 2, 3...)
  - **Data preview**: "John • Smith" (first 2 fields)
  - **Field count**: "5 fields personalized"
  - ✅ Green checkmark

- Below list: "+ 5 more variants" (since we show max 10)

**Next Steps Box** (blue):
- Instructions for PDF export
- Download options
- Print fulfillment info

---

## Step 7: Verify Personalization (1 min)

Check that each variant has **different data**:

**Variant 1:**
- "John • Smith"

**Variant 2:**
- "Sarah • Johnson"

**Variant 3:**
- "Michael • Williams"

Each should show unique data from your CSV rows! ✅

---

## Advanced Testing Scenarios

### Test Large CSV (Optional)

Want to see chunked processing in action?

1. Create CSV with **500 rows** using Excel or script
2. Upload and generate
3. Watch progress bar update multiple times:
   - "Processing batch 1 of 10"
   - "Processing batch 2 of 10"
   - etc.
4. Processing takes ~5-10 seconds
5. All 500 variants generated successfully

### Test Different Variable Combinations

**Test Case 1: Single Variable**
- Template: `Hello {name}!`
- CSV: Just one column `name`
- Should work perfectly ✅

**Test Case 2: No Variables**
- Template with plain text (no `{variables}`)
- Click "Create Campaign"
- Should show: ⚠️ "No variables detected"
- "Continue" button disabled
- **This is correct!**

**Test Case 3: Special Characters in Data**
- CSV with commas in values: `"Smith, Jr."`
- CSV with quotes: `"John "Johnny" Doe"`
- Should handle correctly with proper CSV escaping ✅

---

## Expected Results Summary

| Test | Expected Behavior | Status |
|------|------------------|--------|
| Variable detection | Auto-finds all `{variable}` patterns | ✅ |
| CSV sample download | Generates file with 3 sample rows | ✅ |
| Drag & drop upload | Blue border, accepts CSV files | ✅ |
| Row validation | Rejects < 10 rows | ✅ |
| Column validation | Checks all required columns present | ✅ |
| Data preview | Shows first 5 rows in table | ✅ |
| Progress tracking | Real-time % and batch updates | ✅ |
| Batch processing | Handles 10-10,000 rows smoothly | ✅ |
| Results display | Shows first 10 variants with data | ✅ |
| Personalization | Each variant has unique CSV row data | ✅ |

---

## Troubleshooting

### Issue: "No variables detected"
**Solution**: Make sure your template has text with `{variableName}` format
- ❌ Wrong: `Hello name`
- ✅ Correct: `Hello {name}`

### Issue: CSV validation fails
**Check:**
- File is actual `.csv` format (not Excel `.xlsx`)
- Column names match your template variables **exactly**
- At least 10 rows of data (header doesn't count)
- No extra spaces in column headers

### Issue: Upload button doesn't work
**Solution:**
- Use drag & drop instead
- Make sure CSV file is in an accessible folder
- Check browser console for errors

### Issue: Progress bar stuck at 0%
**Solution:**
- Check browser console for errors
- Close modal and try again
- Refresh page if needed

### Issue: "Generate Campaign" button disabled
**Reasons:**
- No CSV uploaded yet
- CSV validation failed (check error message)
- Template has no variables

---

## What's Working vs. Not Yet Implemented

### ✅ Currently Working:
- [x] Variable detection from templates
- [x] CSV sample generation and download
- [x] CSV file upload (drag & drop + browse)
- [x] File validation (type, size, format)
- [x] Column validation (checks required fields)
- [x] Row count validation (10-10,000)
- [x] Data preview (first 5 rows)
- [x] Batch personalization engine
- [x] Chunked processing (50 variants per batch)
- [x] Real-time progress tracking
- [x] Success view with variant list
- [x] Personalized data display

### ⏸️ Not Yet Implemented:
- [ ] PDF export (shows "Coming Soon" button)
- [ ] Download individual variants
- [ ] ZIP download for all variants
- [ ] Visual preview of generated designs
- [ ] Save/store generated campaigns
- [ ] Edit campaign after generation

---

## Quick Reference - Files Included

**Sample CSV for Testing:**
```
marketing-ai-demo/sample_campaign_data.csv
```
**Contains 15 rows with:**
- firstName
- lastName
- email
- city
- company

**Testing Guide Files:**
- `VDP_TESTING_GUIDE.md` - Complete workflow testing
- `CSV_TESTING_GUIDE.md` - This file (CSV-specific)

---

## Video Walkthrough Steps (For Screen Recording)

1. **Start**: Show Templates page
2. **Create**: Add template with `{firstName}`, `{lastName}`, `{email}`
3. **Save**: Name it and save
4. **Open**: Click "Create Campaign" on template card
5. **Download**: Click "Download CSV Template" button
6. **Upload**: Drag `sample_campaign_data.csv` into upload area
7. **Preview**: Show the data preview table
8. **Generate**: Click "Generate Campaign" button
9. **Watch**: Progress bar animating
10. **Success**: Show variants list with personalized data
11. **End**: Point out "PDF Export Coming Soon"

**Estimated Time**: 2-3 minutes for full demo

---

**Testing Complete!** 🎉

The VDP CSV workflow is fully functional up to variant generation. You can confidently demonstrate:
- Auto-detection of template variables
- Smart CSV template generation
- Drag & drop upload with validation
- Real-time batch processing
- Personalized variant creation at scale (10-10,000 records)
