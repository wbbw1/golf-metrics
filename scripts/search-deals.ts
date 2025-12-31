/**
 * Try searching for deals instead of querying
 */

import 'dotenv/config';

async function searchDeals() {
  console.log('🔍 Searching for Deals...\n');

  if (!process.env.ATTIO_API_KEY) {
    console.error('❌ ATTIO_API_KEY not found');
    process.exit(1);
  }

  const baseUrl = 'https://api.attio.com/v2';
  const apiKey = process.env.ATTIO_API_KEY;

  try {
    // Try search endpoint with empty query (should return default results)
    console.log('📡 Using Search endpoint with empty query...');
    const searchResponse = await fetch(`${baseUrl}/objects/records/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "",  // Empty query returns default set
        objects: ["deals"],
        request_as: {
          type: "workspace"
        },
        limit: 25,
      }),
    });

    console.log('Search response status:', searchResponse.status);

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      console.error(`❌ Search failed: ${searchResponse.status}`);
      console.error(error);
    } else {
      const searchData = await searchResponse.json();
      console.log('\n✅ Search successful!');
      console.log(`Results: ${searchData.data?.length || 0}`);

      if (searchData.data && searchData.data.length > 0) {
        console.log('\nFound deals:');
        for (const deal of searchData.data.slice(0, 10)) {
          console.log(`  • ${deal.record_text || deal.id?.record_id}`);
        }

        console.log('\nFull first result:');
        console.log(JSON.stringify(searchData.data[0], null, 2).slice(0, 500));
      } else {
        console.log('\n⚠️ No deals found in search');
      }
    }

    // Also try searching with a known name
    console.log('\n\n📡 Searching for "Airwallex"...');
    const airwallexSearch = await fetch(`${baseUrl}/objects/records/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "Airwallex",
        objects: ["deals"],
        request_as: {
          type: "workspace"
        },
        limit: 10,
      }),
    });

    if (airwallexSearch.ok) {
      const airwallexData = await airwallexSearch.json();
      console.log(`✅ Search for "Airwallex": ${airwallexData.data?.length || 0} results`);

      if (airwallexData.data && airwallexData.data.length > 0) {
        console.log('\nAirwallex deal:');
        console.log(JSON.stringify(airwallexData.data[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

searchDeals();
