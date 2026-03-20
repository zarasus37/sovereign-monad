/**
 * Coinbase API Client
 */

const API_KEY = '84564d89-c2ad-4662-b030-4fda3825d9e0';
const API_SECRET = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIJ9NVfJ9pMmHjiX8hs4dotV77/w0nIS0I9FhQXbspqWKoAoGCCqGSM49
AwEHoUQDQgAEw5Qo+jGiROGGke2MfkcEQfwOKDoL6bmftVqIyTYWcVrPygNLs0PX
++I6WvxoW92E2RNtAa0sVQm2WxR/z8tQzQ==
-----END EC PRIVATE KEY-----`;

const API_URL = 'https://api.coinbase.com';

async function generateSignature(method, path, body = '') {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = timestamp + method + path + body;
  
  const crypto = await import('crypto');
  const signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(message)
    .digest('hex');
  
  return { timestamp, signature };
}

async function request(method, endpoint, body = null) {
  const path = `/v2/${endpoint}`;
  const bodyStr = body ? JSON.stringify(body) : '';
  
  const { timestamp, signature } = await generateSignature(method, path, bodyStr);
  
  const headers = {
    'CB-ACCESS-KEY': API_KEY,
    'CB-ACCESS-SIGN': signature,
    'CB-ACCESS-TIMESTAMP': timestamp,
    'Content-Type': 'application/json',
  };
  
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: bodyStr || undefined,
  });
  
  return response.json();
}

async function getAccounts() {
  return request('GET', 'accounts');
}

async function getPrices() {
  const response = await fetch(`${API_URL}/v2/prices/ETH-USD/spot`);
  return response.json();
}

// Main
async function main() {
  console.log('🔍 Checking Coinbase accounts...\n');
  
  try {
    const accounts = await getAccounts();
    
    if (accounts.errors) {
      console.log('❌ Error:', JSON.stringify(accounts.errors, null, 2));
      return;
    }
    
    console.log('📊 Accounts:');
    if (accounts.data) {
      for (const account of accounts.data) {
        const balance = parseFloat(account.balance.amount);
        if (balance > 0) {
          console.log(`  💰 ${account.name}: ${account.balance.amount} ${account.balance.currency}`);
        }
      }
    }
    
    console.log('\n📈 ETH Price:');
    const prices = await getPrices();
    console.log(`  $${prices.data.amount} USD`);
    
    // Show total USD value
    console.log('\n💵 Summary:');
    let totalUSD = 0;
    if (accounts.data) {
      for (const account of accounts.data) {
        const bal = parseFloat(account.balance.amount);
        if (bal > 0 && account.balance.currency === 'ETH') {
          const usd = bal * parseFloat((await getPrices()).data.amount);
          console.log(`  ETH: ${bal.toFixed(6)} ≈ $${usd.toFixed(2)}`);
          totalUSD += usd;
        }
      }
    }
    console.log(`  Total: $${totalUSD.toFixed(2)}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
