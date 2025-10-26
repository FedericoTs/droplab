import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

/**
 * POST /api/brand/analyze-website
 * Analyze a website and extract brand DNA using AI
 */
export async function POST(request: NextRequest) {
  try {
    const { websiteUrl } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json(
        errorResponse('Website URL is required', 'MISSING_URL'),
        { status: 400 }
      );
    }

    // Validate URL format
    let url: URL;
    try {
      url = new URL(websiteUrl);
    } catch (e) {
      return NextResponse.json(
        errorResponse('Invalid URL format', 'INVALID_URL'),
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        errorResponse('OpenAI API key not configured', 'API_KEY_MISSING'),
        { status: 500 }
      );
    }

    console.log(`🔍 Analyzing website: ${websiteUrl}`);

    // Step 1: Fetch website HTML
    const htmlResponse = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!htmlResponse.ok) {
      return NextResponse.json(
        errorResponse(`Failed to fetch website (${htmlResponse.status})`, 'FETCH_FAILED'),
        { status: 500 }
      );
    }

    const htmlContent = await htmlResponse.text();
    console.log('✅ HTML fetched successfully');

    // Step 2: Extract company name from HTML title/meta
    const companyName = extractCompanyName(htmlContent, url.hostname);
    console.log(`📛 Company name: ${companyName}`);

    // Step 3: Extract colors from CSS/HTML
    const colors = extractColorsFromHTML(htmlContent);
    console.log(`🎨 Colors extracted:`, colors);

    // Step 4: Extract fonts from CSS
    const fonts = extractFontsFromHTML(htmlContent);
    console.log(`📝 Fonts extracted:`, fonts);

    // Step 5: Extract logo URL - Try Clearbit API first (most reliable)
    const logoUrl = await extractLogoWithFallback(htmlContent, url.origin, url.hostname);
    console.log(`🖼️ Logo URL: ${logoUrl}`);

    // Step 6: Analyze brand voice with GPT-4 (text only - no screenshot needed!)
    const openai = new OpenAI({ apiKey });

    // Extract visible text content from HTML
    const textContent = extractTextContent(htmlContent);

    const analysisPrompt = `You are a brand strategist analyzing this website to extract comprehensive brand guidelines for marketing campaign creation.

Analyze the website content and provide detailed brand intelligence:

**Website:** ${url.hostname}
**Company:** ${companyName}

**Text Content Sample:**
${textContent.slice(0, 4000)}

Extract the following information for marketing campaign use:

1. **Brand Voice** (2-3 detailed sentences): Describe the complete communication style, personality, and approach. Include specific characteristics like formality level, energy, expertise positioning, and relationship with audience. Be detailed enough that a copywriter could replicate this voice.

2. **Tone** (1-2 sentences): The emotional quality and feeling of communications - warm/professional/authoritative/friendly/empathetic/confident etc.

3. **Target Audience** (1-2 sentences): Primary customer demographic with specifics - age ranges, life situations, pain points, and what they're seeking.

4. **Industry**: Business category (healthcare/retail/technology/finance/professional services/etc.)

5. **Key Phrases** (3-7 phrases): Distinctive phrases, taglines, or word patterns the brand consistently uses. These will be incorporated into campaigns.

6. **Brand Values** (3-5 values): Core values evident in messaging - what the brand stands for.

7. **Communication Style Notes** (2-3 bullet points): Specific guidance for marketing copy:
   - Word choices to use/avoid
   - Sentence structure preferences (short & punchy vs. detailed & explanatory)
   - Level of formality
   - Use of technical terms vs. plain language
   - Emotional appeal approach

8. **Recommended Template**: Best landing page template (professional/healthcare/retail/modern/classic)

Return ONLY a JSON object with this exact structure:
{
  "brandVoice": "detailed 2-3 sentence description of complete communication style",
  "tone": "emotional quality description",
  "targetAudience": "detailed demographic with specifics",
  "industry": "category",
  "keyPhrases": ["phrase1", "phrase2", "phrase3", "phrase4", "phrase5"],
  "brandValues": ["value1", "value2", "value3", "value4"],
  "communicationStyleNotes": ["note1", "note2", "note3"],
  "recommendedTemplate": "template name"
}`;

    console.log('🤖 Calling GPT-4 for brand voice analysis...');

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert brand strategist who analyzes websites to extract detailed brand guidelines for marketing campaigns. You MUST provide comprehensive, detailed descriptions (2-3 full sentences minimum) for brandVoice. You MUST include communicationStyleNotes array with 3 specific bullet points. Always return valid JSON only with ALL required fields."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.5,
      response_format: { type: "json_object" }
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
      // Provide defaults if parsing fails
      brandData = {
        brandVoice: 'Professional and trustworthy communication style with balanced formality. Focuses on building credibility through expertise while maintaining approachability.',
        tone: 'Warm and reassuring with professional confidence',
        targetAudience: 'General consumers seeking quality products or services',
        industry: 'General',
        keyPhrases: [],
        brandValues: [],
        communicationStyleNotes: [
          'Use clear, jargon-free language',
          'Balance professionalism with warmth',
          'Focus on customer benefits'
        ],
        recommendedTemplate: 'professional'
      };
    }

    // Return extracted brand data
    return NextResponse.json(
      successResponse(
        {
          // Company Profile
          companyName,
          industry: brandData.industry || 'General',
          brandVoice: brandData.brandVoice || 'Professional and trustworthy',
          tone: brandData.tone || 'Warm and reassuring',
          targetAudience: brandData.targetAudience || 'General consumers',
          keyPhrases: brandData.keyPhrases || [],
          brandValues: brandData.brandValues || [],
          communicationStyleNotes: brandData.communicationStyleNotes || [],
          websiteUrl,
          // Visual Brand Kit
          logoUrl,
          primaryColor: colors.primary || '#1E3A8A',
          secondaryColor: colors.secondary || '#FF6B35',
          accentColor: colors.accent || '#10B981',
          headingFont: fonts.heading || 'Inter',
          bodyFont: fonts.body || 'Open Sans',
          landingPageTemplate: brandData.recommendedTemplate || 'professional',
        },
        'Website analyzed successfully - comprehensive brand guidelines extracted'
      )
    );

  } catch (error) {
    console.error('Error analyzing website:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to analyze website',
        'ANALYSIS_ERROR'
      ),
      { status: 500 }
    );
  }
}

/**
 * Extract colors from HTML/CSS
 */
function extractColorsFromHTML(html: string): { primary: string; secondary: string; accent: string } {
  const colors: string[] = [];

  // Extract hex colors from inline styles and CSS
  const hexPattern = /#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})/g;
  const matches = html.match(hexPattern) || [];

  // Normalize 3-digit hex to 6-digit
  const normalizedColors = matches.map(color => {
    if (color.length === 4) {
      // #RGB -> #RRGGBB
      const r = color[1];
      const g = color[2];
      const b = color[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    return color.toUpperCase();
  });

  // Count frequency
  const colorCount: { [key: string]: number } = {};
  normalizedColors.forEach(color => {
    colorCount[color] = (colorCount[color] || 0) + 1;
  });

  // Sort by frequency
  const sortedColors = Object.entries(colorCount)
    .sort(([, a], [, b]) => b - a)
    .map(([color]) => color)
    .filter(color => {
      // Filter out white, black, and very light/dark colors
      const hex = color.substring(1);
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r + g + b) / 3;
      return brightness > 30 && brightness < 225; // Not too dark or light
    });

  return {
    primary: sortedColors[0] || '#1E3A8A',
    secondary: sortedColors[1] || '#FF6B35',
    accent: sortedColors[2] || '#10B981',
  };
}

/**
 * Extract fonts from HTML/CSS
 */
function extractFontsFromHTML(html: string): { heading: string; body: string } {
  const fonts: string[] = [];

  // Extract from font-family CSS properties
  const fontFamilyPattern = /font-family:\s*([^;}]+)/gi;
  let match;

  while ((match = fontFamilyPattern.exec(html)) !== null) {
    const fontFamily = match[1].trim();
    // Clean up quotes and fallback fonts
    const cleanFont = fontFamily
      .split(',')[0] // Take first font only
      .replace(/['"]/g, '') // Remove quotes
      .trim();

    if (cleanFont && !cleanFont.includes('sans-serif') && !cleanFont.includes('serif')) {
      fonts.push(cleanFont);
    }
  }

  // Common font names to prioritize
  const commonFonts = [
    'Inter', 'Roboto', 'Open Sans', 'Montserrat', 'Poppins', 'Lato',
    'Raleway', 'Playfair Display', 'Merriweather', 'Source Sans Pro'
  ];

  const foundCommonFont = fonts.find(font =>
    commonFonts.some(common => font.toLowerCase().includes(common.toLowerCase()))
  );

  return {
    heading: foundCommonFont || fonts[0] || 'Inter',
    body: fonts[1] || foundCommonFont || 'Open Sans',
  };
}

/**
 * Extract visible text content from HTML
 */
function extractTextContent(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
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
 * Extract logo with fallback strategy:
 * 1. Try Clearbit Logo API (most reliable)
 * 2. Fall back to HTML scraping
 * 3. Fall back to favicon
 */
async function extractLogoWithFallback(html: string, origin: string, hostname: string): Promise<string> {
  const domain = hostname.replace('www.', '');

  // Strategy 1: Try Clearbit Logo API (free, no auth, very reliable)
  const clearbitUrl = `https://logo.clearbit.com/${domain}`;
  console.log(`🔍 Trying Clearbit Logo API: ${clearbitUrl}`);

  try {
    const response = await fetch(clearbitUrl, { method: 'HEAD' });
    if (response.ok) {
      console.log(`✅ Found logo via Clearbit API: ${clearbitUrl}`);
      return clearbitUrl;
    }
  } catch (error) {
    console.log('⚠️ Clearbit API failed, falling back to HTML scraping');
  }

  // Strategy 2: Fall back to HTML scraping
  const scrapedLogo = extractLogoUrl(html, origin);
  if (scrapedLogo) {
    return scrapedLogo;
  }

  // Strategy 3: Fall back to Google Favicon service
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
  console.log(`⚠️ Using Google Favicon as last resort: ${faviconUrl}`);
  return faviconUrl;
}

/**
 * Extract logo URL from HTML with smart filtering
 */
function extractLogoUrl(html: string, origin: string): string {
  const urlObj = new URL(origin);
  const domain = urlObj.hostname.replace('www.', '');

  console.log(`🔍 Searching for logo on domain: ${domain}`);

  // Priority 1: Look for SVG logos FIRST (modern websites use SVG for logos)
  // SVG logos in header/nav are almost always the company logo
  const svgLogoPatterns = [
    /<header[^>]*>[\s\S]*?<(?:img|svg)[^>]+(?:src|href)=["']([^"']+\.svg[^"']*)["'][^>]*>[\s\S]*?<\/header>/i,
    /<nav[^>]*>[\s\S]*?<(?:img|svg)[^>]+(?:src|href)=["']([^"']+\.svg[^"']*)["'][^>]*>[\s\S]*?<\/nav>/i,
    /<img[^>]+src=["']([^"']+\.svg[^"']*)["'][^>]*class=["'][^"']*(?:logo|brand)[^"']*["']/i,
    /<svg[^>]*class=["'][^"']*(?:logo|brand)[^"']*["'][^>]*>[\s\S]*?<\/svg>/i, // For inline SVG
  ];

  for (const pattern of svgLogoPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const logoUrl = makeAbsoluteUrl(match[1], origin);
      if (isValidLogoUrl(logoUrl, domain)) {
        console.log(`✅ Found SVG logo in header/nav: ${logoUrl}`);
        return logoUrl;
      }
    }
  }

  // Priority 2: Look for any header/nav logos (PNG/JPG fallback)
  const headerLogoPatterns = [
    /<header[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/header>/i,
    /<nav[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/nav>/i,
    /<img[^>]+class=["'][^"']*(?:header|navbar|nav|site-logo|brand)[^"']*["'][^>]+src=["']([^"']+)["']/i,
  ];

  for (const pattern of headerLogoPatterns) {
    const match = html.match(pattern);
    if (match) {
      const logoUrl = makeAbsoluteUrl(match[1], origin);
      if (isValidLogoUrl(logoUrl, domain) && looksLikeLogo(logoUrl)) {
        console.log(`✅ Found logo in header/nav: ${logoUrl}`);
        return logoUrl;
      }
    }
  }

  // Priority 3: Look for ANY img/svg with "logo" in class/alt/src (SVG preferred)
  // First try SVG with "logo" keyword
  const svgWithLogoPattern = /<(?:img|svg)[^>]+src=["']([^"']*logo[^"']*\.svg[^"']*)["']/gi;
  let svgMatch;

  while ((svgMatch = svgWithLogoPattern.exec(html)) !== null) {
    const logoUrl = makeAbsoluteUrl(svgMatch[1], origin);
    if (isValidLogoUrl(logoUrl, domain)) {
      console.log(`✅ Found SVG logo with "logo" keyword: ${logoUrl}`);
      return logoUrl;
    }
  }

  // Then try any img with "logo" in class/alt (PNG/JPG)
  const logoImgPattern = /<img[^>]+(?:class|alt)=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/gi;
  let match;
  const candidates: string[] = [];

  while ((match = logoImgPattern.exec(html)) !== null) {
    const logoUrl = makeAbsoluteUrl(match[1], origin);
    if (isValidLogoUrl(logoUrl, domain) && looksLikeLogo(logoUrl)) {
      candidates.push(logoUrl);
    }
  }

  // Return first valid candidate (prefer SVG over others)
  const svgCandidates = candidates.filter(url => url.endsWith('.svg'));
  if (svgCandidates.length > 0) {
    console.log(`✅ Found SVG logo candidate: ${svgCandidates[0]}`);
    return svgCandidates[0];
  }

  if (candidates.length > 0) {
    console.log(`✅ Found logo candidate: ${candidates[0]}`);
    return candidates[0];
  }

  // Priority 4: OpenGraph image (might be marketing image, not logo - use as fallback only)
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    const logoUrl = makeAbsoluteUrl(ogImageMatch[1], origin);
    // Only accept if it looks like a logo (small file, has "logo" in name, etc.)
    if (isValidLogoUrl(logoUrl, domain) && looksLikeLogo(logoUrl)) {
      console.log(`✅ Found logo via og:image: ${logoUrl}`);
      return logoUrl;
    } else {
      console.log(`⚠️ Rejecting og:image (doesn't look like logo): ${logoUrl}`);
    }
  }

  // Priority 5: Favicon as last resort fallback
  const faviconPatterns = [
    /<link\s+rel=["']apple-touch-icon["']\s+href=["']([^"']+)["']/i,
    /<link\s+rel=["']icon["']\s+href=["']([^"']+)["']/i,
  ];

  for (const pattern of faviconPatterns) {
    const faviconMatch = html.match(pattern);
    if (faviconMatch) {
      const logoUrl = makeAbsoluteUrl(faviconMatch[1], origin);
      console.log(`⚠️ Using favicon as fallback: ${logoUrl}`);
      return logoUrl;
    }
  }

  console.log('❌ No logo found');
  return '';
}

/**
 * Make URL absolute
 */
function makeAbsoluteUrl(url: string, origin: string): string {
  if (url.startsWith('//')) {
    return 'https:' + url;
  } else if (url.startsWith('/')) {
    return origin + url;
  } else if (!url.startsWith('http')) {
    return origin + '/' + url;
  }
  return url;
}

/**
 * Check if logo URL is valid (not external partner/customer logo)
 */
function isValidLogoUrl(logoUrl: string, companyDomain: string): boolean {
  try {
    const url = new URL(logoUrl);
    const logoDomain = url.hostname.replace('www.', '');

    // Reject if it's from a completely different domain (e.g., typeform.com on stripe.com)
    // Allow CDN domains (images., cdn., static., assets., etc.)
    const isSameDomain = logoDomain === companyDomain;
    const isCompanyCDN = logoDomain.includes(companyDomain.split('.')[0]); // e.g., stripeassets.com for stripe.com
    const isCommonCDN = /^(images?|cdn|static|assets|media)\./i.test(logoDomain);

    // Reject if filename contains other company names (heuristic)
    const suspiciousNames = ['typeform', 'facebook', 'google', 'twitter', 'linkedin', 'instagram'];
    const filename = url.pathname.toLowerCase();
    const hasSuspiciousName = suspiciousNames.some(name => filename.includes(name));

    if (hasSuspiciousName && !isCompanyCDN) {
      console.log(`⚠️ Rejecting logo (external company): ${logoUrl}`);
      return false;
    }

    return isSameDomain || isCompanyCDN || isCommonCDN;
  } catch {
    return false;
  }
}

/**
 * Check if URL looks like a logo (not a marketing/hero/product image)
 */
function looksLikeLogo(logoUrl: string): boolean {
  const url = logoUrl.toLowerCase();

  // Good signs: has "logo", "brand", "icon" in filename
  const hasLogoKeyword = /logo|brand|icon|emblem|mark|wordmark/i.test(url);

  // Bad signs: marketing/hero images
  const hasMarketingKeyword = /hero|banner|og-image|social|card|share|opengraph|meta|preview/i.test(url);

  // Bad signs: product/lifestyle images
  const hasProductKeyword = /chair|desk|office|person|people|product|lifestyle|photo|image|gallery/i.test(url);

  // Reject if it has marketing or product keywords and no logo keyword
  if ((hasMarketingKeyword || hasProductKeyword) && !hasLogoKeyword) {
    console.log(`⚠️ Rejecting image (looks like product/marketing image): ${logoUrl}`);
    return false;
  }

  return true;
}
