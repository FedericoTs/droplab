/**
 * Variable Detection & Sample CSV Generation
 *
 * Scans canvas JSON to detect all {variable} fields
 * Generates downloadable CSV template for batch personalization
 */

import { extractFieldNames } from '@/lib/design/variable-parser';

export interface TemplateVariable {
  fieldName: string;        // e.g., "firstName"
  displayName: string;      // e.g., "First Name"
  sampleValue: string;      // e.g., "John"
  detectedIn: string[];     // e.g., ["text-1", "text-3"]
}

/**
 * Scan canvas JSON and detect all variables
 */
export function detectTemplateVariables(canvasJSON: any): TemplateVariable[] {
  const variableMap = new Map<string, TemplateVariable>();

  try {
    console.log('🔍 [VARIABLE DETECTION] Starting detection...');
    console.log('📊 [VARIABLE DETECTION] Canvas JSON type:', typeof canvasJSON);
    console.log('📊 [VARIABLE DETECTION] Canvas JSON:', JSON.stringify(canvasJSON, null, 2));

    const objects = canvasJSON?.objects || [];
    console.log(`📦 [VARIABLE DETECTION] Found ${objects.length} objects in canvas`);

    objects.forEach((obj: any, index: number) => {
      console.log(`\n🔎 [OBJECT ${index}] Checking object:`, {
        type: obj.type,
        text: obj.text,
        hasText: !!obj.text,
        textLength: obj.text?.length || 0,
      });

      // Check if object is text-based (case-insensitive for Fabric.js v6 compatibility)
      // Fabric.js v6 uses 'Textbox' (PascalCase), older versions use 'textbox' (lowercase)
      const objType = obj.type?.toLowerCase() || '';
      if (objType === 'textbox' || objType === 'i-text' || objType === 'text' || objType === 'itext') {
        const text = obj.text || '';
        console.log(`✏️ [OBJECT ${index}] Text object found! Text: "${text}"`);

        const fieldNames = extractFieldNames(text);
        console.log(`🎯 [OBJECT ${index}] Extracted field names:`, fieldNames);

        fieldNames.forEach(fieldName => {
          if (!variableMap.has(fieldName)) {
            variableMap.set(fieldName, {
              fieldName,
              displayName: formatFieldName(fieldName),
              sampleValue: generateSampleValue(fieldName),
              detectedIn: [`object-${index}`],
            });
            console.log(`✅ [VARIABLE] Added new variable: ${fieldName}`);
          } else {
            // Add to detectedIn array
            const existing = variableMap.get(fieldName)!;
            existing.detectedIn.push(`object-${index}`);
            console.log(`🔄 [VARIABLE] Variable ${fieldName} found again in object-${index}`);
          }
        });
      } else {
        console.log(`⏭️ [OBJECT ${index}] Skipping non-text object (type: ${obj.type})`);
      }
    });

    const results = Array.from(variableMap.values()).sort((a, b) =>
      a.fieldName.localeCompare(b.fieldName)
    );

    console.log(`\n🎉 [VARIABLE DETECTION] Detection complete!`);
    console.log(`📈 [VARIABLE DETECTION] Total variables detected: ${results.length}`);
    console.log(`📋 [VARIABLE DETECTION] Variables:`, results.map(v => v.fieldName));

    return results;
  } catch (error) {
    console.error('❌ [VARIABLE DETECTION] Error detecting template variables:', error);
    console.error('❌ [VARIABLE DETECTION] Stack trace:', error);
    return [];
  }
}

/**
 * Format field name for display
 * Example: "firstName" -> "First Name", "email_address" -> "Email Address"
 */
function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/_/g, ' ')                    // underscores to spaces
    .replace(/([A-Z])/g, ' $1')            // camelCase to spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

/**
 * Generate realistic sample value based on field name
 */
function generateSampleValue(fieldName: string): string {
  const lower = fieldName.toLowerCase();

  // Common field name patterns
  if (lower.includes('first') && lower.includes('name')) return 'John';
  if (lower.includes('last') && lower.includes('name')) return 'Smith';
  if (lower.includes('name')) return 'John Smith';
  if (lower.includes('email')) return 'john.smith@example.com';
  if (lower.includes('phone')) return '(555) 123-4567';
  if (lower.includes('address')) return '123 Main Street';
  if (lower.includes('city')) return 'Boston';
  if (lower.includes('state')) return 'MA';
  if (lower.includes('zip')) return '02101';
  if (lower.includes('company')) return 'Acme Corp';
  if (lower.includes('title') || lower.includes('job')) return 'Marketing Director';
  if (lower.includes('website')) return 'www.example.com';
  if (lower.includes('date')) return '2025-01-15';
  if (lower.includes('amount') || lower.includes('price')) return '$99.99';
  if (lower.includes('discount')) return '20%';

  // Default: Capitalize field name
  return formatFieldName(fieldName);
}

/**
 * Generate CSV sample file content
 * Returns CSV string with headers + 3 example rows
 */
export function generateSampleCSV(variables: TemplateVariable[]): string {
  if (variables.length === 0) {
    return 'no_variables_detected\n(Add {variableName} to your template)';
  }

  // CSV Header (column names)
  const headers = variables.map(v => v.fieldName).join(',');

  // Generate 3 sample rows with diverse data
  const sampleRows = [
    // Row 1: Default samples
    variables.map(v => escapeCSVValue(v.sampleValue)),

    // Row 2: Alternative samples (female name, different city)
    variables.map(v => escapeCSVValue(getAlternativeSample(v.fieldName, 1))),

    // Row 3: Third sample (diverse)
    variables.map(v => escapeCSVValue(getAlternativeSample(v.fieldName, 2))),
  ];

  const csvRows = [
    headers,
    ...sampleRows.map(row => row.join(',')),
  ];

  return csvRows.join('\n');
}

/**
 * Get alternative sample values for diversity
 */
function getAlternativeSample(fieldName: string, variantIndex: number): string {
  const lower = fieldName.toLowerCase();

  if (lower.includes('first') && lower.includes('name')) {
    return ['Sarah', 'Michael', 'Emily'][variantIndex] || 'Alex';
  }
  if (lower.includes('last') && lower.includes('name')) {
    return ['Johnson', 'Williams', 'Brown'][variantIndex] || 'Davis';
  }
  if (lower.includes('name')) {
    return ['Sarah Johnson', 'Michael Williams', 'Emily Brown'][variantIndex] || 'Alex Davis';
  }
  if (lower.includes('email')) {
    const names = ['sarah.johnson', 'michael.williams', 'emily.brown'];
    return `${names[variantIndex] || 'alex.davis'}@example.com`;
  }
  if (lower.includes('city')) {
    return ['Seattle', 'Austin', 'Denver'][variantIndex] || 'Portland';
  }
  if (lower.includes('state')) {
    return ['WA', 'TX', 'CO'][variantIndex] || 'OR';
  }
  if (lower.includes('zip')) {
    return ['98101', '78701', '80201'][variantIndex] || '97201';
  }
  if (lower.includes('phone')) {
    const area = ['206', '512', '303'][variantIndex] || '503';
    return `(${area}) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;
  }
  if (lower.includes('company')) {
    return ['TechStart Inc', 'Global Solutions', 'Creative Co'][variantIndex] || 'Innovate LLC';
  }

  // Default: Return original sample value
  return generateSampleValue(fieldName);
}

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSVValue(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Download CSV as file
 */
export function downloadCSVSample(csvContent: string, templateName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${sanitizeFileName(templateName)}_sample.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Sanitize filename (remove special characters)
 */
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')  // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_')             // Collapse multiple underscores
    .replace(/^_|_$/g, '');         // Remove leading/trailing underscores
}
