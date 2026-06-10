/**
 * Utility functions for JSON <-> CSV and other Data Conversions
 */

/**
 * Flattens a nested object into a single-level object with dot-notated keys.
 * Example: { user: { name: "Alice" } } -> { "user.name": "Alice" }
 */
function flattenObject(obj, prefix = '', res = {}) {
    if (obj === null || obj === undefined) {
        res[prefix] = null;
        return res;
    }

    if (typeof obj !== 'object') {
        res[prefix] = obj;
        return res;
    }

    if (Array.isArray(obj)) {
        if (obj.length === 0) {
            res[prefix] = [];
        } else {
            obj.forEach((val, idx) => {
                const key = prefix ? `${prefix}.${idx}` : `${idx}`;
                if (typeof val === 'object' && val !== null) {
                    flattenObject(val, key, res);
                } else {
                    res[key] = val;
                }
            });
        }
        return res;
    }

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const propName = prefix ? `${prefix}.${key}` : key;
            const val = obj[key];
            if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
                flattenObject(val, propName, res);
            } else {
                res[propName] = val;
            }
        }
    }

    return res;
}

/**
 * Reconstructs a nested object from a flat object with dot-notated keys.
 * Example: { "user.name": "Alice" } -> { user: { name: "Alice" } }
 */
function unflattenObject(flatObj) {
    const result = {};
    for (const key in flatObj) {
        if (Object.prototype.hasOwnProperty.call(flatObj, key)) {
            const parts = key.split('.');
            let current = result;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isNextNumber = i < parts.length - 1 && !isNaN(Number(parts[i + 1]));
                
                if (i === parts.length - 1) {
                    current[part] = flatObj[key];
                } else {
                    if (!(part in current)) {
                        current[part] = isNextNumber ? [] : {};
                    }
                    current = current[part];
                }
            }
        }
    }
    return result;
}

/**
 * Escapes a cell value for CSV formatting according to RFC 4180.
 */
function escapeCSVCell(val, delimiter = ',') {
    if (val === null || val === undefined) {
        return '';
    }
    let str = String(val);
    const needsQuoting = str.includes('"') || str.includes(delimiter) || str.includes('\n') || str.includes('\r');
    if (needsQuoting) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
    }
    return str;
}

/**
 * Converts JSON array of objects to a CSV string.
 */
function convertJsonToCsv(jsonData, options = {}) {
    const delimiter = options.delimiter || ',';
    const flatten = options.flatten !== false;
    const includeHeaders = options.includeHeaders !== false;

    let data = jsonData;
    if (typeof data === 'string') {
        data = JSON.parse(data);
    }

    if (!Array.isArray(data)) {
        data = [data];
    }

    if (data.length === 0) {
        return '';
    }

    const processedData = data.map(item => {
        if (typeof item !== 'object' || item === null) {
            return { value: item };
        }
        return flatten ? flattenObject(item) : item;
    });

    const headerSet = new Set();
    processedData.forEach(item => {
        Object.keys(item).forEach(k => headerSet.add(k));
    });
    const headers = Array.from(headerSet);

    const rows = [];

    if (includeHeaders) {
        rows.push(headers.map(h => escapeCSVCell(h, delimiter)).join(delimiter));
    }

    processedData.forEach(item => {
        const row = headers.map(h => {
            const val = item[h];
            if (typeof val === 'object' && val !== null) {
                return escapeCSVCell(JSON.stringify(val), delimiter);
            }
            return escapeCSVCell(val, delimiter);
        });
        rows.push(row.join(delimiter));
    });

    return rows.join('\r\n');
}

/**
 * Parses a CSV string into an array of arrays (rows).
 * Compliant with RFC 4180.
 */
function parseCsvTo2DArray(csvText, delimiter = ',') {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    const len = csvText.length;
    for (let i = 0; i < len; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (insideQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentField += '"';
                    i++;
                } else {
                    insideQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                insideQuotes = true;
            } else if (char === delimiter) {
                currentRow.push(currentField);
                currentField = '';
            } else if (char === '\r' && nextChar === '\n') {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
                i++;
            } else if (char === '\n') {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }

    if (currentField !== '' || currentRow.length > 0 || csvText.endsWith(delimiter)) {
        currentRow.push(currentField);
    }
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    return rows;
}

function parseSmartType(strVal) {
    const trimmed = strVal.trim();
    if (trimmed === '') return '';
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    if (trimmed.toLowerCase() === 'null') return null;
    
    if (!isNaN(Number(trimmed)) && trimmed !== '') {
        if (trimmed.length > 1 && trimmed.startsWith('0') && !trimmed.includes('.')) {
            return trimmed;
        }
        return Number(trimmed);
    }
    return strVal;
}

/**
 * Converts a CSV string to a JSON string or object array.
 */
function convertCsvToJson(csvText, options = {}) {
    const delimiter = options.delimiter || ',';
    const smartTypes = options.smartTypes !== false;
    const unflatten = options.unflatten === true;

    if (!csvText || csvText.trim() === '') {
        return [];
    }

    const rows = parseCsvTo2DArray(csvText, delimiter);
    if (rows.length === 0) {
        return [];
    }

    const headers = rows[0].map(h => h.trim());
    const dataRows = rows.slice(1);
    
    const result = [];

    dataRows.forEach(row => {
        if (row.length === 0 || (row.length === 1 && row[0] === '')) {
            return;
        }

        const obj = {};
        headers.forEach((header, idx) => {
            const rawVal = idx < row.length ? row[idx] : '';
            const typedVal = smartTypes ? parseSmartType(rawVal) : rawVal;
            
            if (header) {
                obj[header] = typedVal;
            }
        });

        if (unflatten) {
            result.push(unflattenObject(obj));
        } else {
            result.push(obj);
        }
    });

    return result;
}

// =================================================================
// NEW: XML ⇄ JSON Conversion
// =================================================================

/**
 * Recursively converts an XML Node to a JavaScript Object.
 */
function xmlNodeToJson(node) {
    // If text node, return text
    if (node.nodeType === 3 || node.nodeType === 4) {
        return node.nodeValue;
    }
    
    // Check if children are only text
    if (node.childNodes.length === 1 && (node.childNodes[0].nodeType === 3 || node.childNodes[0].nodeType === 4)) {
        return node.childNodes[0].nodeValue;
    }

    const obj = {};
    
    // Parse Attributes
    if (node.attributes && node.attributes.length > 0) {
        obj["@attributes"] = {};
        for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            obj["@attributes"][attr.name] = attr.value;
        }
    }

    // Parse Child Nodes
    for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        
        // Skip comment or whitespace nodes
        if (child.nodeType === 8 || (child.nodeType === 3 && child.nodeValue.trim() === '')) {
            continue;
        }

        const childName = child.nodeName;
        const childVal = xmlNodeToJson(child);

        if (obj[childName] !== undefined) {
            // Already exists, convert to array to handle duplicates
            if (!Array.isArray(obj[childName])) {
                obj[childName] = [obj[childName]];
            }
            obj[childName].push(childVal);
        } else {
            obj[childName] = childVal;
        }
    }

    return obj;
}

/**
 * Converts XML string to JSON string/object.
 */
function convertXmlToJson(xmlText) {
    if (!xmlText || xmlText.trim() === '') {
        return {};
    }
    
    let parser;
    if (typeof window !== 'undefined' && window.DOMParser) {
        parser = new DOMParser();
    } else {
        // Node compatibility (requires xmldom package, but let's support browsers primarily)
        const DOMParserNode = require('xmldom').DOMParser;
        parser = new DOMParserNode();
    }

    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    // Check for parsing errors
    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError.length > 0) {
        throw new Error(parserError[0].textContent || "XML parsing error");
    }

    const rootNode = xmlDoc.documentElement;
    const result = {};
    result[rootNode.nodeName] = xmlNodeToJson(rootNode);
    return result;
}

/**
 * Recursively serializes a JavaScript Object to XML string.
 */
function jsonValueToXml(value, tagName) {
    if (value === null || value === undefined) {
        return `<${tagName}/>`;
    }

    if (Array.isArray(value)) {
        return value.map(item => jsonValueToXml(item, tagName)).join('');
    }

    if (typeof value === 'object') {
        let attributesStr = '';
        let childrenStr = '';
        
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                if (key === '@attributes') {
                    // Serialize Attributes
                    for (const attrName in value[key]) {
                        attributesStr += ` ${attrName}="${String(value[key][attrName]).replace(/"/g, '&quot;')}"`;
                    }
                } else {
                    childrenStr += jsonValueToXml(value[key], key);
                }
            }
        }
        
        return `<${tagName}${attributesStr}>${childrenStr}</${tagName}>`;
    }

    // Escape basic XML XML entities
    const textVal = String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
        
    return `<${tagName}>${textVal}</${tagName}>`;
}

/**
 * Converts JSON to XML string.
 */
function convertJsonToXml(jsonData) {
    let obj = jsonData;
    if (typeof obj === 'string') {
        obj = JSON.parse(obj);
    }

    // XML needs exactly one root element. If array, wrap it.
    if (Array.isArray(obj)) {
        obj = { root: { item: obj } };
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) {
        return '<?xml version="1.0" encoding="UTF-8"?>\n<root/>';
    }

    // If there are multiple keys at the top level, wrap them in a root element
    let xmlBody = '';
    if (keys.length > 1) {
        xmlBody = jsonValueToXml(obj, 'root');
    } else {
        xmlBody = jsonValueToXml(obj[keys[0]], keys[0]);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlBody}`;
}

// =================================================================
// NEW: YAML ⇄ JSON Conversion
// =================================================================

/**
 * Converts YAML string to JSON object (Requires js-yaml on window, or node require).
 */
function convertYamlToJson(yamlText) {
    if (typeof jsyaml !== 'undefined') {
        return jsyaml.load(yamlText);
    } else if (typeof require !== 'undefined') {
        const yaml = require('js-yaml');
        return yaml.load(yamlText);
    } else {
        throw new Error('YAML Parser (js-yaml) not loaded.');
    }
}

/**
 * Converts JSON to YAML string.
 */
function convertJsonToYaml(jsonData) {
    let obj = jsonData;
    if (typeof obj === 'string') {
        obj = JSON.parse(obj);
    }
    
    if (typeof jsyaml !== 'undefined') {
        return jsyaml.dump(obj, { indent: 2, lineWidth: -1 });
    } else if (typeof require !== 'undefined') {
        const yaml = require('js-yaml');
        return yaml.dump(obj, { indent: 2, lineWidth: -1 });
    } else {
        throw new Error('YAML Exporter (js-yaml) not loaded.');
    }
}

// =================================================================
// NEW: Encoding / Decoding (Base64, URL, JWT)
// =================================================================

/**
 * Safely encodes UTF-8 string to Base64 (supporting emojis and accents).
 */
function encodeBase64(str) {
    if (!str) return '';
    try {
        // Handle UTF-8 encoding safely in browsers using URI encoding
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
            return String.fromCharCode(parseInt(p1, 16));
        }));
    } catch (e) {
        throw new Error("Base64 Encoding error: " + e.message);
    }
}

/**
 * Safely decodes Base64 string to UTF-8.
 */
function decodeBase64(b64) {
    if (!b64) return '';
    try {
        return decodeURIComponent(atob(b64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        throw new Error("Invalid Base64 character sequence: " + e.message);
    }
}

/**
 * Decodes JWT Header, Payload, and Signature components.
 */
function decodeJWT(jwtToken) {
    const trimmed = jwtToken.trim();
    const parts = trimmed.split('.');
    
    if (parts.length !== 3) {
        throw new Error("Invalid JWT token: Must contain 3 dot-separated segments (header, payload, signature).");
    }

    const headerB64 = parts[0];
    const payloadB64 = parts[1];
    const signatureHex = parts[2];

    // Helper to decode Base64url (replaces URL-safe chars and pads with '=')
    const decodeBase64Url = (urlSafeB64) => {
        let b64 = urlSafeB64.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) {
            b64 += '=';
        }
        return decodeBase64(b64);
    };

    let headerObj = {};
    let payloadObj = {};
    
    try {
        headerObj = JSON.parse(decodeBase64Url(headerB64));
    } catch (e) {
        throw new Error("Failed to decode JWT Header: Header is not valid base64/JSON.");
    }

    try {
        payloadObj = JSON.parse(decodeBase64Url(payloadB64));
    } catch (e) {
        throw new Error("Failed to decode JWT Payload: Payload is not valid base64/JSON.");
    }

    // Validate claims
    let warnings = [];
    const now = Math.floor(Date.now() / 1000);

    if (payloadObj.exp) {
        if (now > payloadObj.exp) {
            const expDate = new Date(payloadObj.exp * 1000).toLocaleString();
            warnings.push(`Token expired on ${expDate} (expired ${now - payloadObj.exp} seconds ago).`);
        }
    }
    
    if (payloadObj.nbf) {
        if (now < payloadObj.nbf) {
            const nbfDate = new Date(payloadObj.nbf * 1000).toLocaleString();
            warnings.push(`Token is not active yet (starts on ${nbfDate}).`);
        }
    }

    return {
        header: headerObj,
        payload: payloadObj,
        signature: signatureHex,
        warnings: warnings
    };
}

// Export functions for node/browser context
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
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
    };
}
