# Phase 2 Implementation Plan: Sharp-Based Pre-Rendering

**Objective**: Achieve 1000 DMs/minute throughput (50-100x speedup from Phase 1)

**Current State**: Phase 1 achieves 40-80 DMs/minute with puppeteer-cluster parallel rendering
**Target State**: 500-1000 DMs/minute using Sharp image composition

---

## 🎯 Core Strategy

### High-Level Approach

**Phase 1 (Current)**: Template → Puppeteer Render → PDF (per recipient)
- ✅ Parallel rendering with 4-8 browser contexts
- ⏱️ 750-1500ms per DM (render-dominant workload)
- 🎨 Full Fabric.js rendering for every DM

**Phase 2 (Proposed)**: Template → **ONE Puppeteer render** → Sharp composition → PDF (per recipient)
- 🖼️ Render template **once** to high-res PNG (3000x2000px)
- 📦 Cache rendered template as static image
- ⚡ Use Sharp to overlay text/QR codes (60ms per DM)
- 🚀 50-100x faster than current approach

---

## 📊 Performance Analysis

### Current Performance Breakdown (Phase 1)

| Stage | Time per DM | % of Total |
|-------|-------------|------------|
| Puppeteer render (Fabric.js) | 700-1400ms | 85-95% |
| PDF generation | 50-100ms | 5-10% |
| Database updates | 10-30ms | 1-3% |
| **Total** | **750-1500ms** | **100%** |

**Bottleneck**: Puppeteer rendering of 2.6MB Fabric.js template

### Phase 2 Performance Projection

| Stage | Time | Frequency | Notes |
|-------|------|-----------|-------|
| **Template pre-render** | 15-20s | **Once per template** | High-res PNG with Puppeteer |
| **Sharp text overlay** | 30-50ms | Per DM | Recipient name, address, message |
| **Sharp QR code overlay** | 10-20ms | Per DM | Unique QR code per recipient |
| **PDF generation** | 50-100ms | Per DM | From composited PNG |
| **Total per DM** | **90-170ms** | Per DM | **8-16x faster** |

**Expected Throughput**: 500-1000 DMs/minute (vs current 40-80)

---

## 🏗️ Architecture Design

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     TEMPLATE CREATION                       │
│  User creates template in Fabric.js editor                 │
│  - Canvas JSON saved to database                           │
│  - Background image stored                                 │
│  - Variable mappings stored                                │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  PRE-RENDERING PIPELINE (NEW)               │
│                                                             │
│  1. Load template from database                            │
│  2. Render with Puppeteer at 3000x2000px (high DPI)       │
│  3. Export as PNG buffer                                   │
│  4. Store in:                                              │
│     - File: batch-output/templates/{templateId}.png        │
│     - Database: dm_templates.rendered_image (base64)       │
│  5. Extract variable zones (bounding boxes):               │
│     {                                                      │
│       recipientName: { x, y, width, height, fontSize }    │
│       message: { x, y, width, height, fontSize }          │
│       qrCode: { x, y, width, height }                     │
│     }                                                      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              BATCH PROCESSING (SHARP-BASED)                 │
│                                                             │
│  Phase 1: Load pre-rendered template (once)                │
│  ├─ const baseImage = sharp('template.png')                │
│  └─ Parse variable zones from database                     │
│                                                             │
│  Phase 2: For each recipient (parallel, 8-16 workers)      │
│  ├─ Generate QR code (qrcode library)                      │
│  ├─ Composite layers with Sharp:                           │
│  │   ├─ baseImage (background)                             │
│  │   ├─ text overlay (recipient name/address)              │
│  │   ├─ text overlay (personalized message)                │
│  │   └─ QR code overlay                                    │
│  ├─ Export as PNG buffer                                   │
│  └─ Generate PDF from buffer                               │
│                                                             │
│  Phase 3: Create ZIP archive                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Model Changes

#### Database Schema Updates

**Add to `dm_templates` table**:
```sql
ALTER TABLE dm_templates ADD COLUMN rendered_image TEXT;  -- base64 PNG or file path
ALTER TABLE dm_templates ADD COLUMN variable_zones TEXT;  -- JSON: { name: { x, y, w, h }, ... }
ALTER TABLE dm_templates ADD COLUMN is_pre_rendered INTEGER DEFAULT 0;
ALTER TABLE dm_templates ADD COLUMN rendered_width INTEGER;
ALTER TABLE dm_templates ADD COLUMN rendered_height INTEGER;
```

**Variable Zones Format**:
```typescript
interface VariableZone {
  x: number;           // Position in pixels
  y: number;
  width: number;       // Bounding box dimensions
  height: number;
  fontSize: number;    // Font size for text overlays
  fontFamily: string;  // Font family (e.g., 'Arial', 'Inter')
  fontWeight: string;  // 'normal', 'bold', etc.
  color: string;       // Text color (hex)
  textAlign: 'left' | 'center' | 'right';
  maxLines?: number;   // For multi-line text wrapping
}

interface TemplateVariableZones {
  recipientName?: VariableZone;
  recipientAddress?: VariableZone;
  message?: VariableZone;
  phoneNumber?: VariableZone;
  qrCode?: VariableZone;
  logo?: VariableZone;
}
```

---

## 🔧 Implementation Steps

### Step 1: Pre-Rendering Service (NEW)

**File**: `lib/template-renderer/template-pre-renderer.ts`

**Responsibilities**:
1. Load template from database (Fabric.js JSON)
2. Render template at high resolution (3000x2000px) with Puppeteer
3. Extract variable zones by analyzing Fabric.js objects
4. Save rendered PNG + variable zones to database
5. Cleanup browser resources

**Key Functions**:
```typescript
export async function preRenderTemplate(
  templateId: string
): Promise<{
  renderedImagePath: string;
  variableZones: TemplateVariableZones;
  width: number;
  height: number;
}> {
  // 1. Fetch template from database
  const template = getDMTemplate(templateId);

  // 2. Parse canvas JSON to find variable objects
  const variableZones = extractVariableZones(
    template.canvasJSON,
    template.variableMappings,
    template.canvasWidth,
    template.canvasHeight
  );

  // 3. Render template with Puppeteer (high DPI)
  const targetWidth = 3000;
  const targetHeight = Math.round(
    (template.canvasHeight / template.canvasWidth) * targetWidth
  );

  const renderedPNG = await renderTemplateToHighResPNG(
    template,
    targetWidth,
    targetHeight
  );

  // 4. Save to file system
  const imagePath = path.join(
    TEMPLATE_CACHE_DIR,
    `${templateId}.png`
  );
  fs.writeFileSync(imagePath, renderedPNG);

  // 5. Update database
  updateTemplatePreRender(templateId, {
    renderedImage: imagePath,
    variableZones: JSON.stringify(variableZones),
    isPreRendered: 1,
    renderedWidth: targetWidth,
    renderedHeight: targetHeight,
  });

  return { renderedImagePath: imagePath, variableZones, width: targetWidth, height: targetHeight };
}

function extractVariableZones(
  canvasJSON: string,
  variableMappings: string,
  canvasWidth: number,
  canvasHeight: number
): TemplateVariableZones {
  const canvas = JSON.parse(canvasJSON);
  const mappings = JSON.parse(variableMappings || '{}');
  const zones: TemplateVariableZones = {};

  // Scale factor for high-res rendering
  const scaleFactor = 3000 / canvasWidth;

  canvas.objects.forEach((obj: any, idx: number) => {
    const mapping = mappings[idx.toString()];
    if (!mapping?.variableType || mapping.isReusable) return;

    const zone: VariableZone = {
      x: Math.round(obj.left * scaleFactor),
      y: Math.round(obj.top * scaleFactor),
      width: Math.round((obj.width || 100) * (obj.scaleX || 1) * scaleFactor),
      height: Math.round((obj.height || 50) * (obj.scaleY || 1) * scaleFactor),
      fontSize: Math.round((obj.fontSize || 16) * scaleFactor),
      fontFamily: obj.fontFamily || 'Arial',
      fontWeight: obj.fontWeight || 'normal',
      color: obj.fill || '#000000',
      textAlign: obj.textAlign || 'left',
    };

    zones[mapping.variableType as keyof TemplateVariableZones] = zone;
  });

  return zones;
}
```

### Step 2: Sharp Image Compositor (NEW)

**File**: `lib/batch-processor/sharp-compositor.ts`

**Responsibilities**:
1. Load pre-rendered template image
2. Generate text overlays with Sharp
3. Generate QR code and overlay
4. Composite all layers into final PNG

**Key Functions**:
```typescript
import sharp from 'sharp';
import QRCode from 'qrcode';

export async function composeDMWithSharp(
  templateImagePath: string,
  variableZones: TemplateVariableZones,
  recipientData: RecipientData,
  qrCodeDataUrl: string
): Promise<Buffer> {
  // 1. Load base template image
  const baseImage = sharp(templateImagePath);
  const { width, height } = await baseImage.metadata();

  // 2. Generate text overlays as SVG
  const textOverlays: { input: Buffer; top: number; left: number }[] = [];

  // Recipient name overlay
  if (variableZones.recipientName) {
    const nameText = `${recipientData.name} ${recipientData.lastname}`;
    const nameSVG = createTextSVG(
      nameText,
      variableZones.recipientName
    );
    textOverlays.push({
      input: Buffer.from(nameSVG),
      top: variableZones.recipientName.y,
      left: variableZones.recipientName.x,
    });
  }

  // Message overlay
  if (variableZones.message) {
    const messageSVG = createTextSVG(
      recipientData.message,
      variableZones.message
    );
    textOverlays.push({
      input: Buffer.from(messageSVG),
      top: variableZones.message.y,
      left: variableZones.message.x,
    });
  }

  // 3. Generate QR code PNG
  if (variableZones.qrCode) {
    const qrBuffer = await QRCode.toBuffer(qrCodeDataUrl, {
      width: variableZones.qrCode.width,
      margin: 0,
    });
    textOverlays.push({
      input: qrBuffer,
      top: variableZones.qrCode.y,
      left: variableZones.qrCode.x,
    });
  }

  // 4. Composite all layers
  const finalImage = await baseImage
    .composite(textOverlays)
    .png({ quality: 90 })
    .toBuffer();

  return finalImage;
}

function createTextSVG(
  text: string,
  zone: VariableZone
): string {
  // Word wrapping
  const lines = wrapText(text, zone.width, zone.fontSize);

  // SVG generation
  const lineHeight = zone.fontSize * 1.2;
  const svgHeight = Math.min(lines.length * lineHeight, zone.height);

  return `
    <svg width="${zone.width}" height="${svgHeight}">
      <style>
        .text {
          font-family: ${zone.fontFamily};
          font-size: ${zone.fontSize}px;
          font-weight: ${zone.fontWeight};
          fill: ${zone.color};
          text-anchor: ${zone.textAlign === 'center' ? 'middle' : 'start'};
        }
      </style>
      ${lines.map((line, i) => `
        <text
          class="text"
          x="${zone.textAlign === 'center' ? zone.width / 2 : 0}"
          y="${(i + 1) * lineHeight}"
        >${escapeXML(line)}</text>
      `).join('')}
    </svg>
  `;
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  // Approximate character width (80% of font size)
  const charWidth = fontSize * 0.8;
  const maxChars = Math.floor(maxWidth / charWidth);

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}
```

### Step 3: Optimized Batch Orchestrator (MODIFIED)

**File**: `lib/batch-processor/batch-orchestrator-sharp.ts`

**Changes from Phase 1**:
- Replace puppeteer-cluster rendering with Sharp composition
- Pre-render template once at start
- Use worker pool for Sharp composition (CPU-bound)

**Key Implementation**:
```typescript
export async function processBatchJobWithSharp(
  payload: BatchJobPayload
): Promise<void> {
  const { batchJobId, templateId, recipients } = payload;

  console.log(`🚀 [SHARP-OPTIMIZED] Processing batch job: ${batchJobId}`);

  // ==================== PHASE 1: PRE-RENDER TEMPLATE ====================
  console.log(`\n🎨 Phase 1: Pre-rendering template (once)...`);
  const startTime = Date.now();

  const { renderedImagePath, variableZones, width, height } =
    await preRenderTemplate(templateId);

  const renderDuration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✅ Template pre-rendered in ${renderDuration}s\n`);

  // ==================== PHASE 2: SHARP COMPOSITION (PARALLEL) ====================
  console.log(`⚡ Phase 2: Compositing ${recipients.length} DMs with Sharp...`);
  const compStartTime = Date.now();

  // Use worker pool for parallel Sharp processing
  const concurrency = parseInt(process.env.SHARP_WORKER_CONCURRENCY || '8');
  const results = await pMap(
    recipients,
    async (recipient, index) => {
      try {
        // Generate QR code
        const qrCodeDataUrl = await QRCode.toDataURL(recipient.landingPageUrl);

        // Composite image with Sharp
        const composedPNG = await composeDMWithSharp(
          renderedImagePath,
          variableZones,
          recipient,
          qrCodeDataUrl
        );

        // Generate PDF
        const pdfBlob = await generatePDFFromPNG(
          composedPNG,
          { width, height },
          recipient.trackingId
        );

        // Save PDF
        const pdfPath = path.join(
          outputDir,
          `dm-${recipient.name}-${recipient.lastname}-${recipient.trackingId}.pdf`
        );
        fs.writeFileSync(pdfPath, Buffer.from(await pdfBlob.arrayBuffer()));

        return { success: true, pdfPath };
      } catch (error) {
        return { success: false, error };
      }
    },
    { concurrency }
  );

  const compDuration = ((Date.now() - compStartTime) / 1000).toFixed(1);
  console.log(`✅ Phase 2 complete: ${results.filter(r => r.success).length} DMs in ${compDuration}s`);
  console.log(`⚡ Average: ${(results.length / parseFloat(compDuration)).toFixed(1)} DMs/sec\n`);

  // ... (rest of orchestrator logic: ZIP creation, database updates, emails)
}
```

### Step 4: Template Editor Integration

**File**: `app/dm-creative/editor/page.tsx` (MODIFIED)

**New UI Features**:
1. **"Pre-Render Template" Button**: Triggers template pre-rendering
2. **Pre-render Status Indicator**: Shows if template is pre-rendered
3. **Preview Pre-rendered Image**: Display cached PNG
4. **Variable Zone Visualization**: Overlay bounding boxes on preview

**Implementation**:
```typescript
// Add to template editor UI
const handlePreRender = async () => {
  setPreRenderLoading(true);

  try {
    const response = await fetch('/api/templates/pre-render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId }),
    });

    const result = await response.json();

    if (result.success) {
      toast.success('Template pre-rendered successfully!');
      setPreRenderedImagePath(result.imagePath);
      setVariableZones(result.variableZones);
    }
  } catch (error) {
    toast.error('Pre-rendering failed');
  } finally {
    setPreRenderLoading(false);
  }
};
```

### Step 5: API Routes (NEW)

**File**: `app/api/templates/pre-render/route.ts`

```typescript
import { preRenderTemplate } from '@/lib/template-renderer/template-pre-renderer';

export async function POST(req: Request) {
  const { templateId } = await req.json();

  try {
    const result = await preRenderTemplate(templateId);

    return Response.json({
      success: true,
      imagePath: result.renderedImagePath,
      variableZones: result.variableZones,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
```

### Step 6: Worker Configuration

**File**: `lib/queue/batch-worker.ts` (MODIFIED)

**Add Sharp-based orchestrator selection**:
```typescript
import { processBatchJobWithSharp } from '../batch-processor/batch-orchestrator-sharp';
import { processBatchJobOptimized } from '../batch-processor/batch-orchestrator-optimized';

// Check if template is pre-rendered
const template = getDMTemplate(job.data.templateId);
const useSharp = template.isPreRendered === 1;

if (useSharp) {
  console.log('🚀 Using Sharp-based orchestrator (Phase 2)');
  await processBatchJobWithSharp(job.data);
} else {
  console.log('🚀 Using Puppeteer-cluster orchestrator (Phase 1)');
  await processBatchJobOptimized(job.data);
}
```

---

## 🚧 Breaking Changes & Migration Strategy

### Breaking Changes

1. **Template Pre-Rendering Requirement**
   - **Impact**: Templates must be pre-rendered before batch processing
   - **Mitigation**: Auto-trigger pre-rendering when template is saved
   - **Backward Compatibility**: Fall back to Phase 1 orchestrator if not pre-rendered

2. **Database Schema Changes**
   - **Impact**: Requires migration to add new columns
   - **Mitigation**: Non-destructive migration (ADD COLUMN, no data loss)
   - **Rollback**: Columns can be ignored by old code

3. **Variable Zone Extraction**
   - **Impact**: Relies on accurate Fabric.js object positions
   - **Risk**: If objects move during rendering, zones may be incorrect
   - **Mitigation**: Validate zone accuracy during pre-rendering

4. **Font Rendering**
   - **Impact**: Sharp uses system fonts, Fabric.js uses web fonts
   - **Risk**: Text may render differently (size, spacing, weight)
   - **Mitigation**:
     - Install system fonts matching web fonts (Inter, Open Sans)
     - Use `sharp-text` library for better font rendering
     - Fallback to image-based text (render text with Puppeteer, composite with Sharp)

5. **Complex Fabric.js Features**
   - **Impact**: Advanced features (rotations, gradients, filters) may not translate to Sharp
   - **Risk**: Composited DM may not match template preview
   - **Mitigation**:
     - Restrict template editor to Sharp-compatible features
     - Validate compatibility during pre-rendering
     - Show warnings for unsupported features

### Migration Strategy

#### Phase 2A: Parallel Deployment (Weeks 1-2)

**Goal**: Run Phase 1 and Phase 2 in parallel, test Phase 2 with subset of templates

1. Deploy Phase 2 code alongside Phase 1 (both orchestrators active)
2. Add feature flag: `USE_SHARP_ORCHESTRATOR` (default: false)
3. Select 5-10 test templates for Phase 2 validation
4. Pre-render test templates
5. Run batch jobs with both orchestrators, compare:
   - PDF quality (visual inspection)
   - Processing time (metrics)
   - Success rate (error logs)
6. Monitor metrics dashboard:
   - Throughput (DMs/minute)
   - Error rate
   - PDF file size

#### Phase 2B: Gradual Rollout (Weeks 3-4)

**Goal**: Increase Phase 2 adoption, handle edge cases

1. Pre-render 50% of templates (most-used templates first)
2. Enable Phase 2 for pre-rendered templates only
3. Monitor user feedback and error reports
4. Fix identified issues (font rendering, zone accuracy)
5. Pre-render remaining templates
6. Increase `USE_SHARP_ORCHESTRATOR` flag to 80%

#### Phase 2C: Full Migration (Week 5+)

**Goal**: Deprecate Phase 1, optimize Phase 2

1. Set `USE_SHARP_ORCHESTRATOR=true` globally
2. Keep Phase 1 orchestrator as fallback for legacy templates
3. Add automated pre-rendering on template save
4. Remove manual "Pre-Render" button (make it automatic)
5. Optimize Sharp concurrency based on server CPU
6. Archive Phase 1 orchestrator code (keep for emergency rollback)

---

## ⚠️ Risks & Mitigation

### Risk 1: Font Rendering Mismatch

**Risk**: Text rendered by Sharp may differ from Fabric.js preview

**Likelihood**: High
**Impact**: High (visual quality)

**Mitigation**:
1. **Option A**: Use Puppeteer to render text as PNG, composite with Sharp
   - Guarantees visual match
   - Slower (100-200ms penalty per text field)
2. **Option B**: Use `sharp-text` library with custom font loading
   - Install system fonts: `sudo apt-get install fonts-inter fonts-open-sans`
   - Configure Sharp font paths
   - Test rendering accuracy
3. **Option C**: Bake text into pre-rendered template
   - Only works for static text (not personalized)
   - Fastest but least flexible

**Recommended**: Option A for Phase 2A testing, Option B for production

### Risk 2: Variable Zone Extraction Accuracy

**Risk**: Bounding boxes may not match actual Fabric.js object positions

**Likelihood**: Medium
**Impact**: High (text cutoff or misalignment)

**Mitigation**:
1. Add validation step during pre-rendering:
   - Render template twice (Fabric.js + Sharp)
   - Compare pixel difference
   - Flag templates with >5% difference
2. Manual zone adjustment UI:
   - Allow users to drag/resize zones in editor
   - Store custom zones in database
3. Conservative padding:
   - Add 10% padding to all zones
   - Prevents text cutoff at cost of whitespace

### Risk 3: Sharp Performance on Windows/WSL

**Risk**: Sharp may be slower on WSL2 compared to native Linux

**Likelihood**: Medium
**Impact**: Medium (reduced throughput)

**Mitigation**:
1. Test Sharp performance on target deployment platform (Linux/Docker)
2. If WSL2 is slower, add warning in docs
3. Recommend cloud deployment (AWS EC2, Google Cloud Run)
4. Benchmark Sharp concurrency:
   - Test 4, 8, 16, 32 workers
   - Find optimal concurrency for server CPU

### Risk 4: Template Compatibility

**Risk**: Some templates may not work with Sharp (gradients, filters, etc.)

**Likelihood**: Low
**Impact**: Medium (requires fallback to Phase 1)

**Mitigation**:
1. Add template compatibility check:
   - Scan Fabric.js objects for unsupported features
   - Show warning in editor: "This template is not compatible with Phase 2"
2. Maintain Phase 1 orchestrator as fallback
3. Add `force_phase1` flag to template metadata
4. Document unsupported features in template guidelines

### Risk 5: Database Migration Failure

**Risk**: Column addition may fail on production database

**Likelihood**: Low
**Impact**: High (blocking deployment)

**Mitigation**:
1. Test migration on staging database first
2. Add rollback script:
   ```sql
   ALTER TABLE dm_templates DROP COLUMN rendered_image;
   ALTER TABLE dm_templates DROP COLUMN variable_zones;
   ```
3. Make migration idempotent (check if column exists)
4. Backup database before migration

---

## 📊 Success Metrics

### Performance Metrics

| Metric | Phase 1 Baseline | Phase 2 Target | Measurement |
|--------|------------------|----------------|-------------|
| Throughput | 40-80 DMs/min | 500-1000 DMs/min | Worker logs |
| Per-DM Time | 750-1500ms | 60-120ms | Batch orchestrator metrics |
| CPU Usage | 60-80% (4 cores) | 40-60% (8 cores) | `top` command |
| Memory Usage | 2-4 GB | 1-2 GB | Worker metrics |
| PDF Quality | Baseline | Match baseline | Visual inspection |
| Error Rate | <1% | <1% | Error logs |

### Business Metrics

- **Cost Savings**: Reduced server time (1/10th the processing time)
- **Scalability**: Handle 10x larger batches (1500+ DMs)
- **Customer Satisfaction**: Faster batch completion emails
- **Template Reusability**: Increase from 20% to 80%

---

## 🛠️ Development Timeline

### Week 1: Foundation
- [ ] Implement template pre-renderer (`template-pre-renderer.ts`)
- [ ] Add database schema migration
- [ ] Create Sharp compositor (`sharp-compositor.ts`)
- [ ] Write unit tests for variable zone extraction
- [ ] Test pre-rendering on 5 sample templates

### Week 2: Integration
- [ ] Implement Sharp-based orchestrator (`batch-orchestrator-sharp.ts`)
- [ ] Add pre-render API route
- [ ] Update template editor UI with pre-render button
- [ ] Integrate Sharp orchestrator into worker
- [ ] End-to-end testing with 10-DM batch

### Week 3: Testing & Optimization
- [ ] Performance benchmarking (100, 500, 1000 DMs)
- [ ] Font rendering validation
- [ ] PDF quality comparison (Phase 1 vs Phase 2)
- [ ] Error handling and retry logic
- [ ] Documentation updates

### Week 4: Deployment
- [ ] Deploy to staging environment
- [ ] Parallel deployment (Phase 1 + Phase 2)
- [ ] Monitor metrics dashboard
- [ ] Bug fixes and edge case handling
- [ ] Production deployment with 20% rollout

### Week 5+: Optimization
- [ ] Increase rollout to 100%
- [ ] Performance tuning (concurrency, caching)
- [ ] Automated pre-rendering on template save
- [ ] Deprecate Phase 1 orchestrator
- [ ] Documentation and training

---

## 📦 Dependencies

### New NPM Packages

```bash
npm install sharp           # Image processing (core)
npm install p-map           # Parallel async operations
npm install sharp-text      # Better text rendering (optional)
```

### System Dependencies (Linux/Docker)

```bash
# Install fonts for accurate text rendering
sudo apt-get update
sudo apt-get install -y \
  fonts-inter \
  fonts-open-sans \
  fonts-roboto \
  fonts-liberation
```

---

## 🔄 Rollback Plan

If Phase 2 fails in production:

1. **Immediate**: Set `USE_SHARP_ORCHESTRATOR=false` (reverts to Phase 1)
2. **Database**: No rollback needed (new columns are optional)
3. **Code**: Revert deployment to previous version
4. **Data**: Pre-rendered images can be deleted (will regenerate)

**Recovery Time**: <5 minutes (feature flag toggle)

---

## 📚 Documentation Requirements

### Developer Documentation
- [ ] Sharp compositor API reference
- [ ] Variable zone extraction guide
- [ ] Pre-rendering workflow diagram
- [ ] Troubleshooting guide

### User Documentation
- [ ] Template editor pre-render guide
- [ ] Supported template features
- [ ] Performance expectations
- [ ] Migration FAQ

---

## ✅ Acceptance Criteria

Before deploying Phase 2 to production:

1. ✅ Throughput: 500+ DMs/minute achieved in staging
2. ✅ PDF quality: Visual match with Phase 1 (>95% similarity)
3. ✅ Error rate: <1% failed DMs
4. ✅ Compatibility: 90%+ templates pre-render successfully
5. ✅ Font rendering: Text matches Fabric.js preview (<5px difference)
6. ✅ Load testing: 1000-DM batch completes without OOM errors
7. ✅ Rollback tested: Can revert to Phase 1 in <5 minutes
8. ✅ Monitoring: Dashboard tracks Phase 2 metrics
9. ✅ Documentation: All guides published
10. ✅ Training: Team understands Phase 2 workflow

---

## 🎓 Next Steps After Phase 2

### Phase 3: Cloud-Native Scaling (Future)

- Deploy to AWS Lambda / Google Cloud Run
- Auto-scale to 1000s of concurrent workers
- Process 10,000+ DMs/minute
- Global CDN for template caching

### Phase 4: AI-Powered Optimization (Future)

- ML-based variable zone detection
- Automatic layout optimization
- Predictive batch time estimation
- Intelligent concurrency tuning
