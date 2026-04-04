/**
 * SA ERP - Update Demo User Passwords to match Login.tsx quick demo buttons
 * 
 * Usage: node --env-file=.env scripts/fix-passwords.js
 */
const sdk = require('node-appwrite');

const ENDPOINT = process.env.APPWRITE_ENDPOINT || '';
const PROJECT  = process.env.APPWRITE_PROJECT_ID || '';
const API_KEY  = process.env.APPWRITE_API_KEY || '';

const client = new sdk.Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT)
  .setKey(API_KEY);

const users = new sdk.Users(client);

async function main() {
  // List all users and update passwords to match Login.tsx quick demo buttons
  const result = await users.list();
  const passwordMap = {
    'admin@sa-erp.local': 'admin123',
    'ceo@sa-erp.local': 'ceo12345',
    'sales_mgr@sa-erp.local': 'sales123',
    'accountant@sa-erp.local': 'acc12345',
    'hr_mgr@sa-erp.local': 'hrm12345',
    'viewer@sa-erp.local': 'view1234',
  };

  for (const user of result.users) {
    const newPass = passwordMap[user.email];
    if (newPass) {
      try {
        await users.updatePassword(user.$id, newPass);
        console.log(`✅ Updated: ${user.email} → ${newPass}`);
      } catch (e) {
        console.error(`❌ ${user.email}: ${e.message}`);
      }
    }
  }
  console.log('\nDone!');
}

main().catch(console.error);
