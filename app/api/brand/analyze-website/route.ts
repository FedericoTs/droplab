import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

/**
 * POST /api/brand/analyze-website
 * Analyze a website and extract brand DNA using AI
 */
export async function POST(request: NextRequest) {
  try {
    const { websiteUrl } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json(
        { success: false, error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let url: URL;
    try {
      url = new URL(websiteUrl);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log(`🔍 Analyzing website: ${websiteUrl}`);

    // Step 1: Fetch website HTML
    const htmlResponse = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!htmlResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch website' },
        { status: 500 }
      );
    }

    const htmlContent = await htmlResponse.text();

    // Step 2: Take screenshot using screenshot API
    const screenshotUrl = await captureWebsiteScreenshot(websiteUrl);

    // Step 3: Extract company name from HTML title/meta
    const companyName = extractCompanyName(htmlContent, url.hostname);

    // Step 4: Analyze with GPT-4o Vision
    const openai = new OpenAI({ apiKey });

    const analysisPrompt = `Analyze this website screenshot and extract the brand identity:

1. **Logo**: Describe the logo location and appearance
2. **Primary Color**: Main brand color (hex code)
3. **Secondary Color**: Supporting color (hex code)
4. **Accent Color**: Call-to-action/highlight color (hex code)
5. **Heading Font**: Font family for headings
6. **Body Font**: Font family for body text
7. **Brand Voice**: Tone and personality (warm, professional, playful, etc.)
8. **Industry**: Business category
9. **Recommended Template**: One of: professional, healthcare, retail, modern, classic

Return ONLY a JSON object with these exact keys:
{
  "logoDescription": "description",
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "accentColor": "#hex",
  "headingFont": "font name",
  "bodyFont": "font name",
  "brandVoice": "description",
  "industry": "category",
  "recommendedTemplate": "template name"
}`;

    console.log('🤖 Calling GPT-4o Vision for analysis...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: screenshotUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const analysisText = response.choices[0].message.content || '{}';
    console.log('📊 AI Analysis Result:', analysisText);

    // Parse JSON response
    let brandData;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      brandData = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI analysis' },
        { status: 500 }
      );
    }

    // Step 5: Extract logo URL from HTML
    const logoUrl = await extractLogoUrl(htmlContent, url.origin);

    // Return extracted brand data
    return NextResponse.json({
      success: true,
      data: {
        companyName,
        logoUrl,
        logoDescription: brandData.logoDescription,
        primaryColor: brandData.primaryColor || '#1E3A8A',
        secondaryColor: brandData.secondaryColor || '#FF6B35',
        accentColor: brandData.accentColor || '#10B981',
        headingFont: brandData.headingFont || 'Inter',
        bodyFont: brandData.bodyFont || 'Open Sans',
        brandVoice: brandData.brandVoice || '',
        industry: brandData.industry || '',
        landingPageTemplate: brandData.recommendedTemplate || 'professional',
        websiteUrl,
        screenshotUrl,
      },
      message: 'Website analyzed successfully',
    });

  } catch (error) {
    console.error('Error analyzing website:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze website'
      },
      { status: 500 }
    );
  }
}

/**
 * Capture website screenshot using screenshot API
 */
async function captureWebsiteScreenshot(url: string): Promise<string> {
  // Using screenshot.one API (free tier: 100 screenshots/month)
  // Alternative: screenshotapi.net, apiflash.com
  const apiKey = process.env.SCREENSHOT_API_KEY || 'demo';

  // For demo/development, use a simple service
  const screenshotUrl = `https://api.screenshotone.com/take?access_key=${apiKey}&url=${encodeURIComponent(url)}&viewport_width=1920&viewport_height=1080&device_scale_factor=1&format=png&block_ads=true&block_cookie_banners=true&block_banners_by_heuristics=false&block_trackers=true&delay=3&timeout=60`;

  console.log('📸 Screenshot URL:', screenshotUrl);

  return screenshotUrl;
}

/**
 * Extract company name from HTML
 */
function extractCompanyName(html: string, hostname: string): string {
  // Try to extract from <title>
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) {
    let title = titleMatch[1].trim();
    // Clean up common patterns
    title = title.replace(/\s*[-|]\s*(Home|Welcome|Official Site|Website).*$/i, '');
    if (title && title.length > 0 && title.length < 100) {
      return title;
    }
  }

  // Try meta property="og:site_name"
  const ogSiteMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);
  if (ogSiteMatch) {
    return ogSiteMatch[1].trim();
  }

  // Try meta name="application-name"
  const appNameMatch = html.match(/<meta\s+name=["']application-name["']\s+content=["']([^"']+)["']/i);
  if (appNameMatch) {
    return appNameMatch[1].trim();
  }

  // Fallback to hostname
  const name = hostname.replace(/^www\./, '').split('.')[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Extract logo URL from HTML
 */
async function extractLogoUrl(html: string, origin: string): Promise<string> {
  // Common logo selectors
  const logoPatterns = [
    /<link\s+rel=["']icon["']\s+href=["']([^"']+)["']/i,
    /<link\s+rel=["']apple-touch-icon["']\s+href=["']([^"']+)["']/i,
    /<img[^>]+class=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']*logo[^"']+)["']/i,
    /<img[^>]+alt=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
  ];

  for (const pattern of logoPatterns) {
    const match = html.match(pattern);
    if (match) {
      let logoUrl = match[1];
      // Make absolute URL
      if (logoUrl.startsWith('//')) {
        logoUrl = 'https:' + logoUrl;
      } else if (logoUrl.startsWith('/')) {
        logoUrl = origin + logoUrl;
      } else if (!logoUrl.startsWith('http')) {
        logoUrl = origin + '/' + logoUrl;
      }
      return logoUrl;
    }
  }

  // Return empty if not found
  return '';
}
