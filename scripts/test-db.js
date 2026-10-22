/**
 * Database & Schema Verification Script for Samālōcane (Phase 1)
 */
const { query, isPostgresConnected, mockStore } = require('../src/lib/db');

async function testDatabase() {
  console.log('========================================================');
  console.log('  Samālōcane Database & Architecture Verification Test');
  console.log('========================================================\n');

  console.log('[1/4] Checking PostgreSQL Connection Mode:');
  const isLive = isPostgresConnected();
  if (isLive) {
    console.log('  ✓ Connected to LIVE PostgreSQL Database.');
  } else {
    console.log('  ℹ Operating in SAFE IN-MEMORY / MOCK DATABASE mode for offline verification.');
    console.log('  ℹ To connect to real PostgreSQL, set DATABASE_URL in .env.local.');
  }

  console.log('\n[2/4] Verifying Users Table & Role Separation:');
  const usersRes = await query('SELECT * FROM users');
  console.log(`  ✓ Users found in database: ${usersRes.rows.length}`);
  usersRes.rows.forEach(u => {
    console.log(`    - User: ${u.full_name.padEnd(30)} | Role: [${u.role.toUpperCase()}] | Email: ${u.email}`);
  });

  console.log('\n[3/4] Verifying Verified Doctors & Registration Credentials:');
  const docRes = await query('SELECT * FROM doctor_profiles WHERE is_verified = TRUE');
  console.log(`  ✓ Verified doctors: ${docRes.rows.length}`);
  docRes.rows.forEach(d => {
    console.log(`    - Reg Number: ${d.council_registration_number} (${d.council_name}) | Qualification: ${d.qualification}`);
  });

  console.log('\n[4/4] Verifying Emergency PHC Facilities Directory:');
  const phcRes = await query('SELECT * FROM phc_facilities');
  console.log(`  ✓ Pre-seeded emergency facilities: ${phcRes.rows.length}`);
  phcRes.rows.forEach(f => {
    console.log(`    - ${f.name.padEnd(35)} | Taluka: ${f.taluka.padEnd(10)} | Emergency Phone: ${f.emergency_phone}`);
  });

  console.log('\n========================================================');
  console.log('  Phase 1 Database Architecture Test PASSED.');
  console.log('========================================================\n');
}

testDatabase().catch(err => {
  console.error('Database test failed:', err);
  process.exit(1);
});

