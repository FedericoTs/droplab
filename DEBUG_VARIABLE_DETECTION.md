# Variable Detection Debug Guide

## Changes Made (First Principles Debugging)

Following Elon Musk's first principles approach, I've added comprehensive diagnostic logging at **three critical stages** of the data flow to identify exactly where the issue occurs:

### 1. ✅ Fixed Delete Button Z-Index Issue
**File**: `components/templates/template-library.tsx` (line 238)
- **Change**: Added `z-20` class to delete button
- **Why**: Delete button was being rendered behind the hover overlay, making it unclickable
- **Status**: **FIXED** - Ready to test

---

### 2. 🔍 Added Ultra-Debug Logging

#### Stage 1: Template Save (templates/page.tsx)
**When**: User clicks Save button
**Logs**:
- Canvas JSON structure (object count, version)
- Each object's type, text content, text length
- **Purpose**: Verify Fabric.js `toJSON()` is correctly serializing text objects

#### Stage 2: Template Library (template-library.tsx)
**When**: User clicks "Create Campaign" button
**Logs**:
- Template structure before passing to modal
- Canvas JSON type (string vs object)
- Object count and text content
- **Purpose**: Verify template data is intact after database load

#### Stage 3: Variable Detection (variable-detection.ts)
**When**: Create Campaign modal opens
**Logs**:
- Canvas JSON received by detection function
- Number of objects found
- Each object's type, text, and whether it matches textbox types
- Extracted field names from each text object
- Final count of detected variables
- **Purpose**: Verify detection logic is working correctly

---

## Testing Instructions (5 Minutes)

### Step 1: Open Browser Console
1. Press `F12` (or right-click → Inspect)
2. Click **Console** tab
3. Clear existing logs (trash icon)

### Step 2: Create a New Template
1. Go to http://localhost:3000/templates
2. Click "Add" → "Title"
3. Type exactly: `Hello {firstName} {lastName}!`
4. **Watch console** for purple chip styling to appear
5. In right panel:
   - Template Name: `Debug Test 1`
   - Template Description: `Testing variable detection`
6. Click **💾 Save** button

**Expected Console Output**:
```
💾 Saving template: { name: "Debug Test 1", format: "...", organization: "..." }
🔍 [SAVE DEBUG] Canvas JSON structure: { objectCount: 1, version: "..." }
🔍 [SAVE DEBUG] Object 0: { type: "textbox", hasText: true, textContent: "Hello {firstName} {lastName}!", textLength: 30 }
✅ Template saved to database
```

**❓ If textContent is empty or null → This is the root cause**

### Step 3: Test Create Campaign
1. Click **📁 Load Template** button
2. Hover over "Debug Test 1" template card
3. Click **⚡ Create Campaign** button
4. **Watch console** carefully

**Expected Console Output**:
```
🔍 [TEMPLATE LIBRARY] Opening Create Campaign for template: Debug Test 1
🔍 [TEMPLATE LIBRARY] Template canvas_json type: object
🔍 [TEMPLATE LIBRARY] Canvas objects count: 1
🔍 [TEMPLATE LIBRARY] Object 0: { type: "textbox", hasText: true, textContent: "Hello {firstName} {lastName}!", textLength: 30 }

🔍 [VARIABLE DETECTION] Starting detection...
📊 [VARIABLE DETECTION] Canvas JSON type: object
📦 [VARIABLE DETECTION] Found 1 objects in canvas
🔎 [OBJECT 0] Checking object: { type: "textbox", text: "Hello {firstName} {lastName}!", hasText: true, textLength: 30 }
✏️ [OBJECT 0] Text object found! Text: "Hello {firstName} {lastName}!"
🎯 [OBJECT 0] Extracted field names: ["firstName", "lastName"]
✅ [VARIABLE] Added new variable: firstName
✅ [VARIABLE] Added new variable: lastName
🎉 [VARIABLE DETECTION] Detection complete!
📈 [VARIABLE DETECTION] Total variables detected: 2
📋 [VARIABLE DETECTION] Variables: ["firstName", "lastName"]
```

**Modal should show**:
- ✅ "Detected 2 variables"
- Purple badges: `{firstName}` `{lastName}`
- "Continue to Upload" button enabled

### Step 4: Test Delete Button
1. Close the Create Campaign modal
2. Close the Load Template modal
3. Click **📁 Load Template** again
4. Hover over "Debug Test 1" template card
5. Click the **🗑️ Delete** button (top-left corner)
6. Confirm deletion

**Expected**: Template should be deleted successfully

---

## What to Report Back

Please copy and paste **ALL console output** from your test, especially:

### Critical Information:
1. **Stage 1 (Save)**: Does `textContent` contain the `{firstName}` variables?
2. **Stage 2 (Template Library)**: Is `textContent` still present after loading from database?
3. **Stage 3 (Variable Detection)**: Does `extractFieldNames` return `["firstName", "lastName"]`?

### If Variables ARE NOT Detected:
**Question 1**: At which stage does textContent become empty/null?
- [ ] During save (Stage 1)
- [ ] After database load (Stage 2)
- [ ] During detection (Stage 3)

**Question 2**: What does the console show for:
- Object type: `_____`
- hasText: `_____`
- textContent: `_____`
- textLength: `_____`

---

## Root Cause Hypotheses

Based on console output, we can narrow down to one of these:

| Hypothesis | Evidence | Fix |
|-----------|----------|-----|
| **A. Fabric.js not serializing text** | Stage 1: `textContent: ""` or `null` | Fabric.js config issue |
| **B. Database corrupting data** | Stage 1: ✅ has text, Stage 2: ❌ no text | Database schema issue |
| **C. Template load parsing error** | Stage 2: ✅ has text, Stage 3: ❌ no text | Modal parsing logic |
| **D. Detection regex broken** | Stage 3: ✅ has text, but `extractFieldNames: []` | Regex pattern issue |
| **E. Wrong object type** | Object type is not 'textbox'/'i-text'/'text' | Type checking logic |

---

## Expected Outcome

With these logs, we will **definitively identify** where in the data flow the text content is lost or the detection fails, allowing me to apply a **surgical fix** to the exact problem.

**Next Step**: Once you provide the console output, I will analyze it and implement the targeted fix based on first principles analysis of the root cause.
