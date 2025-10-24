import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET() {
  try {
    const results: any = {};

    // Check current database (dm-tracking.db)
    const currentDbPath = path.join(process.cwd(), 'dm-tracking.db');
    const currentDb = new Database(currentDbPath);

    results.current_db = {
      path: 'dm-tracking.db',
      campaign_templates: currentDb.prepare('SELECT COUNT(*) as count FROM campaign_templates').get(),
      dm_templates: currentDb.prepare('SELECT COUNT(*) as count FROM dm_templates').get(),
      dm_templates_with_preview: currentDb.prepare('SELECT COUNT(*) as count FROM dm_templates WHERE preview_image IS NOT NULL').get(),
      campaign_landing_pages: currentDb.prepare('SELECT COUNT(*) as count FROM campaign_landing_pages').get(),
      campaigns: currentDb.prepare('SELECT COUNT(*) as count FROM campaigns').get(),
      recipients: currentDb.prepare('SELECT COUNT(*) as count FROM recipients').get(),
    };

    // Get list of DM templates in current db
    const currentDmTemplates = currentDb.prepare(`
      SELECT id, campaign_template_id, name,
             CASE WHEN preview_image IS NULL THEN 0 ELSE 1 END as has_preview
      FROM dm_templates
      LIMIT 20
    `).all();
    results.current_dm_templates = currentDmTemplates;

    currentDb.close();

    // Check old database (marketing.db)
    try {
      const oldDbPath = path.join(process.cwd(), 'marketing.db');
      const oldDb = new Database(oldDbPath);

      results.old_db = {
        path: 'marketing.db',
        campaign_templates: oldDb.prepare('SELECT COUNT(*) as count FROM campaign_templates').get(),
        dm_templates: oldDb.prepare('SELECT COUNT(*) as count FROM dm_templates').get(),
        dm_templates_with_preview: oldDb.prepare('SELECT COUNT(*) as count FROM dm_templates WHERE preview_image IS NOT NULL').get(),
        campaign_landing_pages: oldDb.prepare('SELECT COUNT(*) as count FROM campaign_landing_pages').get(),
        campaigns: oldDb.prepare('SELECT COUNT(*) as count FROM campaigns').get(),
        recipients: oldDb.prepare('SELECT COUNT(*) as count FROM recipients').get(),
      };

      // Get list of DM templates in old db
      const oldDmTemplates = oldDb.prepare(`
        SELECT id, campaign_template_id, name,
               CASE WHEN preview_image IS NULL THEN 0 ELSE 1 END as has_preview
        FROM dm_templates
        LIMIT 20
      `).all();
      results.old_dm_templates = oldDmTemplates;

      oldDb.close();
    } catch (error: any) {
      results.old_db_error = error.message;
    }

    // Check for template WPiJZYn26A-0OJEH specifically
    const currentDbCheck = new Database(currentDbPath);
    results.template_WPiJZYn26A = {
      in_current_db: currentDbCheck.prepare('SELECT COUNT(*) as count FROM dm_templates WHERE campaign_template_id = ?').get('WPiJZYn26A-0OJEH'),
    };
    currentDbCheck.close();

    try {
      const oldDbPath = path.join(process.cwd(), 'marketing.db');
      const oldDbCheck = new Database(oldDbPath);
      results.template_WPiJZYn26A.in_old_db = oldDbCheck.prepare('SELECT COUNT(*) as count FROM dm_templates WHERE campaign_template_id = ?').get('WPiJZYn26A-0OJEH');
      oldDbCheck.close();
    } catch (error) {
      // Ignore
    }

    return NextResponse.json({
      success: true,
      data: results,
      recommendation: results.old_db &&
                      (results.old_db.dm_templates?.count || 0) > (results.current_db.dm_templates?.count || 0)
                      ? 'Switch to marketing.db - it has more data!'
                      : 'Current database (dm-tracking.db) is up to date'
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
