-- Migration 008: API Keys & Webhooks
-- Developer API, webhook integrations, and external service connections

-- API Keys (for developer access to platform)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Key Metadata
  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of actual key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification (e.g., "pk_live_")

  -- Permissions
  scopes TEXT[] DEFAULT '{read}', -- Array: ['read', 'write', 'campaigns:create', 'templates:read']
  is_active BOOLEAN DEFAULT true,

  -- Usage Limits
  rate_limit_per_hour INTEGER DEFAULT 1000,
  rate_limit_per_day INTEGER DEFAULT 10000,

  -- Usage Tracking
  last_used_at TIMESTAMPTZ,
  total_requests INTEGER DEFAULT 0,

  -- Security
  expires_at TIMESTAMPTZ,
  allowed_ips TEXT[], -- Optional IP whitelist

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

-- Row-Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view API keys in their organization"
  ON api_keys FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage API keys"
  ON api_keys FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- API Request Logs (for debugging and monitoring)
CREATE TABLE api_request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Request Details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  request_headers JSONB,
  request_body JSONB,

  -- Response Details
  response_status INTEGER NOT NULL,
  response_body JSONB,
  response_time_ms INTEGER, -- Milliseconds

  -- Client Info
  ip_address INET,
  user_agent TEXT,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_logs_key ON api_request_logs(api_key_id);
CREATE INDEX idx_api_logs_org ON api_request_logs(organization_id);
CREATE INDEX idx_api_logs_endpoint ON api_request_logs(endpoint);
CREATE INDEX idx_api_logs_created ON api_request_logs(created_at DESC);

-- Partitioning by month for performance (optional, can be enabled later)
-- CREATE INDEX idx_api_logs_created_monthly ON api_request_logs(created_at) WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- Webhooks (outgoing event notifications)
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Endpoint Configuration
  url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Events to Subscribe
  subscribed_events TEXT[] NOT NULL, -- e.g., ['campaign.completed', 'recipient.converted', 'template.published']

  -- Security
  secret_key TEXT NOT NULL, -- HMAC signing secret
  verify_ssl BOOLEAN DEFAULT true,

  -- Retry Configuration
  max_retries INTEGER DEFAULT 3,
  retry_backoff_seconds INTEGER DEFAULT 60,

  -- Usage Stats
  last_triggered_at TIMESTAMPTZ,
  total_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_webhooks_org ON webhook_endpoints(organization_id);
CREATE INDEX idx_webhooks_active ON webhook_endpoints(is_active) WHERE is_active = true;

-- Row-Level Security
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhooks in their organization"
  ON webhook_endpoints FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage webhooks"
  ON webhook_endpoints FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Webhook Delivery Logs (track webhook attempts)
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Event Details
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,

  -- Delivery Attempt
  attempt_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),

  -- HTTP Details
  http_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,

  -- Error Handling
  error_message TEXT,
  next_retry_at TIMESTAMPTZ,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_deliveries_webhook ON webhook_deliveries(webhook_endpoint_id);
CREATE INDEX idx_deliveries_org ON webhook_deliveries(organization_id);
CREATE INDEX idx_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'retrying';

-- External Integrations (third-party API credentials)
CREATE TABLE external_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Integration Type
  provider TEXT NOT NULL CHECK (provider IN (
    'data_axle',
    'postgrid',
    'stripe',
    'openai',
    'elevenlabs',
    'sendgrid',
    'twilio',
    'salesforce',
    'hubspot',
    'google_analytics',
    'custom'
  )),
  integration_name TEXT NOT NULL,

  -- Credentials (encrypted at application level)
  credentials JSONB NOT NULL, -- { api_key: "...", api_secret: "...", ... }

  -- Configuration
  config JSONB, -- Provider-specific settings

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_integrations_org ON external_integrations(organization_id);
CREATE INDEX idx_integrations_provider ON external_integrations(provider);

-- Row-Level Security
ALTER TABLE external_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view integrations in their organization"
  ON external_integrations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage integrations"
  ON external_integrations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Job Queue (for background processing with BullMQ/Redis)
CREATE TABLE job_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Job Details
  job_type TEXT NOT NULL CHECK (job_type IN (
    'campaign_generation',
    'batch_render',
    'ai_background_generation',
    'address_validation',
    'webhook_delivery',
    'analytics_aggregation',
    'template_conversion',
    'data_export'
  )),
  job_data JSONB NOT NULL,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'canceled')),
  progress INTEGER DEFAULT 0, -- 0-100 percentage
  result JSONB,
  error_message TEXT,

  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Retry Logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_jobs_org ON job_queue(organization_id);
CREATE INDEX idx_jobs_status ON job_queue(status);
CREATE INDEX idx_jobs_type ON job_queue(job_type);
CREATE INDEX idx_jobs_retry ON job_queue(next_retry_at) WHERE status = 'failed' AND retry_count < max_retries;

-- Row-Level Security
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view jobs in their organization"
  ON job_queue FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organization_roles
      WHERE user_id = auth.uid()
    )
  );

-- Function to trigger webhook on event
CREATE OR REPLACE FUNCTION trigger_webhook(
  p_organization_id UUID,
  p_event_type TEXT,
  p_event_data JSONB
)
RETURNS VOID AS $$
DECLARE
  v_webhook RECORD;
BEGIN
  -- Find active webhooks subscribed to this event
  FOR v_webhook IN
    SELECT id, url, secret_key
    FROM webhook_endpoints
    WHERE organization_id = p_organization_id
      AND is_active = true
      AND p_event_type = ANY(subscribed_events)
  LOOP
    -- Queue webhook delivery
    INSERT INTO webhook_deliveries (
      webhook_endpoint_id,
      organization_id,
      event_type,
      event_data,
      status
    ) VALUES (
      v_webhook.id,
      p_organization_id,
      p_event_type,
      p_event_data,
      'pending'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment API key usage
CREATE OR REPLACE FUNCTION increment_api_key_usage(p_key_hash TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE api_keys
  SET
    total_requests = total_requests + 1,
    last_used_at = NOW()
  WHERE key_hash = p_key_hash;
END;
$$ LANGUAGE plpgsql;

-- Function to validate API key and check rate limits
CREATE OR REPLACE FUNCTION validate_api_key(p_key_hash TEXT)
RETURNS JSONB AS $$
DECLARE
  v_key RECORD;
  v_hourly_requests INTEGER;
  v_daily_requests INTEGER;
BEGIN
  -- Get API key
  SELECT * INTO v_key
  FROM api_keys
  WHERE key_hash = p_key_hash
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (revoked_at IS NULL);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired API key');
  END IF;

  -- Check hourly rate limit
  SELECT COUNT(*) INTO v_hourly_requests
  FROM api_request_logs
  WHERE api_key_id = v_key.id
    AND created_at > NOW() - INTERVAL '1 hour';

  IF v_hourly_requests >= v_key.rate_limit_per_hour THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Hourly rate limit exceeded');
  END IF;

  -- Check daily rate limit
  SELECT COUNT(*) INTO v_daily_requests
  FROM api_request_logs
  WHERE api_key_id = v_key.id
    AND created_at > NOW() - INTERVAL '1 day';

  IF v_daily_requests >= v_key.rate_limit_per_day THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Daily rate limit exceeded');
  END IF;

  -- Valid key
  RETURN jsonb_build_object(
    'valid', true,
    'organization_id', v_key.organization_id,
    'scopes', v_key.scopes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at triggers
CREATE TRIGGER update_webhook_endpoints_updated_at
  BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_integrations_updated_at
  BEFORE UPDATE ON external_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cleanup old logs (optional maintenance function)
CREATE OR REPLACE FUNCTION cleanup_old_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_request_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM webhook_deliveries
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND status IN ('success', 'failed');

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
