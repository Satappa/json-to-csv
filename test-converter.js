const {
    flattenObject,
    unflattenObject,
    convertJsonToCsv,
    convertCsvToJson,
    parseCsvTo2DArray
} = require('./converter.js');

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ Assertion Failed: ${message}`);
        process.exit(1);
    }
}

console.log('Running DataMorph Converter Tests...');

// 1. Test flattenObject
const nested = {
    id: 1,
    info: {
        name: 'John',
        tags: ['a', 'b'],
        details: {
            age: 30
        }
    }
};
const flat = flattenObject(nested);
assert(flat['id'] === 1, 'id should be 1');
assert(flat['info.name'] === 'John', 'info.name should be John');
assert(flat['info.tags.0'] === 'a', 'info.tags.0 should be a');
assert(flat['info.details.age'] === 30, 'info.details.age should be 30');
console.log('✅ flattenObject passed');

// 2. Test unflattenObject
const unflattened = unflattenObject(flat);
assert(unflattened.id === 1, 'unflattened.id should be 1');
assert(unflattened.info.name === 'John', 'unflattened.info.name should be John');
assert(Array.isArray(unflattened.info.tags), 'unflattened.info.tags should be an array');
assert(unflattened.info.tags[1] === 'b', 'unflattened.info.tags[1] should be b');
assert(unflattened.info.details.age === 30, 'unflattened.info.details.age should be 30');
console.log('✅ unflattenObject passed');

// 3. Test convertJsonToCsv
const json = [
    { name: 'Alice', age: 25, city: 'New York' },
    { name: 'Bob', age: 30, city: 'San Francisco, CA' } // Comma in value
];
const csv = convertJsonToCsv(json);
const lines = csv.split('\r\n');
assert(lines[0] === 'name,age,city', 'Header should be name,age,city');
assert(lines[1] === 'Alice,25,New York', `Row 1 mismatch: ${lines[1]}`);
assert(lines[2] === 'Bob,30,"San Francisco, CA"', `Row 2 mismatch: ${lines[2]}`);
console.log('✅ convertJsonToCsv (basic) passed');

// 4. Test parseCsvTo2DArray
const complexCsv = 'name,notes\r\nAlice,"Likes ""nested"" quotes"\r\nBob,"Line\r\nbreak"';
const parsed2D = parseCsvTo2DArray(complexCsv);
assert(parsed2D.length === 3, `Length should be 3, got ${parsed2D.length}`);
assert(parsed2D[0][0] === 'name', 'Header 1 name');
assert(parsed2D[1][1] === 'Likes "nested" quotes', `Parsed quotes: ${parsed2D[1][1]}`);
assert(parsed2D[2][1] === 'Line\r\nbreak', `Parsed newline: ${JSON.stringify(parsed2D[2][1])}`);
console.log('✅ parseCsvTo2DArray (RFC 4180) passed');

// 5. Test convertCsvToJson
const csvInput = 'name,details.age,details.gender\r\nAlice,25,F\r\nBob,30,M';
const convertedJson = convertCsvToJson(csvInput, { unflatten: true, smartTypes: true });
assert(convertedJson.length === 2, 'Should convert 2 objects');
assert(convertedJson[0].name === 'Alice', 'First object name should be Alice');
assert(convertedJson[0].details.age === 25, `First details.age should be number 25, got ${typeof convertedJson[0].details.age}`);
assert(convertedJson[1].details.gender === 'M', 'Second gender should be M');
console.log('✅ convertCsvToJson (nested + types) passed');

console.log('🚀 All tests passed successfully!');
