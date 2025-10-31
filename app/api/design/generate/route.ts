import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Canvas dimensions for 6x4 postcard at 300 DPI
const CANVAS_WIDTH = 1800; // 6 inches * 300 DPI
const CANVAS_HEIGHT = 1200; // 4 inches * 300 DPI

const SYSTEM_PROMPT = `You are an expert graphic designer creating professional Fabric.js canvas JSON for 6"x4" postcards at 300 DPI (${CANVAS_WIDTH}x${CANVAS_HEIGHT}px).

**CRITICAL REQUIREMENTS:**

1. **MULTI-LAYERED PROFESSIONAL DESIGNS** (10-20+ objects):
   - Background shapes for depth (full-width rectangles, geometric accents)
   - Decorative elements (circles, lines, patterns)
   - Multiple text layers (headline, subheading, body, CTA)
   - Visual hierarchy with varying sizes and colors
   - Overlapping elements for sophistication

2. **MODERN DESIGN PATTERNS** (inspired by Canva/professional templates):
   - **Geometric Accents**: Half-circles, diagonal rectangles, corner shapes
   - **Color Blocks**: Bold colored sections (not just flat backgrounds)
   - **Typography Hierarchy**: 3-4 text layers minimum
   - **Decorative Elements**: Dots, lines, shapes as visual interest
   - **Negative Space**: Strategic empty areas for breathing room

3. **COLOR SCHEMES** (use cohesive palettes):
   - Modern: #2563EB (blue), #F97316 (orange), #FFFFFF (white), #1E293B (dark)
   - Bold: #DC2626 (red), #FCD34D (yellow), #000000 (black), #F3F4F6 (light)
   - Elegant: #6366F1 (purple), #EC4899 (pink), #F9FAFB (white), #374151 (gray)
   - Fresh: #10B981 (green), #3B82F6 (blue), #FFFFFF (white), #111827 (dark)

4. **LAYOUT TEMPLATES**:

   **Hero Style**:
   - Large background shape (full canvas or 75%)
   - Bold headline (120-180px, top-center or center)
   - Subheading (50-70px)
   - Small CTA text (40-50px, bottom)
   - 2-3 decorative circles or shapes

   **Split Design**:
   - Colored rectangle covering left 50% (0-900px width)
   - White/light right side
   - Text on both sides
   - Decorative line separator
   - Accent shapes overlapping split

   **Corner Accent**:
   - Large colored circle in top-right corner (partial, radius 400-600px)
   - Smaller circle bottom-left
   - Text in center/left
   - Rectangular color block in bottom-right

5. **OBJECT SPECIFICATIONS**:

   **Rectangles** (backgrounds, blocks):
   \`\`\`json
   {
     "type": "rect",
     "left": 0,
     "top": 0,
     "width": 900,  // Half canvas or full (1800)
     "height": 1200,  // Full height or section
     "fill": "#2563EB",
     "stroke": "",
     "strokeWidth": 0,
     "rx": 0,  // Rounded corners (0-50)
     "ry": 0
   }
   \`\`\`

   **Circles** (accents, decorative):
   \`\`\`json
   {
     "type": "circle",
     "left": 1400,  // Position strategically
     "top": -200,   // Can be partially off-canvas
     "radius": 500,
     "fill": "#F97316",
     "stroke": "",
     "strokeWidth": 0,
     "opacity": 0.9
   }
   \`\`\`

   **Text** (headlines, body):
   \`\`\`json
   {
     "type": "i-text",
     "left": 900,  // Center: 900px
     "top": 400,
     "text": "YOUR HEADLINE HERE",
     "fontSize": 140,  // Headline: 100-180, Body: 40-70
     "fontFamily": "Arial",
     "fontWeight": 700,  // 400 (normal), 700 (bold), 900 (black)
     "fill": "#FFFFFF",
     "textAlign": "center",
     "originX": "center",  // CRITICAL for centered text
     "originY": "top"
   }
   \`\`\`

6. **REQUIRED JSON STRUCTURE**:
\`\`\`json
{
  "clearCanvas": true,
  "backgroundColor": "#F9FAFB",  // Subtle background
  "objects": [
    // Layer 1: Background shape (full or partial)
    { "type": "rect", ... },
    // Layer 2: Decorative elements (circles, shapes)
    { "type": "circle", ... },
    { "type": "circle", ... },
    // Layer 3: Secondary shapes (accents, blocks)
    { "type": "rect", ... },
    // Layer 4: Main headline (largest text)
    { "type": "i-text", "fontSize": 140-180, ... },
    // Layer 5: Subheading
    { "type": "i-text", "fontSize": 60-80, ... },
    // Layer 6: Body/description text
    { "type": "i-text", "fontSize": 45-60, ... },
    // Layer 7: CTA or footer text
    { "type": "i-text", "fontSize": 40-55, ... },
    // Layer 8-10: Additional decorative elements
    { "type": "rect", ... }
  ]
}
\`\`\`

7. **TEXT POSITIONING** (critical for alignment):
   - Centered: \`"left": 900, "originX": "center"\`
   - Left-aligned: \`"left": 150, "originX": "left"\`
   - Right-aligned: \`"left": 1650, "originX": "right"\`

8. **SPACING & MARGINS**:
   - Edge margins: 100-200px from canvas edges
   - Text line-height: 60-120px between lines
   - Element padding: 40-100px between objects

**EXAMPLE OUTPUT** (professional postcard):
\`\`\`json
{
  "clearCanvas": true,
  "backgroundColor": "#FFFFFF",
  "objects": [
    {
      "type": "rect",
      "left": 0,
      "top": 0,
      "width": 1100,
      "height": 1200,
      "fill": "#2563EB",
      "strokeWidth": 0
    },
    {
      "type": "circle",
      "left": 1500,
      "top": -150,
      "radius": 450,
      "fill": "#F97316",
      "opacity": 0.85
    },
    {
      "type": "circle",
      "left": 100,
      "top": 900,
      "radius": 200,
      "fill": "#FCD34D",
      "opacity": 0.8
    },
    {
      "type": "i-text",
      "left": 400,
      "top": 350,
      "text": "SUMMER",
      "fontSize": 160,
      "fontFamily": "Arial",
      "fontWeight": 900,
      "fill": "#FFFFFF",
      "originX": "left"
    },
    {
      "type": "i-text",
      "left": 400,
      "top": 540,
      "text": "SALE",
      "fontSize": 160,
      "fontFamily": "Arial",
      "fontWeight": 900,
      "fill": "#FCD34D",
      "originX": "left"
    },
    {
      "type": "i-text",
      "left": 400,
      "top": 750,
      "text": "Up to 50% off everything",
      "fontSize": 50,
      "fontFamily": "Arial",
      "fontWeight": 400,
      "fill": "#FFFFFF",
      "originX": "left"
    },
    {
      "type": "i-text",
      "left": 400,
      "top": 950,
      "text": "Shop Now",
      "fontSize": 55,
      "fontFamily": "Arial",
      "fontWeight": 700,
      "fill": "#1E293B",
      "originX": "left"
    },
    {
      "type": "rect",
      "left": 1200,
      "top": 950,
      "width": 400,
      "height": 150,
      "fill": "#FCD34D",
      "strokeWidth": 0,
      "rx": 10,
      "ry": 10
    }
  ]
}
\`\`\`

**OUTPUT ONLY VALID JSON. NO MARKDOWN. NO EXPLANATIONS.**`;

// Fallback templates for when AI fails
const FALLBACK_TEMPLATES = {
  'summer-sale': {
    clearCanvas: true,
    backgroundColor: '#FFFFFF',
    objects: [
      { type: 'rect', left: 0, top: 0, width: 1100, height: 1200, fill: '#2563EB', strokeWidth: 0 },
      { type: 'circle', left: 1500, top: -150, radius: 450, fill: '#F97316', opacity: 0.85 },
      { type: 'circle', left: 100, top: 900, radius: 200, fill: '#FCD34D', opacity: 0.8 },
      { type: 'i-text', left: 400, top: 350, text: 'SUMMER', fontSize: 160, fontFamily: 'Arial', fontWeight: 900, fill: '#FFFFFF', originX: 'left' },
      { type: 'i-text', left: 400, top: 540, text: 'SALE', fontSize: 160, fontFamily: 'Arial', fontWeight: 900, fill: '#FCD34D', originX: 'left' },
      { type: 'i-text', left: 400, top: 750, text: 'Up to 50% off everything', fontSize: 50, fontFamily: 'Arial', fontWeight: 400, fill: '#FFFFFF', originX: 'left' },
      { type: 'i-text', left: 400, top: 950, text: 'Shop Now →', fontSize: 55, fontFamily: 'Arial', fontWeight: 700, fill: '#1E293B', originX: 'left' },
      { type: 'rect', left: 1200, top: 950, width: 400, height: 150, fill: '#FCD34D', strokeWidth: 0, rx: 10, ry: 10 }
    ]
  },
  'business': {
    clearCanvas: true,
    backgroundColor: '#F9FAFB',
    objects: [
      { type: 'rect', left: 0, top: 0, width: 1800, height: 400, fill: '#1E293B', strokeWidth: 0 },
      { type: 'circle', left: 1600, top: -100, radius: 300, fill: '#6366F1', opacity: 0.6 },
      { type: 'i-text', left: 150, top: 150, text: 'PROFESSIONAL', fontSize: 120, fontFamily: 'Arial', fontWeight: 700, fill: '#FFFFFF', originX: 'left' },
      { type: 'i-text', left: 150, top: 500, text: 'Elevate Your Business', fontSize: 80, fontFamily: 'Georgia', fontWeight: 400, fill: '#1E293B', originX: 'left' },
      { type: 'i-text', left: 150, top: 650, text: 'Modern solutions for forward-thinking companies', fontSize: 50, fontFamily: 'Arial', fontWeight: 400, fill: '#64748B', originX: 'left' },
      { type: 'rect', left: 150, top: 900, width: 450, height: 90, fill: '#6366F1', strokeWidth: 0, rx: 8, ry: 8 },
      { type: 'i-text', left: 375, top: 945, text: 'Learn More', fontSize: 45, fontFamily: 'Arial', fontWeight: 700, fill: '#FFFFFF', originX: 'center', originY: 'center' }
    ]
  }
};

function getFallbackTemplate(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes('summer') || lower.includes('sale')) return FALLBACK_TEMPLATES['summer-sale'];
  return FALLBACK_TEMPLATES['business'];
}

export async function POST(request: Request) {
  const startTime = Date.now();
  console.log('🎨 [AI Design] Starting generation...');

  try {
    const { prompt } = await request.json();
    console.log('📝 [AI Design] User prompt:', prompt);

    if (!prompt) {
      console.error('❌ [AI Design] No prompt provided');
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('🤖 [AI Design] Calling OpenAI API...');

    // Call OpenAI to generate design
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create a PROFESSIONAL, MULTI-LAYERED postcard design: "${prompt}"

CRITICAL REQUIREMENTS:
- MINIMUM 8 objects (MUST include at least 2 shapes + 3 text layers)
- Background MUST be colored (NOT white) - use vibrant colors
- Text MUST have contrasting colors (white text on dark bg, dark text on light bg)
- Include decorative shapes (circles, rectangles)
- EXAMPLE COLOR COMBOS: blue bg + white text, dark bg + yellow text, light bg + dark text

STRICT OUTPUT FORMAT - FOLLOW THIS EXACTLY:
{
  "clearCanvas": true,
  "backgroundColor": "#FFFFFF",
  "objects": [
    {
      "type": "rect",
      "left": 0,
      "top": 0,
      "width": 1100,
      "height": 1200,
      "fill": "#2563EB",
      "strokeWidth": 0
    },
    {
      "type": "i-text",
      "left": 400,
      "top": 400,
      "text": "HEADLINE HERE",
      "fontSize": 140,
      "fontFamily": "Arial",
      "fontWeight": 900,
      "fill": "#FFFFFF",
      "originX": "left"
    }
  ]
}

OUTPUT ONLY JSON. NO MARKDOWN. NO EXPLANATIONS.`
        },
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    console.log('✅ [AI Design] OpenAI response received');
    console.log('📊 [AI Design] Usage:', completion.usage);

    const designJSON = completion.choices[0].message.content;

    if (!designJSON) {
      console.error('❌ [AI Design] No content in OpenAI response');
      throw new Error('No design generated');
    }

    console.log('📄 [AI Design] Raw JSON length:', designJSON.length);
    console.log('🔍 [AI Design] First 200 chars:', designJSON.substring(0, 200));

    // Parse and validate the JSON
    const design = JSON.parse(designJSON);
    console.log('✅ [AI Design] JSON parsed successfully');
    console.log('📦 [AI Design] Objects count:', design.objects?.length || 0);

    // Validate required fields
    if (!design.objects || !Array.isArray(design.objects)) {
      console.error('❌ [AI Design] Invalid structure - missing objects array');
      console.log('🔄 [AI Design] Using fallback template');
      const fallback = getFallbackTemplate(prompt);
      return NextResponse.json({ design: fallback, usedFallback: true });
    }

    if (design.objects.length < 3) {
      console.warn('⚠️ [AI Design] Too few objects:', design.objects.length);
      console.log('🔄 [AI Design] Using fallback template');
      const fallback = getFallbackTemplate(prompt);
      return NextResponse.json({ design: fallback, usedFallback: true });
    }

    // Log each object type
    design.objects.forEach((obj: any, i: number) => {
      console.log(`  Object ${i + 1}:`, obj.type, obj.fill || obj.stroke || 'no-color');
    });

    // Validate color contrast
    const textObjects = design.objects.filter((obj: any) => obj.type === 'i-text');
    const bgColor = design.backgroundColor || '#FFFFFF';

    textObjects.forEach((text: any, i: number) => {
      if (text.fill === bgColor || text.fill === '#FFFFFF' && bgColor === '#FFFFFF') {
        console.warn(`⚠️ [AI Design] Text ${i + 1} has same color as background!`);
        text.fill = '#1E293B'; // Fix to dark color
      }
    });

    const duration = Date.now() - startTime;
    console.log(`✨ [AI Design] Generation complete in ${duration}ms`);

    return NextResponse.json({ design, usedFallback: false });
  } catch (error) {
    console.error('❌ [AI Design] ERROR:', error);
    console.error('📋 [AI Design] Error details:', error instanceof Error ? error.stack : error);

    // Return fallback on error
    console.log('🔄 [AI Design] Returning fallback template due to error');
    const fallback = FALLBACK_TEMPLATES['business'];

    return NextResponse.json({
      design: fallback,
      usedFallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
