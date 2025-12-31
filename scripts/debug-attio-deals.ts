/**
 * Debug Attio Deals Query
 */

import 'dotenv/config';

async function debugAttioDeals() {
  console.log('🔍 Debugging Attio Deals Query...\n');

  if (!process.env.ATTIO_API_KEY) {
    console.error('❌ ATTIO_API_KEY not found');
    process.exit(1);
  }

  const baseUrl = 'https://api.attio.com/v2';
  const apiKey = process.env.ATTIO_API_KEY;

  try {
    // Query deals object
    console.log('📡 Querying deals object...\n');

    const response = await fetch(`${baseUrl}/objects/deals/records/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {},
        limit: 100,
        offset: 0,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    const responseText = await response.text();
    console.log('\nRaw response:\n', responseText.slice(0, 1000));

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n✅ Query successful!');
      console.log(`Records returned: ${data.data?.length || 0}`);

      if (data.data && data.data.length > 0) {
        const sample = data.data[0];
        console.log('\nSample record structure:');
        console.log(JSON.stringify(sample, null, 2).slice(0, 500));
      } else {
        console.log('\n⚠️  No records returned');
        console.log('Full response:', JSON.stringify(data, null, 2).slice(0, 1000));
      }
    } else {
      console.error('\n❌ Query failed');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugAttioDeals();
