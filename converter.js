/**
 * Utility functions for JSON <-> CSV Conversion
 */

/**
 * Flattens a nested object into a single-level object with dot-notated keys.
 * Example: { user: { name: "Alice" } } -> { "user.name": "Alice" }
 * @param {Object} obj - The object to flatten.
 * @param {string} prefix - The accumulated key prefix (for recursion).
 * @param {Object} res - The accumulator object.
 * @returns {Object} A flat object.
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

    // Handle array values specifically
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

    // Handle normal objects
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
 * @param {Object} flatObj - The flat object to unflatten.
 * @returns {Object} The nested object.
 */
function unflattenObject(flatObj) {
    const result = {};
    for (const key in flatObj) {
        if (Object.prototype.hasOwnProperty.call(flatObj, key)) {
            const parts = key.split('.');
            let current = result;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                // Check if the next part is a number (suggesting an array index)
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
 * @param {any} val - The raw value.
 * @param {string} delimiter - The delimiter character (e.g. ",", ";", "\t").
 * @returns {string} The escaped string.
 */
function escapeCSVCell(val, delimiter = ',') {
    if (val === null || val === undefined) {
        return '';
    }
    let str = String(val);
    
    // Check if cell needs quoting (contains quotes, delimiter, or newlines)
    const needsQuoting = str.includes('"') || str.includes(delimiter) || str.includes('\n') || str.includes('\r');
    if (needsQuoting) {
        // Double any internal quotes
        str = str.replace(/"/g, '""');
        return `"${str}"`;
    }
    return str;
}

/**
 * Converts JSON array of objects to a CSV string.
 * @param {Array|Object} jsonData - The input JSON data.
 * @param {Object} options - Configuration options.
 * @param {string} options.delimiter - CSV field delimiter (",", ";", "\t").
 * @param {boolean} options.flatten - Whether to flatten nested structures.
 * @param {boolean} options.includeHeaders - Whether to include header row.
 * @returns {string} The CSV string.
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

    // Pre-process items (flatten if requested)
    const processedData = data.map(item => {
        if (typeof item !== 'object' || item === null) {
            return { value: item };
        }
        return flatten ? flattenObject(item) : item;
    });

    // Gather all unique keys across all objects to form the headers
    const headerSet = new Set();
    processedData.forEach(item => {
        Object.keys(item).forEach(k => headerSet.add(k));
    });
    const headers = Array.from(headerSet);

    const rows = [];

    // Header row
    if (includeHeaders) {
        rows.push(headers.map(h => escapeCSVCell(h, delimiter)).join(delimiter));
    }

    // Data rows
    processedData.forEach(item => {
        const row = headers.map(h => {
            const val = item[h];
            // If val is an object or array (happens when flatten is false), stringify it
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
 * Compliant with RFC 4180 (handles quoted strings with delimiters and escaped quotes).
 * @param {string} csvText - The raw CSV text.
 * @param {string} delimiter - The delimiter character (",", ";", "\t").
 * @returns {Array<Array<string>>} 2D array representing rows and columns.
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
                    // Escaped double quote (two double quotes in a row)
                    currentField += '"';
                    i++; // skip next quote
                } else {
                    // Ending double quote
                    insideQuotes = false;
                }
            } else {
                // Character inside quotes (including delimiters and newlines)
                currentField += char;
            }
        } else {
            if (char === '"') {
                // Beginning double quote
                insideQuotes = true;
            } else if (char === delimiter) {
                // Field separator
                currentRow.push(currentField);
                currentField = '';
            } else if (char === '\r' && nextChar === '\n') {
                // CRLF line separator
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
                i++; // skip LF
            } else if (char === '\n') {
                // LF line separator
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            } else {
                // Standard character
                currentField += char;
            }
        }
    }

    // Push the final field and row if there's remaining content
    if (currentField !== '' || currentRow.length > 0 || csvText.endsWith(delimiter)) {
        currentRow.push(currentField);
    }
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    return rows;
}

/**
 * Try to parse string to numeric, boolean, or null types if possible.
 * @param {string} strVal - Raw cell text.
 * @returns {any} Typed value.
 */
function parseSmartType(strVal) {
    const trimmed = strVal.trim();
    if (trimmed === '') return '';
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    if (trimmed.toLowerCase() === 'null') return null;
    
    // Parse numbers, but ensure it's not a leading-zero phone number or similar
    if (!isNaN(Number(trimmed)) && trimmed !== '') {
        // Prevent parsing "0123" to 123 if it's treated as a code, but allow "0"
        if (trimmed.length > 1 && trimmed.startsWith('0') && !trimmed.includes('.')) {
            return trimmed;
        }
        return Number(trimmed);
    }
    return strVal;
}

/**
 * Converts a CSV string to a JSON string or object array.
 * @param {string} csvText - The CSV content.
 * @param {Object} options - Configuration options.
 * @param {string} options.delimiter - CSV field delimiter (",", ";", "\t").
 * @param {boolean} options.smartTypes - Whether to parse numbers, booleans, and nulls.
 * @param {boolean} options.unflatten - Whether to expand dot-notated columns back into nested objects.
 * @returns {Array<Object>} Array of objects.
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

    // The first row is headers
    const headers = rows[0].map(h => h.trim());
    const dataRows = rows.slice(1);
    
    const result = [];

    dataRows.forEach(row => {
        // Skip empty rows
        if (row.length === 0 || (row.length === 1 && row[0] === '')) {
            return;
        }

        const obj = {};
        headers.forEach((header, idx) => {
            // Default to empty string if row doesn't have enough cells
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

// Export functions for use in browser context or testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        flattenObject,
        unflattenObject,
        convertJsonToCsv,
        convertCsvToJson,
        parseCsvTo2DArray
    };
}
