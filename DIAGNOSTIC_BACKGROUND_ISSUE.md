# Background Image Diagnostic

## Issue Summary

After switching to Gemini, background images appear as small insets instead of covering the full canvas.

## Key Differences: gpt-image-1 vs Gemini

### gpt-image-1
- **Request**: 1536x1024
- **Output**: **1536x1024** (exact match)
- **Scaling needed**: None (scale = 1.0)
- **Result**: Perfect fit ✅

### Gemini
- **Request**: 1536x1024
- **Output**: **1248x832** (3:2 aspect ratio)
- **Scaling needed**: 1.231x upscale
- **Result**: SHOULD fit with scaling ✅

---

## Diagnostic Steps

### Step 1: Verify New Code is Running

**What to check:**
After generating a DM with a template, console should show:

```
🖼️ Replacing template background with new AI-generated image
📐 Background scaling (COVER strategy):
   Image: 1248x832 (1.50:1)
   Canvas: 1536x1024 (1.50:1)
   Scale: 1.2308 (uniform, no distortion)
   Scaled dimensions: 1536x1024
   Position: (0, 0)
   Overflow: NO
✅ Background image replaced successfully (COVER mode)
```

**If you DON'T see this:**
- ❌ New code isn't loaded
- **Solution**: Restart dev server (`Ctrl+C`, then `npm run dev`)

---

### Step 2: Check Image Dimensions

**In browser console (F12 → Console):**

```javascript
// After template loads in editor
const canvas = window.fabricCanvasRef?.current;
const bg = canvas?.backgroundImage;

console.log('Background image info:');
console.log('  Native width:', bg?.width);
console.log('  Native height:', bg?.height);
console.log('  ScaleX:', bg?.scaleX);
console.log('  ScaleY:', bg?.scaleY);
console.log('  Left:', bg?.left);
console.log('  Top:', bg?.top);
console.log('  Scaled width:', bg?.width * bg?.scaleX);
console.log('  Scaled height:', bg?.height * bg?.scaleY);
```

**Expected output (Gemini with COVER):**
```
Native width: 1248
Native height: 832
ScaleX: 1.231
ScaleY: 1.231
Left: 0
Top: 0
Scaled width: 1536
Scaled height: 1024
```

**If you see different values:**
- Small scale (like 0.3): Image is being shrunk instead of enlarged
- Non-uniform scales (scaleX ≠ scaleY): Distortion risk
- Large left/top values: Image is offset incorrectly

---

### Step 3: Check Template Storage

**In terminal:**

```bash
sqlite3 dm-tracking.db "SELECT id, name, canvas_width, canvas_height FROM dm_templates ORDER BY created_at DESC LIMIT 1;"
```

**Expected**: Canvas dimensions should match requested size (1536x1024)

**Check template background:**

```bash
sqlite3 dm-tracking.db "SELECT LENGTH(background_image) FROM dm_templates ORDER BY created_at DESC LIMIT 1;"
```

**Expected**: Large number (~1-3 MB) indicating background is stored

---

### Step 4: Compare gpt-image-1 vs Gemini Output

**Generate two test DMs:**

1. **Test A**: Force gpt-image-1
   - Temporarily edit `app/api/dm-creative/generate/route.ts`
   - Comment out Gemini fallback, force gpt-image-1
   - Generate DM, note image dimensions in console

2. **Test B**: Use Gemini
   - Revert changes
   - Generate DM with Gemini
   - Note image dimensions

**Compare:**
- gpt-image-1 should output 1536x1024
- Gemini should output 1248x832

---

## Common Issues & Solutions

### Issue 1: Old Code Running
**Symptoms:**
- No "COVER strategy" logs in console
- Background still appears small

**Solution:**
```bash
# Stop dev server (Ctrl+C)
npm run dev
# Generate NEW DM (don't load old templates)
```

---

### Issue 2: Template Created with Old Code
**Symptoms:**
- Template created BEFORE fix
- Background not being replaced

**Solution:**
- Delete old templates
- Generate completely new DM
- Save as new template

---

### Issue 3: Caching
**Symptoms:**
- Old images still showing
- Changes not reflecting

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
# Clear browser cache (Hard refresh: Ctrl+Shift+R)
npm run dev
```

---

### Issue 4: Fabric.js backgroundImage Positioning
**Symptoms:**
- Image has correct scale but wrong position
- Image appears offset

**Investigation:**
Check if Fabric.js v6 handles background positioning differently than expected.

**Test:**
```typescript
// In editor, try setting background without left/top
canvas.backgroundImage.set({
  scaleX: 1.231,
  scaleY: 1.231,
  left: undefined,  // Remove positioning
  top: undefined
});
canvas.renderAll();
```

---

## Root Cause Analysis

### Theory 1: Template Background Not Being Replaced
**Before Fix:**
- Template loads via `canvas.loadFromJSON()`
- JSON includes old background
- Code doesn't replace it with new Gemini image
- **Result**: Old background shows at old size

**After Fix:**
- `updateTemplateVariables()` now replaces background
- New Gemini image loaded and scaled
- **Result**: Should work correctly

---

### Theory 2: STRETCH vs COVER Scaling
**Before (STRETCH):**
```typescript
scaleX = 1536 / 1248 = 1.231
scaleY = 1024 / 832 = 1.231
// Same values = no distortion ✅
```

**After (COVER):**
```typescript
scale = max(1536/1248, 1024/832) = 1.231
scaleX = scaleY = 1.231
// Explicitly uniform ✅
```

**Both should work!** Difference is COVER is more robust for mismatched aspect ratios.

---

### Theory 3: Gemini Image Format
**Possibility:**
- Gemini outputs different image format/encoding
- Browser loads it differently
- Dimensions aren't being read correctly

**Test:**
```javascript
// Check actual image element
const bg = canvas.backgroundImage;
const imgElement = bg._element;
console.log('Image natural dimensions:', imgElement.naturalWidth, 'x', imgElement.naturalHeight);
console.log('Image current dimensions:', imgElement.width, 'x', imgElement.height);
```

---

## Next Steps

1. **Immediate**: Restart dev server, regenerate DM
2. **If still broken**: Run diagnostic steps 1-3 above
3. **If still broken**: Share console output and browser console `backgroundImage` info
4. **Last resort**: Temporarily revert to gpt-image-1 to verify it works

---

## Expected Console Output (Working State)

```
🎨 Gemini (PRIMARY): high quality, 1536x1024 size (3-4s expected)
✅ Gemini success: $0.039, SynthID watermarked
✅ Gemini (PRIMARY) succeeded: cost: $0.039, generation time: 3-4s
AI background image generated successfully

[Editor loads]

📋 Loading template design: dm_1234567890
✅ Template loaded: Miracle-Ear Campaign
📊 Canvas has 7 objects, applying variable mappings...
📦 Loaded 7 variable mappings from template
🔄 Updating template variables with recipient data
📋 Recipient data: { name: 'Federico', ... hasNewBackground: true }
📊 Processing 7 objects in template

🖼️ Replacing template background with new AI-generated image
   Old background: exists
📐 Background scaling (COVER strategy):
   Image: 1248x832 (1.50:1)
   Canvas: 1536x1024 (1.50:1)
   Scale: 1.2308 (uniform, no distortion)
   Scaled dimensions: 1536x1024
   Position: (0, 0)
   Overflow: NO
✅ Background image replaced successfully (COVER mode)

✅ Template variables updated successfully
✅ Template "Miracle-Ear Campaign" loaded successfully
```

---

**Status**: Awaiting user testing with restarted dev server
