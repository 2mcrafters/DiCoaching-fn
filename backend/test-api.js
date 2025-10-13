// Test all backend API endpoints
async function testEndpoints() {
  const BASE_URL = 'http://localhost:5000';
  
  console.log('🧪 Testing Backend API Endpoints...\n');
  
  const tests = [
    { name: 'Health Check', url: '/api/test-db', method: 'GET' },
    { name: 'Get Terms', url: '/api/terms?limit=2', method: 'GET' },
    { name: 'Get Categories', url: '/api/categories', method: 'GET' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}${test.url}`, {
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${test.name}: ${response.status} - ${data.status || 'OK'}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}: ${response.status} ${response.statusText}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log('='.repeat(50));
}

testEndpoints();
