/**
 * Get workspace information
 */

import 'dotenv/config';

async function getWorkspaceInfo() {
  console.log('🔍 Getting Workspace Info...\n');

  if (!process.env.ATTIO_API_KEY) {
    console.error('❌ ATTIO_API_KEY not found');
    process.exit(1);
  }

  const baseUrl = 'https://api.attio.com/v2';
  const apiKey = process.env.ATTIO_API_KEY;

  try {
    // Try to get self/workspace info
    console.log('📡 Trying /self endpoint...');
    let response = await fetch(`${baseUrl}/self`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Self endpoint response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Self endpoint: ${response.status}`);
    }

    console.log('\n📡 Trying /workspaces endpoint...');
    response = await fetch(`${baseUrl}/workspaces`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Workspaces endpoint response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Workspaces endpoint: ${response.status}`);
    }

    console.log('\n📡 Trying /objects endpoint...');
    response = await fetch(`${baseUrl}/objects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Objects endpoint response:');
      console.log(JSON.stringify(data, null, 2).slice(0, 1000));
    } else {
      console.log(`❌ Objects endpoint: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

getWorkspaceInfo();
