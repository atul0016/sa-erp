/**
 * SA ERP - Create Demo Users in Appwrite Auth
 * Run once after setup-appwrite.js
 * 
 * Usage: node --env-file=.env scripts/seed-users.js
 */
const sdk = require('node-appwrite');

const ENDPOINT = process.env.APPWRITE_ENDPOINT || '';
const PROJECT  = process.env.APPWRITE_PROJECT_ID || '';
const API_KEY  = process.env.APPWRITE_API_KEY || '';

if (!PROJECT || !API_KEY) {
  console.error('Set APPWRITE_PROJECT_ID and APPWRITE_API_KEY first.');
  process.exit(1);
}

const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT)
  .setKey(API_KEY);

const users = new sdk.Users(client);

const DEMO_USERS = [
  {
    name: 'Admin User',
    email: 'admin@sa-erp.local',
    password: 'admin123',
    prefs: {
      tenant_id: 'tenant_001',
      tenant_name: 'SA Enterprises Pvt. Ltd.',
      tenant_code: 'SA001',
      first_name: 'Admin',
      last_name: 'User',
      roles: '["admin"]',
    },
  },
  {
    name: 'CEO User',
    email: 'ceo@sa-erp.local',
    password: 'ceo123!safe',
    prefs: {
      tenant_id: 'tenant_001',
      tenant_name: 'SA Enterprises Pvt. Ltd.',
      tenant_code: 'SA001',
      first_name: 'Rajesh',
      last_name: 'Sharma',
      roles: '["ceo","admin"]',
    },
  },
  {
    name: 'Sales Manager',
    email: 'sales_mgr@sa-erp.local',
    password: 'sales123!safe',
    prefs: {
      tenant_id: 'tenant_001',
      tenant_name: 'SA Enterprises Pvt. Ltd.',
      tenant_code: 'SA001',
      first_name: 'Priya',
      last_name: 'Patel',
      roles: '["sales_manager"]',
    },
  },
  {
    name: 'Accountant User',
    email: 'accountant@sa-erp.local',
    password: 'acc123!safe',
    prefs: {
      tenant_id: 'tenant_001',
      tenant_name: 'SA Enterprises Pvt. Ltd.',
      tenant_code: 'SA001',
      first_name: 'Vinod',
      last_name: 'Mehta',
      roles: '["accountant"]',
    },
  },
  {
    name: 'HR Manager',
    email: 'hr_mgr@sa-erp.local',
    password: 'hr123!safe',
    prefs: {
      tenant_id: 'tenant_001',
      tenant_name: 'SA Enterprises Pvt. Ltd.',
      tenant_code: 'SA001',
      first_name: 'Anita',
      last_name: 'Kumar',
      roles: '["hr_manager"]',
    },
  },
  {
    name: 'Viewer User',
    email: 'viewer@sa-erp.local',
    password: 'view123!safe',
    prefs: {
      tenant_id: 'tenant_001',
      tenant_name: 'SA Enterprises Pvt. Ltd.',
      tenant_code: 'SA001',
      first_name: 'Ravi',
      last_name: 'Singh',
      roles: '["viewer"]',
    },
  },
];

async function main() {
  console.log('👥 Creating demo users in Appwrite Auth...\n');

  for (const u of DEMO_USERS) {
    try {
      const created = await users.create(
        sdk.ID.unique(),
        u.email,
        undefined,      // phone
        u.password,
        u.name
      );
      // Set user preferences (roles, tenant info)
      await users.updatePrefs(created.$id, u.prefs);
      console.log(`  ✅ ${u.name} (${u.email})`);
    } catch (e) {
      if (e.code === 409) {
        console.log(`  ⏭️  ${u.name} (${u.email}) — already exists`);
      } else {
        console.error(`  ❌ ${u.name}: ${e.message}`);
      }
    }
  }

  console.log('\n✅ Demo users ready!');
  console.log('\n📝 Login credentials:');
  console.log('   admin / admin123');
  console.log('   ceo / ceo123!safe');
  console.log('   sales_mgr / sales123!safe');
  console.log('   accountant / acc123!safe');
  console.log('   hr_mgr / hr123!safe');
  console.log('   viewer / view123!safe');
}

main().catch(console.error);
