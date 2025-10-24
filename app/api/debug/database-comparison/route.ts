import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET() {
  try {
    const results: any = {};

    // Check which database is currently configured
    const connectionFile = require('fs').readFileSync(
      path.join(process.cwd(), 'lib/database/connection.ts'),
      'utf-8'
    );
    const dbMatch = connectionFile.match(/const DB_PATH.*?["'](.+?)["']/);
    results.currently_configured = dbMatch ? dbMatch[1] : 'unknown';

    // Check marketing.db
    try {
      const marketingDbPath = path.join(process.cwd(), 'marketing.db');
      const marketingDb = new Database(marketingDbPath);

      results.marketing_db = {
        path: 'marketing.db',
        file_size_mb: (require('fs').statSync(marketingDbPath).size / (1024 * 1024)).toFixed(2),
        campaign_templates: marketingDb.prepare('SELECT COUNT(*) as count FROM campaign_templates').get(),
        dm_templates: marketingDb.prepare('SELECT COUNT(*) as count FROM dm_templates').get(),
        dm_templates_with_preview: marketingDb.prepare('SELECT COUNT(*) as count FROM dm_templates WHERE preview_image IS NOT NULL').get(),
        campaigns: marketingDb.prepare('SELECT COUNT(*) as count FROM campaigns').get(),
      };

      // Get sample campaign templates
      const marketingTemplates = marketingDb.prepare(`
        SELECT id, name, is_system_template, use_count
        FROM campaign_templates
        ORDER BY is_system_template ASC, created_at DESC
        LIMIT 15
      `).all();
      results.marketing_db.sample_campaign_templates = marketingTemplates;

      // Get sample DM templates with preview
      const marketingDMs = marketingDb.prepare(`
        SELECT dt.id, dt.campaign_template_id, dt.name, ct.name as campaign_template_name,
               CASE WHEN dt.preview_image IS NULL THEN 0 ELSE 1 END as has_preview,
               LENGTH(dt.preview_image) as preview_size_bytes
        FROM dm_templates dt
        LEFT JOIN campaign_templates ct ON dt.campaign_template_id = ct.id
        LIMIT 10
      `).all();
      results.marketing_db.sample_dm_templates = marketingDMs;

      marketingDb.close();
    } catch (error: any) {
      results.marketing_db_error = error.message;
    }

    // Check dm-tracking.db
    try {
      const dmTrackingDbPath = path.join(process.cwd(), 'dm-tracking.db');
      const dmTrackingDb = new Database(dmTrackingDbPath);

      results.dm_tracking_db = {
        path: 'dm-tracking.db',
        file_size_mb: (require('fs').statSync(dmTrackingDbPath).size / (1024 * 1024)).toFixed(2),
        campaign_templates: dmTrackingDb.prepare('SELECT COUNT(*) as count FROM campaign_templates').get(),
        dm_templates: dmTrackingDb.prepare('SELECT COUNT(*) as count FROM dm_templates').get(),
        dm_templates_with_preview: dmTrackingDb.prepare('SELECT COUNT(*) as count FROM dm_templates WHERE preview_image IS NOT NULL').get(),
        campaigns: dmTrackingDb.prepare('SELECT COUNT(*) as count FROM campaigns').get(),
      };

      // Get sample campaign templates
      const dmTrackingTemplates = dmTrackingDb.prepare(`
        SELECT id, name, is_system_template, use_count
        FROM campaign_templates
        ORDER BY is_system_template ASC, created_at DESC
        LIMIT 15
      `).all();
      results.dm_tracking_db.sample_campaign_templates = dmTrackingTemplates;

      // Get sample DM templates with preview
      const dmTrackingDMs = dmTrackingDb.prepare(`
        SELECT dt.id, dt.campaign_template_id, dt.name, ct.name as campaign_template_name,
               CASE WHEN dt.preview_image IS NULL THEN 0 ELSE 1 END as has_preview,
               LENGTH(dt.preview_image) as preview_size_bytes
        FROM dm_templates dt
        LEFT JOIN campaign_templates ct ON dt.campaign_template_id = ct.id
        LIMIT 10
      `).all();
      results.dm_tracking_db.sample_dm_templates = dmTrackingDMs;

      dmTrackingDb.close();
    } catch (error: any) {
      results.dm_tracking_db_error = error.message;
    }

    // Determine which has user's actual templates
    const marketingDMWithPreview = results.marketing_db?.dm_templates_with_preview?.count || 0;
    const dmTrackingDMWithPreview = results.dm_tracking_db?.dm_templates_with_preview?.count || 0;
    const marketingUserTemplates = results.marketing_db?.sample_campaign_templates?.filter((t: any) => t.is_system_template === 0).length || 0;
    const dmTrackingUserTemplates = results.dm_tracking_db?.sample_campaign_templates?.filter((t: any) => t.is_system_template === 0).length || 0;

    let recommendation = '';
    if (marketingDMWithPreview > dmTrackingDMWithPreview) {
      recommendation = `USE marketing.db - Has ${marketingDMWithPreview} DM templates with previews (user-created) vs ${dmTrackingDMWithPreview} in dm-tracking.db`;
    } else if (dmTrackingDMWithPreview > marketingDMWithPreview) {
      recommendation = `USE dm-tracking.db - Has ${dmTrackingDMWithPreview} DM templates with previews (user-created) vs ${marketingDMWithPreview} in marketing.db`;
    } else if (marketingUserTemplates > dmTrackingUserTemplates) {
      recommendation = `USE marketing.db - Has ${marketingUserTemplates} user templates vs ${dmTrackingUserTemplates}`;
    } else if (dmTrackingUserTemplates > marketingUserTemplates) {
      recommendation = `USE dm-tracking.db - Has ${dmTrackingUserTemplates} user templates vs ${marketingUserTemplates}`;
    } else {
      recommendation = 'BOTH databases appear to have similar data';
    }

    return NextResponse.json({
      success: true,
      data: results,
      recommendation,
      currently_configured: results.currently_configured,
      action_needed: results.currently_configured !== recommendation.split(' ')[1]?.replace('-', '_').replace('.db', '')
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
