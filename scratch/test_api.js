const https = require('https');

const postData = JSON.stringify({
    fullName: 'Test User',
    mobile: '9999999999',
    email: 'test@example.com',
    address: '123 Test St',
    serviceType: 'disinfestation',
    category: 'General',
    subject: 'Test Subject',
    description: 'Test Description',
    priority: 'Low',
    contactMethod: 'email',
    declaration: 'true'
});

const options = {
    hostname: 'idealmanagementservices-blond.vercel.app',
    port: 443,
    path: '/api/complaint',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });
    res.on('end', () => {
        console.log('BODY:');
        console.log(body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
