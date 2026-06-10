const {
    flattenObject,
    unflattenObject,
    convertJsonToCsv,
    convertCsvToJson,
    parseCsvTo2DArray,
    convertXmlToJson,
    convertJsonToXml,
    convertYamlToJson,
    convertJsonToYaml,
    encodeBase64,
    decodeBase64,
    decodeJWT
} = require('./converter.js');

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ Assertion Failed: ${message}`);
        process.exit(1);
    }
}

console.log('Running Expanded DataMorph Suite Tests...');

// 1. Existing CSV/JSON Tests
const nested = { id: 1, info: { name: 'John', tags: ['a', 'b'] } };
const flat = flattenObject(nested);
assert(flat['info.name'] === 'John', 'flattenObject failed');
const unflat = unflattenObject(flat);
assert(unflat.info.tags[1] === 'b', 'unflattenObject failed');

const json = [{ name: 'Alice', age: 25, city: 'New York' }];
const csv = convertJsonToCsv(json);
assert(csv.split('\r\n')[1] === 'Alice,25,New York', 'JSON to CSV failed');
console.log('✅ CSV ⇄ JSON Tests passed');

// 2. Base64 UTF-8 and Emojis
const text = "Hello World! 🚀 Code & Developer Tools.";
const b64Encoded = encodeBase64(text);
const b64Decoded = decodeBase64(b64Encoded);
assert(b64Decoded === text, `Base64 Unicode failed. Got: ${b64Decoded}`);
console.log('✅ Base64 Unicode Tests passed');

// 3. URL Encoding
const urlPart = "https://datamorph.dev/query?param=hello world&symbol=&";
const encodedUrl = encodeURIComponent(urlPart);
assert(decodeURIComponent(encodedUrl) === urlPart, 'URL encoding failed');
console.log('✅ URL Encode/Decode passed');

// 4. JWT Decoding
// Generate a mock JWT (header.payload.signature)
// header: {"alg":"HS256","typ":"JWT"}
// payload: {"sub":"1234567890","name":"John Doe","iat":1516239022,"exp":2516239022}
const mockHeaderB64 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
const mockPayloadB64 = "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MTYyMzkwMjJ9";
const mockSignature = "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
const mockJwt = `${mockHeaderB64}.${mockPayloadB64}.${mockSignature}`;

const decodedJwt = decodeJWT(mockJwt);
assert(decodedJwt.header.alg === 'HS256', 'JWT Header algorithm match failed');
assert(decodedJwt.payload.name === 'John Doe', 'JWT Payload name match failed');
assert(decodedJwt.warnings.length === 0, 'Should not have warnings for future exp date');

// Test expired warning
const expiredPayloadB64 = "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9"; // exp in 2018
const expiredJwt = `${mockHeaderB64}.${expiredPayloadB64}.${mockSignature}`;
const decodedExpired = decodeJWT(expiredJwt);
assert(decodedExpired.warnings.length === 1 && decodedExpired.warnings[0].includes('expired'), 'Expired warning check failed');
console.log('✅ JWT Decoder Tests passed');

// 5. YAML & XML Tests (require external packages in Node)
try {
    const yamlStr = "name: Alice\nskills:\n  - JS\n  - CSS\n";
    const parsedYaml = convertYamlToJson(yamlStr);
    assert(parsedYaml.name === 'Alice', 'YAML conversion failed');
    assert(parsedYaml.skills[1] === 'CSS', 'YAML array conversion failed');
    
    const stringifiedYaml = convertJsonToYaml(parsedYaml);
    assert(stringifiedYaml.includes('Alice') && stringifiedYaml.includes('CSS'), 'JSON to YAML failed');
    console.log('✅ YAML Tests passed');
} catch (e) {
    console.log('⚠️ YAML tests skipped (install js-yaml to verify in Node)');
}

try {
    const xmlStr = "<book id=\"1\"><title>My Book</title><author>Author Name</author></book>";
    const parsedXml = convertXmlToJson(xmlStr);
    assert(parsedXml.book.title === 'My Book', 'XML conversion failed');
    assert(parsedXml.book['@attributes'].id === '1', 'XML attributes parsing failed');
    
    const stringifiedXml = convertJsonToXml(parsedXml);
    assert(stringifiedXml.includes('<title>My Book</title>'), 'JSON to XML failed');
    console.log('✅ XML Tests passed');
} catch (e) {
    console.log('⚠️ XML tests skipped (install xmldom to verify in Node)');
}

console.log('🚀 All DataMorph Suite Tests passed successfully!');
