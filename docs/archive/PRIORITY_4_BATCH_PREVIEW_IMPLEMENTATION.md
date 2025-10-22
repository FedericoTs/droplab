# Priority 4: Batch Preview System - Implementation Plan

## Date: 2025-10-21
## Effort: 6-8 hours (1 day)
## Risk: ZERO - Additive feature only

---

## 🎯 OBJECTIVE

Add optional batch preview functionality to prevent costly errors before generating full batches of DMs. Users can preview first 3-5 recipients to verify template correctness before committing to full batch processing.

---

## 📋 SUCCESS CRITERIA

✅ **User can preview 3-5 recipients before batch generation**
✅ **Carousel navigation between previews**
✅ **Variable substitution visible in preview**
✅ **QR code and phone number preview shown**
✅ **Template validation warnings displayed**
✅ **Preview is OPTIONAL - existing "Generate Batch" flow unchanged**
✅ **Zero impact on current batch processing**

---

## 🏗️ ARCHITECTURE

### Current Flow (PRESERVED)
```
User uploads CSV
   ↓
Clicks "Generate Batch"
   ↓
Batch job created immediately
   ↓
Workers render all DMs
```

### New Flow (ADDITIVE)
```
User uploads CSV
   ↓
Clicks "Preview Batch" (NEW - OPTIONAL)
   ↓
System renders first 5 recipients (client-side or quick server render)
   ↓
Preview modal shows carousel
   ↓
User sees variable substitution + QR codes
   ↓
User clicks "Looks Good - Generate Full Batch" OR "Adjust Template"
   ↓
If approved → Create batch job
   ↓
Workers render all DMs
```

### Fallback (PRESERVED)
```
User can still click "Generate Batch" directly
   ↓
Skips preview (same as before)
   ↓
Batch job created immediately
```

---

## 📦 COMPONENTS TO CREATE

### 1. BatchPreviewModal Component
**File**: `components/dm-creative/batch-preview.tsx` (NEW)

**Props**:
```typescript
interface BatchPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  previews: PreviewData[];
  totalRecipients: number;
  templateName: string;
  validationResults: ValidationResult;
}

interface PreviewData {
  recipientIndex: number;
  recipientName: string;
  recipientData: RecipientData;
  previewImageUrl: string; // Base64 or URL
  qrCodeUrl: string;
  phoneNumber?: string;
  hasWarnings: boolean;
  warnings: string[];
}

interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}
```

**UI Features**:
- Full-screen modal with dark backdrop
- Carousel with prev/next buttons
- Preview counter: "Preview 1 of 5"
- Large preview image (800x800px or actual DM size)
- Recipient info sidebar (name, phone, address)
- Variable substitution indicator (badges showing what was replaced)
- QR code zoom tooltip
- Validation warnings panel (if any)
- Action buttons:
  - "Looks Good - Generate All {totalRecipients} DMs" (primary, green)
  - "Adjust Template" (secondary, returns to editor)
  - "Close" (text button)

**Keyboard Navigation**:
- Left/Right arrows to navigate previews
- Escape to close modal
- Enter to approve and generate

---

### 2. Template Validator
**File**: `lib/template-validator.ts` (NEW)

**Functions**:
```typescript
export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

/**
 * Validate template against recipient data
 */
export function validateTemplate(
  canvasJSON: any,
  variableMappings: any,
  recipientData: RecipientData
): ValidationResult {
  const errors: ValidationResult['errors'] = [];

  // Check 1: Required variables exist in CSV
  Object.entries(variableMappings).forEach(([idx, mapping]: [string, any]) => {
    if (mapping.variableType === 'recipientName' && !recipientData.name) {
      errors.push({
        field: 'name',
        message: 'Recipient name is missing but required in template',
        severity: 'error'
      });
    }

    if (mapping.variableType === 'recipientAddress' && !recipientData.address) {
      errors.push({
        field: 'address',
        message: 'Recipient address is missing',
        severity: 'warning'
      });
    }
  });

  // Check 2: Phone number format
  if (recipientData.phone) {
    const phoneRegex = /^\+?1?\s*\(?(\d{3})\)?[\s.-]?(\d{3})[\s.-]?(\d{4})$/;
    if (!phoneRegex.test(recipientData.phone)) {
      errors.push({
        field: 'phone',
        message: 'Phone number format may be invalid (expected: XXX-XXX-XXXX)',
        severity: 'warning'
      });
    }
  }

  // Check 3: QR code data exists
  const hasQRCode = Object.values(variableMappings).some(
    (m: any) => m.variableType === 'qrCode'
  );
  if (hasQRCode && !recipientData.trackingId) {
    errors.push({
      field: 'trackingId',
      message: 'QR code requires tracking ID',
      severity: 'error'
    });
  }

  // Check 4: Template dimensions
  const canvas = canvasJSON;
  if (canvas.width < 800 || canvas.height < 800) {
    errors.push({
      field: 'dimensions',
      message: `Template dimensions (${canvas.width}x${canvas.height}) are smaller than recommended (1024x1024)`,
      severity: 'warning'
    });
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors
  };
}

/**
 * Validate entire CSV batch
 */
export function validateBatch(
  canvasJSON: any,
  variableMappings: any,
  recipients: RecipientData[]
): {
  overallValid: boolean;
  recipientResults: Array<{
    index: number;
    name: string;
    validation: ValidationResult;
  }>;
  summary: {
    totalRecipients: number;
    validCount: number;
    errorCount: number;
    warningCount: number;
  };
} {
  const recipientResults = recipients.map((recipient, index) => ({
    index,
    name: `${recipient.name} ${recipient.lastname}`,
    validation: validateTemplate(canvasJSON, variableMappings, recipient)
  }));

  const validCount = recipientResults.filter(r => r.validation.isValid).length;
  const errorCount = recipientResults.filter(r => !r.validation.isValid).length;
  const warningCount = recipientResults.reduce(
    (sum, r) => sum + r.validation.errors.filter(e => e.severity === 'warning').length,
    0
  );

  return {
    overallValid: errorCount === 0,
    recipientResults,
    summary: {
      totalRecipients: recipients.length,
      validCount,
      errorCount,
      warningCount
    }
  };
}
```

---

### 3. Preview Renderer
**File**: `lib/batch-processor/preview-renderer.ts` (NEW)

**Purpose**: Generate preview images for first N recipients without full batch processing

**Implementation**:
```typescript
import { fabric } from 'fabric';
import QRCode from 'qrcode';

export interface PreviewRenderOptions {
  templateId: string;
  recipients: RecipientData[];
  maxPreviews: number; // Default: 5
  settings: any; // Company settings
}

export interface PreviewResult {
  recipientIndex: number;
  recipientData: RecipientData;
  previewImageUrl: string; // Base64 PNG
  qrCodeUrl: string;
  renderTime: number;
  warnings: string[];
}

/**
 * Generate preview images for first N recipients
 * Uses client-side rendering (no workers, no batch jobs)
 */
export async function generateBatchPreviews(
  options: PreviewRenderOptions
): Promise<PreviewResult[]> {
  const { templateId, recipients, maxPreviews = 5, settings } = options;

  // Fetch template
  const template = await fetchTemplate(templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  // Limit to first N recipients
  const previewRecipients = recipients.slice(0, maxPreviews);

  // Generate previews in parallel (client-side only)
  const previews = await Promise.all(
    previewRecipients.map((recipient, index) =>
      renderSinglePreview(template, recipient, index, settings)
    )
  );

  return previews;
}

/**
 * Render a single preview (client-side canvas)
 */
async function renderSinglePreview(
  template: DMTemplate,
  recipient: RecipientData,
  index: number,
  settings: any
): Promise<PreviewResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  try {
    // Create in-memory canvas
    const canvasJSON = JSON.parse(template.canvasJSON);
    const variableMappings = template.variableMappings
      ? JSON.parse(template.variableMappings)
      : {};

    // Load canvas
    const fabricCanvas = new fabric.Canvas(null, {
      width: template.canvasWidth,
      height: template.canvasHeight
    });

    await new Promise((resolve) => {
      fabricCanvas.loadFromJSON(canvasJSON, () => {
        resolve(true);
      });
    });

    // Apply variable substitutions
    const objects = fabricCanvas.getObjects();
    Object.entries(variableMappings).forEach(([idx, mapping]: [string, any]) => {
      const obj = objects[parseInt(idx)];
      if (!obj) return;

      const isReusable = mapping.isReusable === true;
      if (isReusable) return; // Skip reusable elements (logo, etc.)

      // Replace variables
      switch (mapping.variableType) {
        case 'recipientName':
          if (recipient.name) {
            obj.set({ text: `${recipient.name} ${recipient.lastname}` });
          } else {
            warnings.push('Recipient name is missing');
          }
          break;

        case 'recipientAddress':
          if (recipient.address) {
            obj.set({ text: `${recipient.address}\n${recipient.city}, ${recipient.zip}` });
          } else {
            warnings.push('Recipient address is missing');
          }
          break;

        case 'phoneNumber':
          if (recipient.phone && recipient.phone.trim()) {
            obj.set({ text: `📞 ${recipient.phone}` });
          }
          break;

        case 'qrCode':
          // Generate QR code
          const qrUrl = await generateQRCode(recipient, settings);
          if (qrUrl) {
            const qrImage = await loadImage(qrUrl);
            obj.setSrc(qrUrl, () => {
              fabricCanvas.renderAll();
            });
          }
          break;
      }
    });

    fabricCanvas.renderAll();

    // Generate preview image (PNG base64)
    const previewImageUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 0.9,
      multiplier: 1 // Full size for preview
    });

    // Generate QR code separately for zoom tooltip
    const qrCodeUrl = await generateQRCode(recipient, settings);

    const renderTime = Date.now() - startTime;

    return {
      recipientIndex: index,
      recipientData: recipient,
      previewImageUrl,
      qrCodeUrl,
      renderTime,
      warnings
    };
  } catch (error) {
    console.error(`Error rendering preview for recipient ${index}:`, error);
    throw error;
  }
}

/**
 * Generate QR code for recipient
 */
async function generateQRCode(
  recipient: RecipientData,
  settings: any
): Promise<string> {
  const trackingId = recipient.trackingId || `preview-${Date.now()}`;
  const landingPageUrl = `${settings.appUrl}/lp/${trackingId}`;

  return await QRCode.toDataURL(landingPageUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' }
  });
}

/**
 * Helper: Load image
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Fetch template from database
 */
async function fetchTemplate(templateId: string): Promise<DMTemplate | null> {
  try {
    const response = await fetch(`/api/dm-template?id=${templateId}`);
    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error('Error fetching template:', error);
    return null;
  }
}
```

---

## 🔌 INTEGRATION POINTS

### DM Creative Editor Enhancement
**File**: `app/dm-creative/editor/page.tsx` (MODIFY)

**Changes** (Additive only - no removal of existing code):

```typescript
// Add state for preview modal
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [previewData, setPreviewData] = useState<PreviewResult[]>([]);
const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);

// NEW FUNCTION: Handle preview batch
const handlePreviewBatch = async () => {
  if (!currentTemplate || !recipients || recipients.length === 0) {
    toast.error('Please select a template and upload recipients CSV');
    return;
  }

  setIsGeneratingPreviews(true);

  try {
    // Validate batch first
    const validation = validateBatch(
      currentTemplate.canvasJSON,
      currentTemplate.variableMappings,
      recipients
    );

    setValidationResults(validation);

    // Generate previews for first 5 recipients
    const previews = await generateBatchPreviews({
      templateId: currentTemplate.id,
      recipients: recipients,
      maxPreviews: 5,
      settings: settings
    });

    setPreviewData(previews);
    setShowPreviewModal(true);

    toast.success(`Preview generated for ${previews.length} recipients`);
  } catch (error) {
    console.error('Error generating preview:', error);
    toast.error('Failed to generate preview');
  } finally {
    setIsGeneratingPreviews(false);
  }
};

// NEW FUNCTION: Handle approve preview and generate full batch
const handleApprovePreview = async () => {
  setShowPreviewModal(false);
  // Call existing batch generation function
  await handleGenerateBatch();
};

// EXISTING FUNCTION: handleGenerateBatch (NO CHANGES)
// This function remains exactly as is, ensuring backward compatibility

// UI: Add preview button BEFORE existing "Generate Batch" button
<div className="flex gap-3">
  {/* NEW: Preview Button */}
  <Button
    onClick={handlePreviewBatch}
    disabled={!currentTemplate || !recipients || recipients.length === 0 || isGeneratingPreviews}
    variant="outline"
    size="lg"
    className="gap-2"
  >
    {isGeneratingPreviews ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Generating Preview...
      </>
    ) : (
      <>
        <Eye className="h-4 w-4" />
        Preview Batch (First 5)
      </>
    )}
  </Button>

  {/* EXISTING: Generate Batch Button (UNCHANGED) */}
  <Button
    onClick={handleGenerateBatch}
    disabled={!currentTemplate || !recipients || recipients.length === 0 || isGeneratingBatch}
    size="lg"
    className="gap-2"
  >
    {isGeneratingBatch ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" />
        Generating {recipients?.length} DMs...
      </>
    ) : (
      <>
        <Zap className="h-4 w-4" />
        Generate Full Batch ({recipients?.length || 0} DMs)
      </>
    )}
  </Button>
</div>

{/* NEW: Preview Modal */}
<BatchPreviewModal
  isOpen={showPreviewModal}
  onClose={() => setShowPreviewModal(false)}
  onApprove={handleApprovePreview}
  previews={previewData}
  totalRecipients={recipients?.length || 0}
  templateName={currentTemplate?.name || 'Template'}
  validationResults={validationResults}
/>
```

---

## 🎨 UI/UX DESIGN

### Preview Modal Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│  [X Close]                                                              │
│                                                                         │
│  Preview Batch - {templateName}                  Preview 2 of 5        │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │                             │  │  Recipient Details               │ │
│  │                             │  │  ───────────────────────────────  │ │
│  │                             │  │  📛 John Smith                   │ │
│  │   [Preview Image]           │  │  📧 john@example.com             │ │
│  │   800x800px DM              │  │  📞 555-123-4567                 │ │
│  │                             │  │  📍 123 Main St, NYC, 10001      │ │
│  │                             │  │                                  │ │
│  │                             │  │  Variable Substitutions          │ │
│  │                             │  │  ───────────────────────────────  │ │
│  │                             │  │  ✅ Recipient Name               │ │
│  │   [< Prev]      [Next >]    │  │  ✅ Address                      │ │
│  └─────────────────────────────┘  │  ✅ Phone Number                 │ │
│                                   │  ✅ QR Code Generated            │ │
│  ⚠️ Validation Warnings (2)        │                                  │ │
│  ─────────────────────────────────  │  [🔍 View QR Code]              │ │
│  • Phone format may be invalid    └──────────────────────────────────┘ │
│  • Template dimensions: 800x800                                         │
│    (recommended: 1024x1024)                                             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ✓ All previews look good!                                      │   │
│  │  Ready to generate full batch of {totalRecipients} DMs          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Adjust Template]  [Looks Good - Generate All {totalRecipients} DMs]  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ RISK MITIGATION

### 1. NO IMPACT on Existing Batch Generation
**Mitigation**:
- Preview button is separate from "Generate Batch" button
- `handleGenerateBatch()` function is NOT modified
- Users can still skip preview and go straight to batch
- Preview is purely client-side (no database writes)

### 2. Performance (Client-Side Rendering)
**Mitigation**:
- Limit to 5 previews maximum
- Use same Fabric.js logic as existing renderer
- Show loading spinner during preview generation
- Previews are ephemeral (not saved to database)

### 3. Memory Usage
**Mitigation**:
- Clear preview data when modal closes
- Use canvas.dispose() to free memory
- Base64 images are cleared from state after use

---

## 🧪 TESTING CHECKLIST

- [ ] Preview button only enabled when template + CSV uploaded
- [ ] Preview modal displays correctly (carousel navigation)
- [ ] Variable substitutions visible in preview
- [ ] QR codes generate correctly in preview
- [ ] Phone numbers display correctly (conditional)
- [ ] Validation warnings show when applicable
- [ ] "Approve" button creates batch job (same as before)
- [ ] "Adjust Template" button closes modal and returns to editor
- [ ] Existing "Generate Batch" button works without preview
- [ ] No console errors
- [ ] Memory cleanup on modal close
- [ ] Keyboard navigation works (arrows, escape, enter)

---

## 📝 IMPLEMENTATION STEPS

### Step 1: Template Validator (1 hour)
- Create `lib/template-validator.ts`
- Implement `validateTemplate()` function
- Implement `validateBatch()` function
- Add phone number regex validation
- Add template dimension checks
- Test with sample data

### Step 2: Preview Renderer (2 hours)
- Create `lib/batch-processor/preview-renderer.ts`
- Implement `generateBatchPreviews()` function
- Implement `renderSinglePreview()` function
- Use Fabric.js for client-side canvas rendering
- Generate QR codes for previews
- Test preview generation with sample recipients

### Step 3: Batch Preview Modal (3 hours)
- Create `components/dm-creative/batch-preview.tsx`
- Build modal layout with Carousel
- Add recipient details sidebar
- Add variable substitution badges
- Add validation warnings panel
- Add keyboard navigation
- Add action buttons (Approve, Adjust, Close)
- Style with Tailwind CSS + shadcn/ui

### Step 4: Editor Integration (1 hour)
- Modify `app/dm-creative/editor/page.tsx`
- Add preview state and handlers
- Add "Preview Batch" button
- Integrate BatchPreviewModal component
- Test integration

### Step 5: Testing & Polish (1 hour)
- Test full preview flow
- Verify existing batch generation unchanged
- Test error cases (missing data, invalid phone)
- Check memory cleanup
- Verify keyboard shortcuts
- Polish UI animations

---

## 📊 PROGRESS TRACKING

| Step | Task | Estimated | Status |
|------|------|-----------|--------|
| 1 | Template Validator | 1h | ⏳ Pending |
| 2 | Preview Renderer | 2h | ⏳ Pending |
| 3 | Batch Preview Modal | 3h | ⏳ Pending |
| 4 | Editor Integration | 1h | ⏳ Pending |
| 5 | Testing & Polish | 1h | ⏳ Pending |
| **Total** | | **8h** | **0% Complete** |

---

## ✅ COMPLETION CRITERIA

**Feature is complete when:**
1. ✅ User can click "Preview Batch" and see first 5 recipients
2. ✅ Carousel navigation works smoothly
3. ✅ Variable substitutions are clearly visible
4. ✅ Validation warnings display when applicable
5. ✅ "Approve" button generates full batch correctly
6. ✅ Existing "Generate Batch" button still works without preview
7. ✅ No console errors or memory leaks
8. ✅ UI is intuitive and user-friendly

**Zero negative impact when:**
1. ✅ Users who don't use preview see no changes
2. ✅ Batch generation flow works exactly as before
3. ✅ No database schema changes required
4. ✅ No modification to batch processing workers
5. ✅ All existing tests pass
