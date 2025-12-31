/**
 * List all Lists in Attio workspace
 */

import 'dotenv/config';

async function listAttioLists() {
  console.log('📋 Listing Attio Lists...\n');

  if (!process.env.ATTIO_API_KEY) {
    console.error('❌ ATTIO_API_KEY not found');
    process.exit(1);
  }

  const baseUrl = 'https://api.attio.com/v2';
  const apiKey = process.env.ATTIO_API_KEY;

  try {
    // List all lists
    const response = await fetch(`${baseUrl}/lists`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed to fetch lists: ${response.status}`);
      console.error(error);
      process.exit(1);
    }

    const data = await response.json();
    const lists = data.data || [];

    console.log(`Found ${lists.length} lists:\n`);

    for (const list of lists) {
      console.log(`📋 "${list.name || list.id.list_id}"`);
      console.log(`   ID: ${list.id?.list_id || 'N/A'}`);
      console.log(`   Parent Object: ${list.parent_object || 'N/A'}`);
      console.log(`   API Slug: ${list.api_slug || 'N/A'}`);

      // Try to get record count
      try {
        const entriesResponse = await fetch(`${baseUrl}/lists/${list.id.list_id}/entries`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (entriesResponse.ok) {
          const entriesData = await entriesResponse.json();
          console.log(`   Records: ${entriesData.data?.length || 0}`);
        }
      } catch (e) {
        // Ignore
      }

      console.log('');
    }

    console.log('\nTip: Use the api_slug of the list containing your deals');
    console.log('Update the AttioProvider to use the list endpoint instead of the object endpoint');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listAttioLists();
