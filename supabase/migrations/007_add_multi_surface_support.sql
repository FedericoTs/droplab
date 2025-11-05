-- Migration: Add multi-surface support to design_templates
-- Purpose: Enable templates with multiple surfaces (front/back, panels, etc.)
-- Strategy: Add surfaces column, migrate existing data, keep old columns for backward compatibility
-- Date: 2025-11-05
-- Status: APPLIED via Supabase MCP

-- Step 1: Add surfaces column (JSONB array)
ALTER TABLE design_templates
ADD COLUMN IF NOT EXISTS surfaces JSONB DEFAULT '[]'::jsonb;

-- Step 2: Add index for surfaces JSONB queries
CREATE INDEX IF NOT EXISTS idx_design_templates_surfaces
ON design_templates USING GIN (surfaces);

-- Step 3: Migrate existing templates to multi-surface format
-- Pack current canvas_json, variable_mappings, and thumbnail_url into surfaces[0]
UPDATE design_templates
SET surfaces = jsonb_build_array(
  jsonb_build_object(
    'side', 'front',
    'canvas_json', canvas_json,
    'variable_mappings', COALESCE(variable_mappings, '{}'::jsonb),
    'thumbnail_url', thumbnail_url
  )
)
WHERE surfaces = '[]'::jsonb;

-- Step 4: Add comment to document the schema
COMMENT ON COLUMN design_templates.surfaces IS
'Multi-surface array for templates with multiple sides/panels. Each surface has: side (string), canvas_json (object), variable_mappings (object), thumbnail_url (string). Legacy templates use surfaces[0] only.';

-- Note: We keep canvas_json, variable_mappings, and thumbnail_url columns for backward compatibility
-- Future: Can deprecate old columns after full migration to multi-surface UI
