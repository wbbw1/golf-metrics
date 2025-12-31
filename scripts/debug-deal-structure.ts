/**
 * Debug deal structure to see raw data
 */

import 'dotenv/config';

async function debugDealStructure() {
  console.log('🔍 Debugging Deal Structure...\n');

  if (!process.env.ATTIO_API_KEY) {
    console.error('❌ ATTIO_API_KEY not found');
    process.exit(1);
  }

  const baseUrl = 'https://api.attio.com/v2';
  const apiKey = process.env.ATTIO_API_KEY;

  try {
    // Search for Airwallex
    const searchResponse = await fetch(`${baseUrl}/objects/records/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "Airwallex",
        objects: ["deals"],
        request_as: { type: "workspace" },
        limit: 1,
      }),
    });

    const searchData = await searchResponse.json();
    const airwallex = searchData.data[0];
    const recordId = airwallex.id.record_id;

    console.log(`Found Airwallex: ${recordId}\n`);

    // Get full details
    const detailResponse = await fetch(`${baseUrl}/objects/deals/records/${recordId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const detailData = await detailResponse.json();

    console.log('Full raw response:');
    console.log(JSON.stringify(detailData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugDealStructure();
