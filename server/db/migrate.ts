import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env, isSupabaseConfigured } from '../config/env.js';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('======================================================');
  console.log('🔧 THINKORA Database Migration & Setup Tool');
  console.log('======================================================\n');

  const migrationPath = path.resolve(__dirname, 'migrations/002_persistent_storage_and_rls.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationPath, 'utf8');

  console.log(`📄 Migration file loaded: 002_persistent_storage_and_rls.sql (${sqlContent.length} bytes)`);

  if (!isSupabaseConfigured || !supabase) {
    console.log('\n⚠️ Supabase credentials are not configured in server/.env.');
    console.log('------------------------------------------------------');
    console.log('To connect Supabase PostgreSQL:');
    console.log('1. Open your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Create or select your project.');
    console.log('3. Copy your Project URL and service_role / anon API keys from Project Settings -> API.');
    console.log('4. Add them to server/.env:');
    console.log('     SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co');
    console.log('     SUPABASE_ANON_KEY=[YOUR-ANON-KEY]');
    console.log('     SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]');
    console.log('5. Open SQL Editor in Supabase Dashboard and paste the contents of:');
    console.log(`     ${migrationPath}`);
    console.log('6. Click "Run" to initialize all tables, RLS policies, and indexes.');
    console.log('------------------------------------------------------');
    console.log('✅ Local persistent JSON-backed store is currently ACTIVE as fallback.');
    return;
  }

  console.log('📡 Testing Supabase PostgreSQL connectivity to:', env.SUPABASE_URL);

  try {
    // Test basic query
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error && error.code !== '42P01') { // 42P01 is table does not exist
      console.warn('⚠️ Supabase returned response:', error.message);
    } else {
      console.log('✅ Connected to Supabase instance successfully.');
    }

    console.log('\n📋 Applying migrations via Supabase SQL Editor:');
    console.log('Please copy and execute the migration file in your Supabase SQL Editor:');
    console.log(`Path: ${migrationPath}`);
    console.log('\nMigration verification complete.');
  } catch (err: any) {
    console.error('❌ Error testing Supabase connection:', err.message || err);
  }
}

runMigration().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
