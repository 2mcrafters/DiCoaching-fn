// Quick test script to verify comments endpoint
import http from 'http';

const termId = 2; // From your DB screenshot
const url = `http://localhost:5000/api/terms/${termId}/comments`;

console.log(`Testing: ${url}\n`);

const req = http.get(url, (res) => {
  let data = '';
  
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse body:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.status === 'success' && Array.isArray(parsed.data)) {
        console.log(`\n✅ SUCCESS: Got ${parsed.data.length} comments`);
        if (parsed.data.length > 0) {
          console.log('First comment:', {
            id: parsed.data[0].id,
            termId: parsed.data[0].termId,
            content: parsed.data[0].content?.substring(0, 50),
            parentId: parsed.data[0].parentId,
            authorName: parsed.data[0].authorName
          });
        }
      } else {
        console.log('\n❌ ERROR response received');
      }
    } catch (e) {
      console.log('Raw response:', data);
      console.log('\n❌ Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`\n❌ Request failed: ${e.message}`);
  console.error('Make sure backend is running on port 5000');
});

req.setTimeout(5000, () => {
  console.error('\n❌ Request timeout');
  req.destroy();
});
