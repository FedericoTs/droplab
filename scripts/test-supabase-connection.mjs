import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://egccqmlhzqiirovstpal.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnY2NxbWxoenFpaXJvdnN0cGFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTYwNDI3MSwiZXhwIjoyMDc3MTgwMjcxfQ.yW40hTK9UClLekvw4NlggpiUKH4hME4YUuDfL8OWlyk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', supabaseUrl);

  // Test 1: Check if design_templates table exists
  console.log('\n📋 Test 1: Checking design_templates table...');
  const { data: tables, error: tablesError } = await supabase
    .from('design_templates')
    .select('id')
    .limit(1);

  if (tablesError) {
    console.error('❌ Table check failed:', tablesError.message);
    console.error('   Code:', tablesError.code);
    console.error('   Details:', tablesError.details);
  } else {
    console.log('✅ Table exists! Found', tables?.length || 0, 'rows');
  }

  // Test 2: Try to insert a test template
  console.log('\n📝 Test 2: Trying to insert test template...');
  const testTemplate = {
    organization_id: '00000000-0000-0000-0000-000000000000',
    created_by: '00000000-0000-0000-0000-000000000000',
    name: 'Test Template',
    canvas_json: { version: '1.0', objects: [] },
    canvas_width: 1800,
    canvas_height: 1200,
    format_type: 'postcard_4x6',
    format_width_inches: 6.0,
    format_height_inches: 4.0,
  };

  const { data: insertResult, error: insertError } = await supabase
    .from('design_templates')
    .insert(testTemplate)
    .select();

  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
    console.error('   Code:', insertError.code);
    console.error('   Hint:', insertError.hint);
  } else {
    console.log('✅ Insert successful!');
    console.log('   Template ID:', insertResult[0]?.id);

    // Clean up test data
    if (insertResult[0]?.id) {
      await supabase
        .from('design_templates')
        .delete()
        .eq('id', insertResult[0].id);
      console.log('🧹 Cleaned up test template');
    }
  }
}

testConnection().catch(console.error);
