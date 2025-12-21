-- =====================================================
-- Migration: Template PDF Cache
-- Purpose: Store metadata for cached pre-rendered base PDFs
--
-- Part of Ultra-Fast PDF Generation system:
-- - Base PDFs are rendered once and cached in Supabase Storage
-- - This table stores metadata (version hash, variable positions)
-- - Cache hit rate target: >95% for same template
--
-- Storage Structure:
--   base-pdfs/{template_id}/front-{version_hash}.pdf
--   base-pdfs/{template_id}/back-{version_hash}.pdf
-- =====================================================

-- Create template_pdf_cache table
CREATE TABLE IF NOT EXISTS template_pdf_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template reference
  template_id UUID NOT NULL REFERENCES design_templates(id) ON DELETE CASCADE,

  -- Which surface (front or back)
  surface_side TEXT NOT NULL CHECK (surface_side IN ('front', 'back')),

  -- Version hash of canvas_json (for cache invalidation)
  version_hash TEXT NOT NULL,

  -- Storage path in Supabase Storage
  storage_path TEXT NOT NULL,

  -- Extracted variable positions (PDF coordinates)
  variable_positions JSONB NOT NULL,

  -- File size in bytes (for monitoring)
  file_size_bytes INTEGER NOT NULL DEFAULT 0,

  -- Generation metadata
  format_type TEXT NOT NULL,
  page_width_points NUMERIC(10, 2) NOT NULL,
  page_height_points NUMERIC(10, 2) NOT NULL,
  dpi INTEGER NOT NULL DEFAULT 300,

  -- Access tracking
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one cache entry per template/surface/version
  UNIQUE(template_id, surface_side, version_hash)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_template_pdf_cache_template_id
  ON template_pdf_cache(template_id);

CREATE INDEX IF NOT EXISTS idx_template_pdf_cache_lookup
  ON template_pdf_cache(template_id, surface_side, version_hash);

CREATE INDEX IF NOT EXISTS idx_template_pdf_cache_last_accessed
  ON template_pdf_cache(last_accessed_at);

-- Enable RLS
ALTER TABLE template_pdf_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow access through template ownership chain
-- template_pdf_cache → design_templates → organization → user
CREATE POLICY "template_pdf_cache_select_policy" ON template_pdf_cache
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM design_templates dt
      JOIN user_profiles up ON dt.organization_id = up.organization_id
      WHERE dt.id = template_pdf_cache.template_id
        AND up.user_id = auth.uid()
    )
  );

-- Service role can insert/update/delete (for cache management)
CREATE POLICY "template_pdf_cache_service_all" ON template_pdf_cache
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow authenticated users to insert/update their own organization's cache
CREATE POLICY "template_pdf_cache_insert_policy" ON template_pdf_cache
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM design_templates dt
      JOIN user_profiles up ON dt.organization_id = up.organization_id
      WHERE dt.id = template_pdf_cache.template_id
        AND up.user_id = auth.uid()
    )
  );

CREATE POLICY "template_pdf_cache_update_policy" ON template_pdf_cache
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM design_templates dt
      JOIN user_profiles up ON dt.organization_id = up.organization_id
      WHERE dt.id = template_pdf_cache.template_id
        AND up.user_id = auth.uid()
    )
  );

CREATE POLICY "template_pdf_cache_delete_policy" ON template_pdf_cache
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM design_templates dt
      JOIN user_profiles up ON dt.organization_id = up.organization_id
      WHERE dt.id = template_pdf_cache.template_id
        AND up.user_id = auth.uid()
    )
  );

-- Function to update hit count and last_accessed_at
CREATE OR REPLACE FUNCTION increment_cache_hit(p_cache_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE template_pdf_cache
  SET
    hit_count = hit_count + 1,
    last_accessed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_cache_id;
END;
$$;

-- Function to cleanup old cache entries (call periodically)
CREATE OR REPLACE FUNCTION cleanup_stale_cache(p_max_age_days INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM template_pdf_cache
    WHERE last_accessed_at < NOW() - (p_max_age_days || ' days')::INTERVAL
      OR (last_accessed_at IS NULL AND created_at < NOW() - (p_max_age_days || ' days')::INTERVAL)
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  RETURN deleted_count;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON template_pdf_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_pdf_cache TO service_role;
GRANT EXECUTE ON FUNCTION increment_cache_hit TO authenticated;
GRANT EXECUTE ON FUNCTION increment_cache_hit TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_stale_cache TO service_role;

-- Create storage bucket for base PDFs if it doesn't exist
-- Note: Run this separately or via Supabase dashboard
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'base-pdfs',
--   'base-pdfs',
--   false,
--   10485760,  -- 10MB max
--   ARRAY['application/pdf']::text[]
-- )
-- ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE template_pdf_cache IS 'Cache metadata for pre-rendered base PDFs used in ultra-fast PDF generation';
COMMENT ON COLUMN template_pdf_cache.version_hash IS 'Hash of canvas_json for cache invalidation when template changes';
COMMENT ON COLUMN template_pdf_cache.variable_positions IS 'JSONB containing ExtractedPositions with PDF coordinates';
COMMENT ON COLUMN template_pdf_cache.hit_count IS 'Number of times this cached PDF was used';
