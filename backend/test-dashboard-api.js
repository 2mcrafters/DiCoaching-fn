/**
 * Test dashboard statistics API endpoint
 * Run with: node backend/test-dashboard-api.js
 */

const BASE_URL = 'http://localhost:5000/api';

// Get JWT token from login
async function login() {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@dictionnaire.fr",
        password: "admin123", // Update with actual password
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Login failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    // Support both { token } and { data: { token } } response shapes
    const token =
      (data && (data.token || (data.data && data.data.token))) || null;
    if (!token) {
      throw new Error("No token found in login response");
    }
    return token;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    throw error;
  }
}

// Test dashboard stats endpoint
async function testDashboardStats(token) {
  console.log('\n📊 Testing Dashboard Stats Endpoint...\n');

  try {
    const response = await fetch(`${BASE_URL}/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Dashboard Stats Response:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n📈 Summary:');
    console.log(`   User ID: ${data.user?.id}`);
    console.log(`   User Role: ${data.user?.role}`);
    console.log(`   Total Terms: ${data.terms?.total || 0}`);
    console.log(`   Published: ${data.terms?.byStatus?.published || 0}`);
    console.log(`   Draft: ${data.terms?.byStatus?.draft || 0}`);
    console.log(`   Pending: ${data.terms?.byStatus?.pending || 0}`);
    console.log(`   Rejected: ${data.terms?.byStatus?.rejected || 0}`);
    console.log(`   Likes Received: ${data.likes?.received || 0}`);
    console.log(`   Likes Given: ${data.likes?.given || 0}`);
    console.log(`   Comments Made: ${data.comments?.made || 0}`);
    console.log(`   Comments Received: ${data.comments?.received || 0}`);
    console.log(`   Contribution Score: ${data.contributionScore || 0}`);
    
    if (data.ranking) {
      console.log(`   Ranking: #${data.ranking.position} of ${data.ranking.totalAuthors} authors`);
    }
    
    if (data.global) {
      console.log('\n🌍 Global Stats (Admin Only):');
      console.log(`   Total Users: ${data.global.totalUsers}`);
      console.log(`   Total Terms: ${data.global.totalTerms}`);
      console.log(`   Total Likes: ${data.global.totalLikes}`);
      console.log(`   Total Comments: ${data.global.totalComments}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Dashboard Stats Test Failed:', error.message);
    return false;
  }
}

// Test chart data endpoint
async function testChartData(token) {
  console.log('\n📉 Testing Chart Data Endpoint...\n');

  try {
    const response = await fetch(`${BASE_URL}/dashboard/chart-data?period=30`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ Chart Data Response:');
    console.log(`   Period: ${data.period} days`);
    console.log(`   Terms Data Points: ${data.termsOverTime?.length || 0}`);
    console.log(`   Likes Data Points: ${data.likesOverTime?.length || 0}`);
    console.log(`   Comments Data Points: ${data.commentsOverTime?.length || 0}`);
    
    if (data.termsOverTime && data.termsOverTime.length > 0) {
      console.log('\n   Sample Terms Data (last 5 days):');
      data.termsOverTime.slice(-5).forEach(point => {
        console.log(`     ${point.date}: ${point.count} terms`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Chart Data Test Failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Dashboard API Tests\n');
  console.log('='.repeat(50));

  try {
    // Login first
    console.log('\n🔐 Logging in...');
    const token = await login();
    console.log('✅ Login successful, token received');

    // Test dashboard stats
    const statsResult = await testDashboardStats(token);
    
    // Test chart data
    const chartResult = await testChartData(token);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\n📋 Test Summary:');
    console.log(`   Dashboard Stats: ${statsResult ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Chart Data: ${chartResult ? '✅ PASS' : '❌ FAIL'}`);
    
    if (statsResult && chartResult) {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
