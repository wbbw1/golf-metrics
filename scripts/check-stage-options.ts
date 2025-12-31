/**
 * Check stage attribute configuration
 */

import 'dotenv/config';

async function checkStageOptions() {
  console.log('🔍 Checking Stage Attribute...\n');

  if (!process.env.ATTIO_API_KEY) {
    console.error('❌ ATTIO_API_KEY not found');
    process.exit(1);
  }

  const baseUrl = 'https://api.attio.com/v2';
  const apiKey = process.env.ATTIO_API_KEY;

  try {
    // Get stage attribute details
    console.log('📡 Getting stage attribute configuration...');
    const response = await fetch(`${baseUrl}/objects/deals/attributes/stage`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed: ${response.status}`);
      console.error(error);
      process.exit(1);
    }

    const stageAttr = await response.json();
    console.log('✅ Stage attribute found!\n');
    console.log('Stage Configuration:');
    console.log(JSON.stringify(stageAttr, null, 2));

    // Try to query with more verbose output
    console.log('\n\n📡 Attempting detailed query...');
    const queryResponse = await fetch(`${baseUrl}/objects/deals/records/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {},
        limit: 10,
      }),
    });

    const queryData = await queryResponse.json();
    console.log('\nQuery response:');
    console.log(JSON.stringify(queryData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStageOptions();
