# Fabric.js Canvas Design Generation - Best Practices & Technical Guide

**Version**: 1.0
**Date**: 2025-10-31
**Purpose**: Complete technical specification for generating professional Fabric.js canvas designs with images, SVG, emoji, and AI integration

---

## Table of Contents

1. [Canvas Specifications](#1-canvas-specifications)
2. [Object Types & JSON Structure](#2-object-types--json-structure)
3. [Images & External Assets](#3-images--external-assets)
4. [SVG Paths & Complex Shapes](#4-svg-paths--complex-shapes)
5. [Emoji & Unicode Support](#5-emoji--unicode-support)
6. [Grouping & Organization](#6-grouping--organization)
7. [Advanced Styling & Effects](#7-advanced-styling--effects)
8. [Pagination & Multi-Page Designs](#8-pagination--multi-page-designs)
9. [AI Image Generation Integration (NanoBanana)](#9-ai-image-generation-integration)
10. [Performance Optimization](#10-performance-optimization)

---

## 1. Canvas Specifications

### Standard Postcard Format
- **Physical Size**: 6" × 4" (landscape)
- **Resolution**: 300 DPI (print quality)
- **Canvas Dimensions**: 1800px × 1200px
- **Display Scale**: Dynamic (0.1x - 3x zoom)
- **Safe Margins**: 100-200px from edges (bleed zone)

### Canvas JSON Root Structure
```json
{
  "version": "6.7.1",
  "clearCanvas": true,
  "backgroundColor": "#FFFFFF",
  "objects": [...]
}
```

---

## 2. Object Types & JSON Structure

### 2.1 Text Objects (i-text)

**Basic Text:**
```json
{
  "type": "i-text",
  "left": 900,
  "top": 400,
  "text": "Hello World",
  "fontSize": 140,
  "fontFamily": "Arial",
  "fontWeight": 700,
  "fill": "#2563EB",
  "textAlign": "center",
  "originX": "center",
  "originY": "top"
}
```

**Advanced Text with Effects:**
```json
{
  "type": "i-text",
  "left": 900,
  "top": 500,
  "text": "Premium Design",
  "fontSize": 160,
  "fontFamily": "Georgia",
  "fontWeight": 900,
  "fill": "#FFFFFF",
  "stroke": "#2563EB",
  "strokeWidth": 2,
  "shadow": {
    "color": "rgba(0,0,0,0.3)",
    "blur": 10,
    "offsetX": 5,
    "offsetY": 5
  },
  "textAlign": "left",
  "originX": "center",
  "lineHeight": 1.2,
  "charSpacing": 100,
  "fontStyle": "italic",
  "underline": false,
  "linethrough": false
}
```

**Multi-line Text:**
```json
{
  "type": "i-text",
  "text": "Line 1\nLine 2\nLine 3",
  "fontSize": 60,
  "lineHeight": 1.5
}
```

**Font Options:**
- `"Arial"` - Clean, modern
- `"Helvetica"` - Professional
- `"Georgia"` - Elegant serif
- `"Times New Roman"` - Traditional
- `"Courier"` - Monospace

**Font Weights:**
- `400` - Normal
- `600` - Semi-bold
- `700` - Bold
- `900` - Black

**Text Alignment (originX/originY):**
- Center: `"originX": "center", "left": 900`
- Left: `"originX": "left", "left": 150`
- Right: `"originX": "right", "left": 1650`

### 2.2 Rectangles

**Basic Rectangle:**
```json
{
  "type": "rect",
  "left": 0,
  "top": 0,
  "width": 1100,
  "height": 1200,
  "fill": "#2563EB",
  "stroke": "",
  "strokeWidth": 0,
  "rx": 0,
  "ry": 0
}
```

**Rounded Rectangle:**
```json
{
  "type": "rect",
  "left": 100,
  "top": 100,
  "width": 600,
  "height": 400,
  "fill": "#F97316",
  "rx": 30,
  "ry": 30,
  "opacity": 0.9
}
```

**Rectangle with Gradient (advanced):**
```json
{
  "type": "rect",
  "left": 0,
  "top": 0,
  "width": 1800,
  "height": 600,
  "fill": {
    "type": "linear",
    "x1": 0,
    "y1": 0,
    "x2": 0,
    "y2": 600,
    "colorStops": [
      { "offset": 0, "color": "#2563EB" },
      { "offset": 1, "color": "#1E40AF" }
    ]
  }
}
```

### 2.3 Circles

**Basic Circle:**
```json
{
  "type": "circle",
  "left": 1500,
  "top": -150,
  "radius": 450,
  "fill": "#F97316",
  "stroke": "",
  "strokeWidth": 0,
  "opacity": 0.85
}
```

**Partial Off-Canvas Circle (decorative accent):**
```json
{
  "type": "circle",
  "left": 1700,
  "top": -300,
  "radius": 600,
  "fill": "#FCD34D",
  "opacity": 0.7
}
```

**Stroked Circle (outline only):**
```json
{
  "type": "circle",
  "left": 300,
  "top": 300,
  "radius": 150,
  "fill": "transparent",
  "stroke": "#2563EB",
  "strokeWidth": 8
}
```

---

## 3. Images & External Assets

### 3.1 Loading Images from URLs

**Basic Image Object:**
```json
{
  "type": "image",
  "left": 900,
  "top": 600,
  "scaleX": 0.5,
  "scaleY": 0.5,
  "src": "https://images.unsplash.com/photo-example.jpg",
  "crossOrigin": "anonymous"
}
```

**Image with Dimensions and Position:**
```json
{
  "type": "image",
  "left": 1200,
  "top": 400,
  "width": 600,
  "height": 400,
  "scaleX": 1,
  "scaleY": 1,
  "src": "https://example.com/product.png",
  "crossOrigin": "anonymous",
  "originX": "center",
  "originY": "center"
}
```

**Image with Clipping (circle mask):**
```json
{
  "type": "image",
  "src": "https://example.com/photo.jpg",
  "left": 500,
  "top": 500,
  "scaleX": 0.8,
  "scaleY": 0.8,
  "clipPath": {
    "type": "circle",
    "radius": 200,
    "left": 0,
    "top": 0,
    "originX": "center",
    "originY": "center"
  }
}
```

### 3.2 Recommended Image Sources

**Free Stock Photos:**
- Unsplash: `https://images.unsplash.com/photo-{id}`
- Pexels: `https://images.pexels.com/photos/{id}`
- Pixabay: `https://pixabay.com/get/{id}`

**Icon Libraries (SVG):**
- Lucide Icons: `https://unpkg.com/lucide-static@latest/icons/{name}.svg`
- Font Awesome: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/...`

### 3.3 Image Loading Best Practices

1. **Always set `crossOrigin: "anonymous"`** for external images
2. **Use HTTPS URLs** (not HTTP)
3. **Provide fallback dimensions** if image fails to load
4. **Scale images appropriately** (scaleX/scaleY) to avoid distortion
5. **Position with originX/originY** for centering

**Loading Process:**
```typescript
// In Fabric.js v6 (async/await pattern):
const img = await FabricImage.fromURL('https://example.com/image.jpg');
img.set({
  left: 900,
  top: 600,
  scaleX: 0.5,
  scaleY: 0.5
});
canvas.add(img);
```

---

## 4. SVG Paths & Complex Shapes

### 4.1 SVG Path Objects

**Star Shape (path data):**
```json
{
  "type": "path",
  "left": 400,
  "top": 200,
  "path": [
    ["M", 50, 0],
    ["L", 61, 38],
    ["L", 98, 38],
    ["L", 68, 59],
    ["L", 79, 97],
    ["L", 50, 75],
    ["L", 21, 97],
    ["L", 32, 59],
    ["L", 2, 38],
    ["L", 39, 38],
    ["z"]
  ],
  "fill": "#FCD34D",
  "stroke": null,
  "scaleX": 2,
  "scaleY": 2
}
```

**Heart Shape:**
```json
{
  "type": "path",
  "path": "M 50 80 C 20 50, 10 30, 20 20 C 30 10, 40 15, 50 30 C 60 15, 70 10, 80 20 C 90 30, 80 50, 50 80 z",
  "left": 300,
  "top": 300,
  "fill": "#DC2626",
  "scaleX": 3,
  "scaleY": 3
}
```

**Custom Polygon (triangle):**
```json
{
  "type": "polygon",
  "points": [
    { "x": 0, "y": 0 },
    { "x": 100, "y": 0 },
    { "x": 50, "y": 100 }
  ],
  "left": 500,
  "top": 500,
  "fill": "#6366F1",
  "stroke": "#FFFFFF",
  "strokeWidth": 4
}
```

### 4.2 Converting SVG to Path Data

**Tools:**
- [SVG Path Editor](https://yqnn.github.io/svg-path-editor/) - Visualize and edit paths
- [SVG to Fabric.js Converter](http://fabricjs.com/fabric-intro-part-3) - Official docs

**Manual Conversion:**
```xml
<!-- Original SVG -->
<svg><path d="M 10 10 L 90 90" /></svg>

<!-- Fabric.js Path Array -->
path: [["M", 10, 10], ["L", 90, 90]]
```

### 4.3 Common Shape Path Data

**Arrow Right:**
```json
{
  "type": "path",
  "path": "M 0 20 L 60 20 L 60 0 L 100 30 L 60 60 L 60 40 L 0 40 z",
  "fill": "#2563EB"
}
```

**Chevron:**
```json
{
  "type": "path",
  "path": "M 10 0 L 30 20 L 10 40",
  "fill": "transparent",
  "stroke": "#374151",
  "strokeWidth": 4
}
```

---

## 5. Emoji & Unicode Support

### 5.1 Emoji in Text Objects

**Basic Emoji Support:**
```json
{
  "type": "i-text",
  "left": 900,
  "top": 400,
  "text": "Hello 👋 World 🌍",
  "fontSize": 80,
  "fontFamily": "Arial",
  "fill": "#1E293B"
}
```

**Emoji-Only Text (large):**
```json
{
  "type": "i-text",
  "text": "🎉",
  "fontSize": 200,
  "left": 900,
  "top": 600,
  "originX": "center"
}
```

### 5.2 Common Emoji Categories

**Reactions & Gestures:**
- `👋` (wave), `👍` (thumbs up), `❤️` (heart), `🎉` (party), `✨` (sparkles)

**Business & Office:**
- `📧` (email), `📞` (phone), `🏢` (building), `💼` (briefcase), `📊` (chart)

**Actions & Arrows:**
- `✅` (check), `❌` (cross), `➡️` (arrow right), `⬇️` (arrow down), `🔔` (bell)

**Nature & Travel:**
- `🌍` (earth), `🌟` (star), `🌈` (rainbow), `🏖️` (beach), `✈️` (plane)

### 5.3 Emoticons (Text-based)

```json
{
  "type": "i-text",
  "text": ":) :( :D ^_^ <3",
  "fontSize": 60,
  "fontFamily": "Courier"
}
```

### 5.4 Best Practices

1. **Font Support**: Not all fonts render emoji. Use system fonts (Arial, Sans-Serif)
2. **Size Limits**: Large emoji (200px+) may not render on all systems
3. **Positioning**: Emoji can affect line height - adjust `lineHeight`
4. **Color**: Emoji are colored by default, cannot change with `fill` property

---

## 6. Grouping & Organization

### 6.1 Group Objects

**Creating Groups:**
```json
{
  "type": "group",
  "left": 500,
  "top": 300,
  "angle": 0,
  "objects": [
    {
      "type": "rect",
      "left": 0,
      "top": 0,
      "width": 200,
      "height": 100,
      "fill": "#2563EB"
    },
    {
      "type": "i-text",
      "left": 100,
      "top": 50,
      "text": "Label",
      "fontSize": 40,
      "fill": "#FFFFFF",
      "originX": "center",
      "originY": "center"
    }
  ]
}
```

**Button Group (icon + text):**
```json
{
  "type": "group",
  "left": 1400,
  "top": 1000,
  "objects": [
    {
      "type": "rect",
      "width": 300,
      "height": 80,
      "fill": "#2563EB",
      "rx": 10,
      "ry": 10
    },
    {
      "type": "i-text",
      "left": 150,
      "top": 40,
      "text": "Click Here",
      "fontSize": 35,
      "fill": "#FFFFFF",
      "originX": "center",
      "originY": "center"
    }
  ]
}
```

### 6.2 Naming & Organization

**Object Naming (for layer management):**
```json
{
  "type": "rect",
  "name": "background-primary",
  "fill": "#2563EB"
}
```

**Layering Strategy:**
1. **Layer 1**: Background shapes (full-width rectangles)
2. **Layer 2**: Decorative elements (circles, accents)
3. **Layer 3**: Content shapes (rectangles for sections)
4. **Layer 4**: Images
5. **Layer 5**: Text (headline)
6. **Layer 6**: Text (subheading)
7. **Layer 7**: Text (body)
8. **Layer 8**: Call-to-action elements
9. **Layer 9**: Overlays/effects

---

## 7. Advanced Styling & Effects

### 7.1 Shadows

**Drop Shadow:**
```json
{
  "type": "rect",
  "width": 400,
  "height": 200,
  "fill": "#FFFFFF",
  "shadow": {
    "color": "rgba(0,0,0,0.2)",
    "blur": 20,
    "offsetX": 10,
    "offsetY": 10
  }
}
```

**Text Shadow:**
```json
{
  "type": "i-text",
  "text": "3D Effect",
  "fontSize": 120,
  "fill": "#FFFFFF",
  "shadow": {
    "color": "#2563EB",
    "blur": 0,
    "offsetX": 4,
    "offsetY": 4
  }
}
```

### 7.2 Gradients

**Linear Gradient:**
```json
{
  "type": "rect",
  "width": 1800,
  "height": 1200,
  "fill": {
    "type": "linear",
    "x1": 0,
    "y1": 0,
    "x2": 1800,
    "y2": 0,
    "colorStops": [
      { "offset": 0, "color": "#2563EB" },
      { "offset": 0.5, "color": "#6366F1" },
      { "offset": 1, "color": "#EC4899" }
    ]
  }
}
```

**Radial Gradient:**
```json
{
  "type": "circle",
  "radius": 600,
  "fill": {
    "type": "radial",
    "x1": 600,
    "y1": 600,
    "x2": 600,
    "y2": 600,
    "r1": 0,
    "r2": 600,
    "colorStops": [
      { "offset": 0, "color": "#FCD34D" },
      { "offset": 1, "color": "#F97316" }
    ]
  }
}
```

### 7.3 Opacity & Blending

**Transparency:**
```json
{
  "type": "rect",
  "fill": "#2563EB",
  "opacity": 0.7
}
```

**Layered Opacity (multiple overlapping shapes):**
```json
[
  { "type": "rect", "fill": "#2563EB", "opacity": 0.3 },
  { "type": "rect", "fill": "#F97316", "opacity": 0.3, "left": 100 },
  { "type": "rect", "fill": "#10B981", "opacity": 0.3", "left": 200 }
]
```

---

## 8. Pagination & Multi-Page Designs

### 8.1 Multi-Page Structure

Fabric.js doesn't have native pagination. For multi-page designs (e.g., front/back of postcard):

**Option 1: Multiple Canvas JSONs**
```json
{
  "pages": [
    {
      "name": "Front",
      "canvasJSON": {
        "backgroundColor": "#FFFFFF",
        "objects": [...]
      }
    },
    {
      "name": "Back",
      "canvasJSON": {
        "backgroundColor": "#F9FAFB",
        "objects": [...]
      }
    }
  ]
}
```

**Option 2: Large Canvas with Sections**
```json
{
  "canvasWidth": 3600,
  "canvasHeight": 1200,
  "pages": [
    { "name": "Front", "x": 0, "y": 0, "width": 1800, "height": 1200 },
    { "name": "Back", "x": 1800, "y": 0, "width": 1800, "height": 1200 }
  ],
  "objects": [
    { "type": "rect", "left": 0, "top": 0, "width": 1800, "height": 1200 },
    { "type": "rect", "left": 1800, "top": 0, "width": 1800, "height": 1200 }
  ]
}
```

### 8.2 Artboards (Figma-style)

**Artboard Metadata:**
```json
{
  "artboards": [
    {
      "id": "artboard-1",
      "name": "6x4 Postcard",
      "width": 1800,
      "height": 1200,
      "x": 0,
      "y": 0,
      "objects": [...]
    },
    {
      "id": "artboard-2",
      "name": "4x6 Postcard (Portrait)",
      "width": 1200,
      "height": 1800,
      "x": 2000,
      "y": 0,
      "objects": [...]
    }
  ]
}
```

---

## 9. AI Image Generation Integration

### 9.1 NanoBanana Integration (Hypothetical API)

**Flow:**
1. User prompts AI: "Create postcard with mountain landscape photo"
2. AI detects image requirement from prompt
3. AI calls NanoBanana API to generate image
4. AI receives image URL
5. AI injects image into Fabric.js JSON

**Example Prompt Detection:**
```typescript
const imageKeywords = [
  'photo', 'image', 'picture', 'photography',
  'landscape', 'portrait', 'background', 'illustration'
];

function requiresImageGeneration(prompt: string): boolean {
  return imageKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
}
```

**NanoBanana API Call (hypothetical):**
```typescript
interface NanoBananaRequest {
  prompt: string;
  width: number;
  height: number;
  style?: 'realistic' | 'illustration' | 'abstract';
}

async function generateImage(req: NanoBananaRequest): Promise<string> {
  const response = await fetch('https://api.nanobanana.ai/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NANOBANANA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(req)
  });

  const data = await response.json();
  return data.imageUrl; // https://cdn.nanobanana.ai/images/abc123.jpg
}
```

### 9.2 AI Design Generation with Images

**Enhanced System Prompt:**
```typescript
const SYSTEM_PROMPT_WITH_IMAGES = `
You can generate images for designs by:

1. **Detecting image needs** from user prompts
2. **Calling image generation** (placeholder: use Unsplash for now)
3. **Injecting image objects** into Fabric.js JSON

**Example:**
User: "Create summer sale postcard with beach photo"

Response JSON:
{
  "objects": [
    {
      "type": "image",
      "src": "https://images.unsplash.com/photo-beach-sunset",
      "left": 0,
      "top": 0,
      "scaleX": 1.5,
      "scaleY": 1.5
    },
    {
      "type": "i-text",
      "text": "SUMMER SALE",
      "fontSize": 140,
      "fill": "#FFFFFF"
    }
  ]
}

**When to generate images:**
- User mentions: "photo of...", "image of...", "background with..."
- Scene descriptions: "mountain landscape", "city skyline", "ocean sunset"
- Product visuals: "product photo", "mockup", "packaging"

**Image placement strategies:**
- Full background: left: 0, top: 0, scaleX/scaleY to fill canvas
- Partial background: Positioned section (left 900, top 0, width 900)
- Centered element: originX/originY center, left: 900, top: 600
`;
```

### 9.3 Integration Architecture

**Proposed Flow:**
```typescript
// 1. AI Generation Route
export async function POST(request: Request) {
  const { prompt } = await request.json();

  // Check if image generation needed
  const needsImage = detectImageRequirement(prompt);

  let imageUrl = null;
  if (needsImage) {
    const imagePrompt = extractImagePrompt(prompt);
    imageUrl = await generateImageWithNanoBanana(imagePrompt);
  }

  // Generate design with image URL
  const designJSON = await generateDesignWithOpenAI(prompt, imageUrl);

  return Response.json({ design: designJSON });
}

// 2. OpenAI Prompt with Image URL
function buildPromptWithImage(userPrompt: string, imageUrl: string | null) {
  if (imageUrl) {
    return `
User Request: ${userPrompt}

IMPORTANT: Use this generated image in your design:
Image URL: ${imageUrl}

Place it as a background or featured element with proper positioning.
    `;
  }
  return userPrompt;
}
```

---

## 10. Performance Optimization

### 10.1 Best Practices

**1. Limit Object Count:**
- Keep designs under 30 objects for smooth performance
- Group related objects to reduce complexity

**2. Image Optimization:**
- Use compressed images (JPEG quality 80-85%)
- Serve images via CDN
- Resize images before loading (don't scale huge images with scaleX/scaleY)

**3. Caching:**
- Cache loaded images in browser
- Store template JSONs in localStorage/IndexedDB

**4. Lazy Loading:**
- Load images asynchronously
- Show placeholders while loading

**5. Rendering:**
- Use `canvas.renderOnAddRemove = false` during batch operations
- Call `canvas.renderAll()` once after all changes

### 10.2 Code Examples

**Batch Operations:**
```typescript
canvas.renderOnAddRemove = false;

// Add multiple objects
objects.forEach(obj => canvas.add(obj));

// Render once
canvas.renderOnAddRemove = true;
canvas.renderAll();
```

**Image Preloading:**
```typescript
async function preloadImages(imageUrls: string[]) {
  const promises = imageUrls.map(url =>
    FabricImage.fromURL(url)
  );
  return await Promise.all(promises);
}
```

---

## 11. Complete Example: Professional Postcard

```json
{
  "version": "6.7.1",
  "clearCanvas": true,
  "backgroundColor": "#FFFFFF",
  "objects": [
    {
      "type": "rect",
      "name": "background-primary",
      "left": 0,
      "top": 0,
      "width": 1100,
      "height": 1200,
      "fill": {
        "type": "linear",
        "x1": 0,
        "y1": 0,
        "x2": 0,
        "y2": 1200,
        "colorStops": [
          { "offset": 0, "color": "#2563EB" },
          { "offset": 1, "color": "#1E40AF" }
        ]
      },
      "strokeWidth": 0
    },
    {
      "type": "image",
      "name": "hero-image",
      "src": "https://images.unsplash.com/photo-mountain-landscape",
      "left": 1100,
      "top": 0,
      "width": 700,
      "height": 1200,
      "scaleX": 1,
      "scaleY": 1,
      "crossOrigin": "anonymous"
    },
    {
      "type": "circle",
      "name": "accent-circle-1",
      "left": 1600,
      "top": -200,
      "radius": 500,
      "fill": "#F97316",
      "opacity": 0.8
    },
    {
      "type": "circle",
      "name": "accent-circle-2",
      "left": 100,
      "top": 900,
      "radius": 250,
      "fill": "#FCD34D",
      "opacity": 0.7
    },
    {
      "type": "i-text",
      "name": "headline-1",
      "left": 450,
      "top": 350,
      "text": "ADVENTURE",
      "fontSize": 160,
      "fontFamily": "Arial",
      "fontWeight": 900,
      "fill": "#FFFFFF",
      "shadow": {
        "color": "rgba(0,0,0,0.3)",
        "blur": 10,
        "offsetX": 3,
        "offsetY": 3
      },
      "originX": "left"
    },
    {
      "type": "i-text",
      "name": "headline-2",
      "left": 450,
      "top": 530,
      "text": "AWAITS 🏔️",
      "fontSize": 160,
      "fontFamily": "Arial",
      "fontWeight": 900,
      "fill": "#FCD34D",
      "originX": "left"
    },
    {
      "type": "i-text",
      "name": "subheading",
      "left": 450,
      "top": 740,
      "text": "Join us for the trip of a lifetime",
      "fontSize": 50,
      "fontFamily": "Arial",
      "fontWeight": 400,
      "fill": "#FFFFFF",
      "originX": "left"
    },
    {
      "type": "group",
      "name": "cta-button",
      "left": 450,
      "top": 950,
      "objects": [
        {
          "type": "rect",
          "width": 350,
          "height": 90,
          "fill": "#FCD34D",
          "rx": 12,
          "ry": 12
        },
        {
          "type": "i-text",
          "left": 175,
          "top": 45,
          "text": "Book Now ➡️",
          "fontSize": 45,
          "fontFamily": "Arial",
          "fontWeight": 700,
          "fill": "#1E293B",
          "originX": "center",
          "originY": "center"
        }
      ]
    },
    {
      "type": "path",
      "name": "decorative-star",
      "path": [
        ["M", 50, 0],
        ["L", 61, 38],
        ["L", 98, 38],
        ["L", 68, 59],
        ["L", 79, 97],
        ["L", 50, 75],
        ["L", 21, 97],
        ["L", 32, 59],
        ["L", 2, 38],
        ["L", 39, 38],
        ["z"]
      ],
      "left": 250,
      "top": 150,
      "fill": "#FCD34D",
      "scaleX": 2,
      "scaleY": 2,
      "opacity": 0.9
    }
  ]
}
```

---

## Summary

This guide provides comprehensive specifications for generating professional Fabric.js designs with:

✅ **Text**: Multi-line, styled, with emoji support
✅ **Shapes**: Rectangles, circles, paths (SVG)
✅ **Images**: External URLs, cropping, scaling
✅ **Effects**: Shadows, gradients, opacity
✅ **Organization**: Groups, layers, naming
✅ **Advanced**: Multi-page designs, AI integration

**Next Steps:**
1. Implement NanoBanana integration in AI generation route
2. Add emoji picker to text editing
3. Create SVG shape library for common icons
4. Optimize image loading with CDN caching

**Version History:**
- v1.0 (2025-10-31): Initial comprehensive guide

---

**Maintained by**: DropLab Platform Team
**References**: [Fabric.js Docs](http://fabricjs.com/docs), [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
