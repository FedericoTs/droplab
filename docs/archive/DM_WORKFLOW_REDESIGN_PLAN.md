# 🎯 DM Creative Workflow Redesign - Implementation Plan

## 📋 Executive Summary

**Objective**: Simplify DM creation workflow to single-step generation with immediate canvas editing, followed by CSV batch processing with background reuse.

**Key Changes**:
- ✅ Remove fine-tune modal (single-step generation)
- ✅ Scene description drives ALL image generation (no custom instructions)
- ✅ Quality as slider (low/medium/high with cost display)
- ✅ Phone number in campaign details
- ✅ Always navigate to Canvas Editor
- ✅ CSV batch reuses background image (no regeneration)

---

## 🎨 New Workflow - Option A: Two-Step Design

### **Phase 1: Design DM with Sample Recipient**

```
┌─────────────────────────────────────────────────────┐
│  DM CREATIVE FORM (dm-creative page)                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📋 RECIPIENT DETAILS                               │
│  ┌────────────────────────────────────────────┐    │
│  │ First Name: [John          ]               │    │
│  │ Last Name:  [Doe           ]               │    │
│  │ Address:    [123 Main St   ]               │    │
│  │ City:       [Springfield   ]               │    │
│  │ ZIP:        [12345         ]               │    │
│  └────────────────────────────────────────────┘    │
│  ℹ️  Sample data - will be replaced in batch       │
│                                                      │
│  ✍️ CAMPAIGN DETAILS                                │
│  ┌────────────────────────────────────────────┐    │
│  │ Campaign Name: [Miracle-Ear Oct 2025]      │    │
│  │ (Auto-suggested: Company + Month Year)     │    │
│  │                                             │    │
│  │ Marketing Message:                          │    │
│  │ ┌──────────────────────────────────────┐   │    │
│  │ │ Ready to reconnect with family...    │   │    │
│  │ │                                      │   │    │
│  │ └──────────────────────────────────────┘   │    │
│  │                                             │    │
│  │ 24/7 Phone Number: [+1 (800) 555-1234]    │    │
│  │ (Will appear on all DMs)                   │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  🎨 AI IMAGE SETTINGS                               │
│  ┌────────────────────────────────────────────┐    │
│  │ 🌟 Scene Description                        │    │
│  │ ┌──────────────────────────────────────┐   │    │
│  │ │ Happy and active social life scene   │   │    │
│  │ │ with 1-2 people smiling and          │   │    │
│  │ │ engaging in conversation, natural    │   │    │
│  │ │ warm lighting, intimate cozy         │   │    │
│  │ │ setting, friendly atmosphere, NOT    │   │    │
│  │ │ crowded, authentic lifestyle         │   │    │
│  │ │ photography                          │   │    │
│  │ └──────────────────────────────────────┘   │    │
│  │ ℹ️  All image instructions go here          │    │
│  │                                             │    │
│  │ Image Quality (affects cost):               │    │
│  │ ┌──────────────────────────────────────┐   │    │
│  │ │ Low ●────────○──────○ High           │   │    │
│  │ │ $0.04      $0.06    $0.08            │   │    │
│  │ └──────────────────────────────────────┘   │    │
│  │                                             │    │
│  │ Aspect Ratio:                               │    │
│  │ [○ Square] [● Landscape] [○ Portrait]      │    │
│  │                                             │    │
│  │ Layout Template:                            │    │
│  │ [● Classic] [○ Minimal] [○ Split]          │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  [ 🎨 Generate DM & Open Editor ]                   │
│                                                      │
└─────────────────────────────────────────────────────┘
         ↓ Click Generate
         ↓
┌─────────────────────────────────────────────────────┐
│  LOADING...                                          │
│  ⏳ Generating AI background image...               │
│  ⏳ Creating QR code and tracking...                │
│  ⏳ Opening Canvas Editor...                        │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│  CANVAS EDITOR (Full-Screen, No Sidebar)            │
│  URL: /dm-creative/editor                           │
├─────────────────────────────────────────────────────┤
│  [← Back] Campaign: Miracle-Ear Oct 2025  [Save]   │
├────┬────────────────────────────────────────────────┤
│ T  │                                                 │
│ O  │   ┌─────────────────────────────────────┐     │
│ O  │   │ AI BACKGROUND IMAGE (full canvas)   │     │
│ L  │   │                                     │     │
│ B  │   │ [Logo] Miracle-Ear                  │     │
│ A  │   │                                     │     │
│ R  │   │ Ready to reconnect with family...   │     │
│    │   │                                     │     │
│ [T]│   │                                     │     │
│ [□]│   │                                     │     │
│ [○]│   │ John Doe                            │     │
│ [↑]│   │ 123 Main St, Springfield, 12345     │     │
│    │   │ 📞 +1 (800) 555-1234          [QR] │     │
│    │   └─────────────────────────────────────┘     │
│    │                                                 │
├────┴─────────────────────────────────────────────────┤
│  1536×1024px  [-] 100% [+] [Fit]      Page 1 of 1  │
└─────────────────────────────────────────────────────┘

USER ACTIONS:
✅ Drag text elements to reposition
✅ Resize QR code
✅ Edit text by double-clicking
✅ Add shapes/images from toolbar
✅ Adjust spacing

         ↓ Click "Save as Campaign Template"
         ↓
┌─────────────────────────────────────────────────────┐
│  ✅ Campaign Template Saved!                        │
│  Campaign: Miracle-Ear Oct 2025                     │
│  Background image saved for batch processing        │
│  Returning to DM Creative page...                   │
└─────────────────────────────────────────────────────┘
```

---

### **Phase 2: Apply to CSV Batch**

```
┌─────────────────────────────────────────────────────┐
│  DM CREATIVE PAGE (after campaign saved)            │
├─────────────────────────────────────────────────────┤
│  ✅ CAMPAIGN CREATED                                │
│  ┌────────────────────────────────────────────┐    │
│  │ 📁 Campaign: Miracle-Ear Oct 2025          │    │
│  │ ✅ Background image saved                   │    │
│  │ ✅ Layout template saved                    │    │
│  │ [Preview DM] [Edit in Canvas]              │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  📊 APPLY TO CSV BATCH                              │
│  ┌────────────────────────────────────────────┐    │
│  │ Upload CSV file with recipient data:       │    │
│  │                                             │    │
│  │ [📄 Choose File] recipients.csv            │    │
│  │                                             │    │
│  │ Required columns:                           │    │
│  │ • name, lastname, address, city, zip       │    │
│  │                                             │    │
│  │ ✅ 500 recipients found                     │    │
│  │ Preview:                                    │    │
│  │ ┌──────────────────────────────────────┐   │    │
│  │ │ Row 1: Jane Smith, 456 Oak Ave...    │   │    │
│  │ │ Row 2: Bob Johnson, 789 Elm St...    │   │    │
│  │ │ ... (498 more)                       │   │    │
│  │ └──────────────────────────────────────┘   │    │
│  │                                             │    │
│  │ [🚀 Generate 500 DM Pieces]                │    │
│  │ Est. time: ~2 minutes                       │    │
│  │ (Reusing background - fast!)                │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
         ↓ Click Generate Batch
         ↓
┌─────────────────────────────────────────────────────┐
│  BATCH PROCESSING...                                 │
│  ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 50% (250/500)                │
│                                                      │
│  ⏳ Creating unique QR codes...                     │
│  ⏳ Composing personalized DMs...                   │
│  ⏳ Generating tracking links...                    │
│                                                      │
│  Note: Reusing background image (no AI cost!)       │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│  ✅ BATCH COMPLETE!                                 │
│  ┌────────────────────────────────────────────┐    │
│  │ 500 Direct Mail pieces generated            │    │
│  │ ✅ Unique QR codes: 500                     │    │
│  │ ✅ Tracking links: 500                      │    │
│  │ ✅ Landing pages: 500                       │    │
│  │                                             │    │
│  │ Total cost: $0.04 (1 AI image)              │    │
│  │ Saved: $19.96 (499 images reused!)          │    │
│  │                                             │    │
│  │ [📥 Download All as ZIP] 150 MB             │    │
│  │ [📊 View Campaign Analytics]                │    │
│  │ [📧 Export Tracking URLs CSV]               │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation Details

### **1. Form Redesign (dm-builder.tsx)**

**Remove:**
- ❌ `promptStyle` state and dropdown
- ❌ `customInstructions` state and textarea
- ❌ `enableFineTuning` toggle
- ❌ Fine-tune modal (`<FineTuneModal>` component)

**Add:**
- ✅ `phoneNumber` field in Campaign Details section
- ✅ Quality slider (replace radio buttons):
  ```tsx
  <Slider
    value={[imageQualityIndex]}
    onValueChange={([value]) => {
      const qualities: ImageQuality[] = ['low', 'medium', 'high'];
      setImageQuality(qualities[value]);
    }}
    min={0}
    max={2}
    step={1}
    className="w-full"
  />
  <div className="flex justify-between text-xs">
    <span>Low ($0.04)</span>
    <span>Medium ($0.06)</span>
    <span>High ($0.08)</span>
  </div>
  ```

**Update:**
- Scene description remains as large textarea (purple box)
- All image settings always visible (no collapsible)
- Remove "Advanced Options" collapsible

---

### **2. API Route Updates**

#### **A. /api/dm-creative/generate/route.ts**

**Changes:**
1. Accept `phoneNumber` in request body
2. Accept `sceneDescription` in request body
3. Pass `sceneDescription` to image generation:
   ```ts
   // OLD (doesn't use scene description)
   backgroundImage = await generateDMCreativeImage(message, companyContext, apiKey);

   // NEW (passes scene description)
   backgroundImage = await generateDMCreativeImage(
     message,
     companyContext,
     apiKey,
     sceneDescription  // NEW parameter
   );
   ```

4. Set `noLogoStrength` to 10 permanently in V2 calls:
   ```ts
   const result = await generateDMCreativeImageV2({
     message,
     context: companyContext,
     apiKey,
     quality: imageQuality as ImageQuality,
     size: imageAspectRatio as ImageSize,
     brandConfig,
     layoutTemplate,
     noLogoStrength: 10,  // ALWAYS MAX
     customSceneDescription: sceneDescription,  // From form
   });
   ```

5. Store phone number in campaign/recipient data

---

#### **B. lib/ai/openai.ts - generateDMCreativeImage()**

**Update signature to accept scene description:**
```ts
export async function generateDMCreativeImage(
  message: string,
  context: CompanyContext,
  apiKey: string,
  sceneDescription?: string  // NEW optional parameter
): Promise<string> {
  const openai = new OpenAI({ apiKey });

  // Build prompt using scene description if provided
  const imagePrompt = sceneDescription
    ? buildPromptWithScene(sceneDescription, context)
    : buildDefaultPrompt(message, context);  // Fallback to old logic

  // ... rest of function
}

function buildPromptWithScene(scene: string, context: CompanyContext): string {
  return `A horizontal advertisement poster, flat graphic style, vibrant colors.

Left third: solid deep navy blue panel (#003E7E color).

Right two-thirds: ${scene}

Style: professional healthcare advertisement, clean modern graphic, flat design, digital poster format, NO TEXT OVERLAYS, NO LOGOS, vivid photography on right, solid color block on left.

Flat vector advertisement style, sharp division between blue panel and photograph, horizontal layout, contemporary marketing aesthetic, simple clean composition.

CRITICAL: NO company logos, NO brand marks, NO text or typography of any kind. Photography ONLY.`;
}
```

---

#### **C. lib/ai/openai-v2.ts - generateDMCreativeImageV2()**

**Already supports `customSceneDescription`** ✅
- Just ensure `noLogoStrength` defaults to 10
- Remove `promptStyle` parameter (not used anymore)

---

### **3. Canvas Editor Fixes (dm-creative/editor/page.tsx)**

**Problem**: Canvas shows empty white screen

**Root Cause Analysis Needed**: Check these potential issues:

1. **sessionStorage not loading?**
   ```ts
   // Add debug logging
   useEffect(() => {
     const dataStr = sessionStorage.getItem("dm-editor-data");
     console.log('📦 sessionStorage data:', dataStr);

     if (!dataStr) {
       console.error('❌ No dm-editor-data found!');
       toast.error("No editor data found");
       router.push("/dm-creative");
       return;
     }

     const data = JSON.parse(dataStr);
     console.log('✅ Parsed editor data:', data);
     setEditorData(data);
   }, [router]);
   ```

2. **Fabric.js not initializing?**
   ```ts
   // Add debug in canvas initialization
   useEffect(() => {
     console.log('🎨 Initializing canvas...');
     console.log('Canvas ref:', canvasRef.current);
     console.log('Editor data:', editorData);

     if (!canvasRef.current || !editorData || fabricCanvasRef.current) {
       console.warn('⚠️ Skipping canvas init:', {
         hasRef: !!canvasRef.current,
         hasData: !!editorData,
         alreadyInitialized: !!fabricCanvasRef.current
       });
       return;
     }

     // ... rest of init
   }, [editorData]);
   ```

3. **Background image not loading?**
   ```ts
   // Add error handling
   fabric.Image.fromURL(editorData.backgroundImage, (img) => {
     console.log('📸 Background image loaded:', img);

     if (!img || !img.width) {
       console.error('❌ Invalid background image!');
       toast.error('Failed to load background');
       return;
     }

     img.set({
       left: 0,
       top: 0,
       scaleX: editorData.canvasWidth / (img.width || editorData.canvasWidth),
       scaleY: editorData.canvasHeight / (img.height || editorData.canvasHeight),
       selectable: false,
       evented: false,
     });

     canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
     console.log('✅ Background set, adding DM elements...');
     addDMElements(canvas, editorData);
   }, {}, { crossOrigin: 'anonymous' });  // Add crossOrigin if image from external URL
   ```

**Changes to Make:**

1. **Remove company name headline** from `addDMElements()`:
   ```ts
   const addDMElements = (canvas: fabric.Canvas, data: EditorData) => {
     const padding = 30;
     const primaryColor = data.brandColors?.primary || "#003E7E";
     const textColor = data.brandColors?.text || "#1F2937";

     // Add logo
     if (data.logoUrl) {
       fabric.Image.fromURL(data.logoUrl, (img) => {
         img.set({
           left: padding,
           top: padding,
           scaleX: 150 / (img.width || 150),
           scaleY: 70 / (img.height || 70),
         });
         canvas.add(img);
       });
     }

     // REMOVE THIS SECTION:
     // const headline = new fabric.IText(data.companyName, {
     //   left: padding,
     //   top: padding + 90,
     //   fontSize: 42,
     //   fontFamily: "Arial",
     //   fontWeight: "bold",
     //   fill: primaryColor,
     // });
     // canvas.add(headline);

     // Add marketing message (move UP to where headline was)
     const messageText = new fabric.Textbox(data.message, {
       left: padding,
       top: padding + 90,  // Takes headline's position
       width: 400,
       fontSize: 20,
       fontFamily: "Arial",
       fill: textColor,
     });
     canvas.add(messageText);

     // Rest of elements remain the same...
     // Customer name, address, phone, QR code
   };
   ```

2. **Add "Save as Campaign Template" functionality:**
   ```ts
   const handleSaveTemplate = async () => {
     const canvas = fabricCanvasRef.current;
     if (!canvas) return;

     canvas.discardActiveObject();
     canvas.renderAll();

     const dataURL = canvas.toDataURL({
       format: "png",
       quality: 1,
       multiplier: 1,
     });

     // Save to campaign as template
     try {
       const response = await fetch('/api/dm-creative/save-template', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           campaignId: editorData.campaignId,
           templateImage: dataURL,
           layoutData: canvas.toJSON(),  // Save canvas layout for batch
         }),
       });

       const result = await response.json();

       if (result.success) {
         toast.success("Campaign template saved! Ready for CSV batch.");
         router.push("/dm-creative?campaignSaved=true");
       } else {
         toast.error("Failed to save template");
       }
     } catch (error) {
       console.error('Error saving template:', error);
       toast.error("Error saving template");
     }
   };
   ```

3. **Update UI with new button:**
   ```tsx
   <Button onClick={handleSaveTemplate} className="bg-green-600 hover:bg-green-700 gap-2">
     <Check className="w-4 h-4" />
     Save as Campaign Template
   </Button>
   ```

---

### **4. CSV Batch Processing**

#### **A. Add CSV Upload Section to dm-builder.tsx**

```tsx
{/* Show after campaign is saved */}
{campaignInfo && (
  <Card className="mt-8 border-green-200 bg-green-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Check className="w-5 h-5 text-green-600" />
        Campaign Created: {campaignInfo.name}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push('/dm-creative/editor')}>
          Preview DM
        </Button>
        <Button variant="outline">Edit in Canvas</Button>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">Apply to CSV Batch</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload a CSV file to generate personalized DMs for multiple recipients using this design.
        </p>

        <input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          className="mb-2"
        />

        {csvData && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              ✅ {csvData.length} recipients found
            </p>
            <div className="bg-white p-2 rounded border text-xs max-h-32 overflow-auto">
              {csvData.slice(0, 5).map((row, i) => (
                <div key={i}>
                  Row {i + 1}: {row.name} {row.lastname}, {row.address}...
                </div>
              ))}
              {csvData.length > 5 && <div>... {csvData.length - 5} more</div>}
            </div>
            <Button
              onClick={handleGenerateBatch}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isBatchProcessing}
            >
              {isBatchProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing {batchProgress}/{csvData.length}...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate {csvData.length} DM Pieces
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)}
```

#### **B. Implement Batch Processing Logic**

```ts
const [csvData, setCsvData] = useState<any[]>([]);
const [isBatchProcessing, setIsBatchProcessing] = useState(false);
const [batchProgress, setBatchProgress] = useState(0);

const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target?.result as string;
    Papa.parse(text, {
      header: true,
      complete: (results) => {
        // Validate required columns
        const requiredCols = ['name', 'lastname', 'address', 'city', 'zip'];
        const headers = Object.keys(results.data[0] || {});
        const missing = requiredCols.filter(col => !headers.includes(col));

        if (missing.length > 0) {
          toast.error(`Missing required columns: ${missing.join(', ')}`);
          return;
        }

        setCsvData(results.data);
        toast.success(`${results.data.length} recipients loaded`);
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`);
      },
    });
  };
  reader.readAsText(file);
};

const handleGenerateBatch = async () => {
  if (!campaignInfo || !csvData.length) return;

  setIsBatchProcessing(true);
  setBatchProgress(0);

  try {
    // Call batch API endpoint
    const response = await fetch('/api/dm-creative/generate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: campaignInfo.id,
        recipients: csvData,
        // Background image will be fetched from campaign assets
      }),
    });

    const result = await response.json();

    if (result.success) {
      toast.success(`${result.count} DMs generated successfully!`);
      // Show download options
      setShowBatchResults(true);
      setBatchResults(result);
    } else {
      toast.error(result.error || 'Batch processing failed');
    }
  } catch (error) {
    console.error('Batch processing error:', error);
    toast.error('Failed to process batch');
  } finally {
    setIsBatchProcessing(false);
  }
};
```

#### **C. Create Batch API Route (/api/dm-creative/generate-batch/route.ts)**

```ts
import { NextRequest, NextResponse } from "next/server";
import { generateQRCode } from "@/lib/qr-generator";
import { createRecipient, getCampaignAssets } from "@/lib/database/tracking-queries";
import { composeDMImageBrowser } from "@/lib/dm-image-compositor-browser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, recipients } = body;

    if (!campaignId || !recipients || !Array.isArray(recipients)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting batch processing: ${recipients.length} recipients`);

    // Fetch campaign assets (background image stored from Phase 1)
    const assets = getCampaignAssets(campaignId);
    const backgroundAsset = assets.find(a => a.asset_type === 'background_image');

    if (!backgroundAsset) {
      return NextResponse.json(
        { success: false, error: "Campaign background not found" },
        { status: 404 }
      );
    }

    const backgroundImage = `data:image/png;base64,${backgroundAsset.file_data.toString('base64')}`;
    console.log('✅ Background image loaded from campaign assets');

    // Process each recipient
    const results = [];
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];

      // Create recipient record (generates tracking ID)
      const dbRecipient = createRecipient({
        campaignId,
        name: recipient.name,
        lastname: recipient.lastname,
        address: recipient.address,
        city: recipient.city,
        zip: recipient.zip,
        email: recipient.email,
        phone: recipient.phone,
      });

      const trackingId = dbRecipient.tracking_id;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const landingPageUrl = `${baseUrl}/lp/${trackingId}`;

      // Generate unique QR code for this recipient
      const qrCodeDataUrl = await generateQRCode(landingPageUrl);

      // Compose final DM (reusing background!)
      const finalImage = await composeDMImageBrowser({
        backgroundImage,  // REUSED from campaign
        recipient: {
          name: recipient.name,
          lastname: recipient.lastname,
          address: recipient.address,
          city: recipient.city,
          zip: recipient.zip,
        },
        message: campaign.message,  // From campaign
        qrCodeDataUrl,
        companyName: campaign.company_name,
        logoUrl: campaign.logo_url,
        layout: campaign.layout_template,
        aspectRatio: campaign.aspect_ratio,
      });

      results.push({
        recipientId: dbRecipient.id,
        trackingId,
        landingPageUrl,
        finalImage,
      });

      console.log(`✅ Processed ${i + 1}/${recipients.length}`);
    }

    console.log(`🎉 Batch complete: ${results.length} DMs generated`);

    return NextResponse.json({
      success: true,
      count: results.length,
      results,  // Array of generated DMs
    });

  } catch (error: unknown) {
    console.error("Error in batch processing:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
```

---

## 📊 Data Flow Summary

### **Phase 1: Design DM**
```
User fills form with sample recipient
    ↓
Click "Generate DM & Open Editor"
    ↓
API: /api/dm-creative/generate
    • Accepts sceneDescription from form
    • Calls generateDMCreativeImage() WITH scene description
    • Creates Campaign record in DB
    • Saves background image to assets table (linked to campaign)
    • Generates QR code and tracking for sample recipient
    • Returns all data
    ↓
Navigate to /dm-creative/editor
    • sessionStorage: dm-editor-data with all content
    ↓
Canvas Editor displays:
    • Background image (from API)
    • Logo (from Brand Kit)
    • Marketing message
    • Sample recipient name/address
    • Phone number
    • QR code
    ↓
User edits layout, positions elements
    ↓
Click "Save as Campaign Template"
    ↓
API: /api/dm-creative/save-template
    • Saves canvas layout (JSON)
    • Marks campaign as "template ready"
    ↓
Return to /dm-creative with success message
```

### **Phase 2: CSV Batch**
```
User uploads CSV file (500 rows)
    ↓
Parse CSV, validate columns
    ↓
Preview: "500 recipients found"
    ↓
Click "Generate 500 DM Pieces"
    ↓
API: /api/dm-creative/generate-batch
    • Fetches background image from campaign assets
    • For EACH recipient in CSV:
        - Create recipient record (new tracking ID)
        - Generate unique QR code
        - Compose DM using SAME background + recipient data
        - Save as asset
    • Returns array of 500 DMs
    ↓
Show results:
    • "500 DMs generated"
    • [Download ZIP] button
    • Total cost: $0.04 (only 1 AI image!)
```

---

## ✅ Success Criteria

1. ✅ **Form is clean and simple** - no fine-tune modal, all settings visible
2. ✅ **Scene description controls everything** - no separate custom instructions
3. ✅ **Quality is a slider** with cost display
4. ✅ **Phone number in form** - appears on all DMs
5. ✅ **Single-step generation** - always goes to canvas editor
6. ✅ **Canvas shows all content** - background, logo, text, QR
7. ✅ **No company name headline** - removed from canvas
8. ✅ **CSV batch reuses background** - massive cost savings
9. ✅ **Unique tracking per recipient** - QR codes and landing pages
10. ✅ **Download batch as ZIP** - all 500 DMs ready for print

---

## 🚨 Current Blockers - Need User Input

### **BLOCKER #1: Canvas Editor Empty Issue**

**User needs to provide:**
1. Open browser DevTools (F12)
2. Go to Console tab - copy any red errors
3. Go to Application tab → Session Storage → Look for `dm-editor-data`
4. Screenshot or paste the content

**This is critical to fix before proceeding with other tasks.**

---

## 📅 Implementation Order

1. ✅ **Debug canvas empty issue** (NEED USER INPUT - see blocker above)
2. ✅ **Redesign form UI** (remove modal, add phone, slider quality)
3. ✅ **Wire scene description** to API and image generation
4. ✅ **Fix canvas editor** to display all content
5. ✅ **Remove company name headline** from canvas
6. ✅ **Add campaign save** functionality
7. ✅ **Create CSV upload section** in DM Creative page
8. ✅ **Implement batch processing** with background reuse
9. ✅ **Add ZIP download** for batch results
10. ✅ **End-to-end testing**

---

## 💰 Cost Optimization

**Without Background Reuse** (old way):
- 500 recipients × $0.04 per image = **$20.00**

**With Background Reuse** (new way):
- 1 design image × $0.04 = **$0.04**
- 499 recipients reuse same background = **$0.00**
- **Total: $0.04** ✅

**Savings: $19.96 (99.8% cost reduction!)**

---

## 🎯 Next Steps

1. **USER ACTION REQUIRED**: Provide debug info for empty canvas (see Blocker #1)
2. Once debug info received, start implementation in order listed above
3. Update this document as each task is completed
4. Test thoroughly at each step

---

**Last Updated**: 2025-10-17
**Status**: Awaiting debug info for canvas empty issue
