/**
 * Main Application Logic for DataMorph
 */

// Sample Data
const SAMPLE_JSON = `[
  {
    "id": 101,
    "name": "Alice Green",
    "department": "Engineering",
    "salary": 125000,
    "role": "Lead Engineer",
    "contact": {
      "email": "alice.g@datamorph.io",
      "phone": "555-0192"
    },
    "skills": ["JavaScript", "CSS", "Python"]
  },
  {
    "id": 102,
    "name": "Bob Smith",
    "department": "Design",
    "salary": 108000,
    "role": "UI Designer",
    "contact": {
      "email": "bob.s@datamorph.io",
      "phone": "555-0143"
    },
    "skills": ["Figma", "CSS", "Illustrator"]
  },
  {
    "id": 103,
    "name": "Charlie Day",
    "department": "Product",
    "salary": 132000,
    "role": "Product Manager",
    "contact": {
      "email": "charlie.d@datamorph.io",
      "phone": "555-0177"
    },
    "skills": ["Roadmapping", "Agile", "SQL"]
  },
  {
    "id": 104,
    "name": "Diana Prince",
    "department": "Engineering",
    "salary": 140000,
    "role": "Engineering Manager",
    "contact": {
      "email": "diana.p@datamorph.io",
      "phone": "555-0188"
    },
    "skills": ["Architecture", "Leadership", "Go"]
  }
]`;

const SAMPLE_CSV = `id,name,department,salary,role,contact.email,contact.phone
101,Alice Green,Engineering,125000,Lead Engineer,alice.g@datamorph.io,555-0192
102,Bob Smith,Design,108000,UI Designer,bob.s@datamorph.io,555-0143
103,Charlie Day,Product,132000,Product Manager,charlie.d@datamorph.io,555-0177
104,Diana Prince,Engineering,140000,Engineering Manager,diana.p@datamorph.io,555-0188`;

// Application State
let inputFormat = 'json'; // 'json' or 'csv'
let currentConvertedData = null; // Stored parsed data (array of objects) for preview table
let tableFilteredRows = []; // Filtered data rows
let currentPage = 1;
const ROWS_PER_PAGE = 20;

// DOM Cache
const themeToggle = document.getElementById('theme-toggle');
const themeSun = document.getElementById('theme-sun');
const themeMoon = document.getElementById('theme-moon');

const loadSampleBtn = document.getElementById('load-sample-btn');
const swapDirectionBtn = document.getElementById('swap-direction-btn');
const convertBtn = document.getElementById('convert-btn');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const clearBtn = document.getElementById('clear-btn');
const optionsToggleBtn = document.getElementById('options-toggle-btn');
const settingsPanel = document.getElementById('settings-panel');

const convertFromBadge = document.getElementById('convert-from-badge');
const convertToBadge = document.getElementById('convert-to-badge');

const csvDelimiter = document.getElementById('csv-delimiter');
const jsonIndent = document.getElementById('json-indent');
const jsonIndentGroup = document.getElementById('json-indent-group');
const flattenJsonCheckbox = document.getElementById('flatten-json');
const flattenJsonWrapper = document.getElementById('flatten-json-checkbox-wrapper');
const unflattenCsvCheckbox = document.getElementById('unflatten-csv');
const unflattenCsvWrapper = document.getElementById('unflatten-csv-checkbox-wrapper');
const smartTypesCheckbox = document.getElementById('smart-types');
const smartTypesWrapper = document.getElementById('smart-types-checkbox-wrapper');

const inputPanel = document.getElementById('input-panel');
const inputTitle = document.getElementById('input-title');
const inputMeta = document.getElementById('input-meta');
const dropzoneOverlay = document.getElementById('dropzone-overlay');
const editorTextarea = document.getElementById('editor-textarea');
const editorLineNumbers = document.getElementById('editor-line-numbers');
const validationBar = document.getElementById('validation-bar');
const validationMessage = document.getElementById('validation-message');

const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const rawOutputTextarea = document.getElementById('output-textarea');
const outputLineNumbers = document.getElementById('output-line-numbers');

const previewTable = document.getElementById('preview-table');
const previewTableHeader = document.getElementById('preview-table-header');
const previewTableBody = document.getElementById('preview-table-body');
const tableEmpty = document.getElementById('table-empty');
const tableSearch = document.getElementById('table-search');
const pagePrevBtn = document.getElementById('page-prev-btn');
const pageNextBtn = document.getElementById('page-next-btn');
const pageInfo = document.getElementById('page-info');

const toastContainer = document.getElementById('toast-container');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    bindEvents();
    syncLineNumbers(editorTextarea, editorLineNumbers);
    updateSettingsVisibility();
    checkInputValidity();
    initFaq();
});

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcons(newTheme);
    showToast('Theme Updated', `Switched to ${newTheme} mode.`, 'success');
}

function updateThemeIcons(theme) {
    if (theme === 'light') {
        themeSun.classList.add('hidden');
        themeMoon.classList.remove('hidden');
    } else {
        themeSun.classList.remove('hidden');
        themeMoon.classList.add('hidden');
    }
}

// --- Toast Notifications ---
function showToast(title, description, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg class="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg class="toast-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    toast.innerHTML = `
        ${iconSvg}
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-desc">${description}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // Close on click close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    // Auto dismiss
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 200);
    }, 3500);
}

// --- Event Binding ---
function bindEvents() {
    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Options Panel Slide Toggle
    optionsToggleBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('active');
        optionsToggleBtn.classList.toggle('btn-primary');
    });

    // Sample Data Loader
    loadSampleBtn.addEventListener('click', loadSampleData);

    // Clear Button
    clearBtn.addEventListener('click', clearAll);

    // Swap Conversion Mode
    swapDirectionBtn.addEventListener('click', swapConversionDirection);

    // Convert Button Action
    convertBtn.addEventListener('click', handleConvert);

    // Copy to Clipboard
    copyBtn.addEventListener('click', copyOutputToClipboard);

    // Download File Action
    downloadBtn.addEventListener('click', triggerFileDownload);

    // Textarea Changes & Line Syncing
    editorTextarea.addEventListener('input', () => {
        syncLineNumbers(editorTextarea, editorLineNumbers);
        updateMetaInfo();
        checkInputValidity();
    });
    
    editorTextarea.addEventListener('scroll', () => {
        editorLineNumbers.scrollTop = editorTextarea.scrollTop;
    });

    rawOutputTextarea.addEventListener('scroll', () => {
        outputLineNumbers.scrollTop = rawOutputTextarea.scrollTop;
    });

    // Settings adjustments trigger validations
    csvDelimiter.addEventListener('change', () => {
        checkInputValidity();
        handleConvert();
    });
    
    [flattenJsonCheckbox, unflattenCsvCheckbox, smartTypesCheckbox, jsonIndent].forEach(el => {
        el.addEventListener('change', () => handleConvert());
    });

    // Tab switcher
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Interactive Preview Table - Filter & Pages
    tableSearch.addEventListener('input', filterPreviewTable);
    pagePrevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTablePage();
        }
    });
    pageNextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(tableFilteredRows.length / ROWS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            renderTablePage();
        }
    });

    // Drag and Drop
    setupDragAndDrop();
}

// --- Settings Visibility Update ---
function updateSettingsVisibility() {
    if (inputFormat === 'json') {
        // Converting JSON to CSV
        jsonIndentGroup.style.display = 'none'; // We don't indent output CSV
        flattenJsonWrapper.classList.remove('hidden'); // Flatten option applicable
        
        unflattenCsvWrapper.classList.add('hidden');
        smartTypesWrapper.classList.add('hidden');
    } else {
        // Converting CSV to JSON
        jsonIndentGroup.style.display = 'flex'; // Output JSON can be indented
        flattenJsonWrapper.classList.add('hidden');
        
        unflattenCsvWrapper.classList.remove('hidden');
        smartTypesWrapper.classList.remove('hidden');
    }
}

// --- Line Numbers Sync ---
function syncLineNumbers(textarea, numbersContainer) {
    const lines = textarea.value.split('\n');
    const totalLines = Math.max(lines.length, 1);
    
    // Check if the lines are already matching to avoid layout recalculations
    if (numbersContainer.children.length === totalLines) {
        return;
    }

    let lineNumbersHtml = '';
    for (let i = 1; i <= totalLines; i++) {
        lineNumbersHtml += `<span>${i}</span>`;
    }
    numbersContainer.innerHTML = lineNumbersHtml;
}

// --- Textarea Size Metadata ---
function updateMetaInfo() {
    const text = editorTextarea.value;
    if (!text) {
        inputMeta.textContent = 'Empty';
        return;
    }
    const byteLength = new Blob([text]).size;
    const kb = (byteLength / 1024).toFixed(1);
    const lineCount = text.split('\n').length;
    inputMeta.textContent = `${kb} KB | ${lineCount} Line${lineCount !== 1 ? 's' : ''}`;
}

// --- Load Sample Data ---
function loadSampleData() {
    if (inputFormat === 'json') {
        editorTextarea.value = SAMPLE_JSON;
    } else {
        editorTextarea.value = SAMPLE_CSV;
    }
    syncLineNumbers(editorTextarea, editorLineNumbers);
    updateMetaInfo();
    checkInputValidity();
    
    // Auto-convert loaded sample
    handleConvert();
    showToast('Sample Loaded', `Successfully loaded sample ${inputFormat.toUpperCase()} data.`, 'success');
}

// --- Clear Form ---
function clearAll() {
    editorTextarea.value = '';
    rawOutputTextarea.value = '';
    currentConvertedData = null;
    tableFilteredRows = [];
    currentPage = 1;
    
    syncLineNumbers(editorTextarea, editorLineNumbers);
    syncLineNumbers(rawOutputTextarea, outputLineNumbers);
    
    updateMetaInfo();
    checkInputValidity();
    
    // Reset table layout
    previewTableHeader.innerHTML = '';
    previewTableBody.innerHTML = '';
    tableEmpty.style.display = 'flex';
    previewTable.style.display = 'none';
    tableSearch.value = '';
    updatePaginationControls(0);
    
    showToast('Cleared', 'Input and output editors cleared.', 'success');
}

// --- Swap Mode Direction ---
function swapConversionDirection() {
    if (inputFormat === 'json') {
        inputFormat = 'csv';
        convertFromBadge.textContent = 'CSV';
        convertToBadge.textContent = 'JSON';
        inputTitle.innerHTML = `
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            INPUT (CSV)
        `;
        editorTextarea.placeholder = "Paste your CSV here, or drag & drop a .csv file...";
    } else {
        inputFormat = 'json';
        convertFromBadge.textContent = 'JSON';
        convertToBadge.textContent = 'CSV';
        inputTitle.innerHTML = `
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            INPUT (JSON)
        `;
        editorTextarea.placeholder = "Paste your JSON here, or drag & drop a .json file...";
    }

    // Toggle settings fields
    updateSettingsVisibility();
    
    // Clear output, but swap input text if relevant
    const oldInput = editorTextarea.value;
    const oldOutput = rawOutputTextarea.value;
    
    if (oldOutput) {
        editorTextarea.value = oldOutput;
        rawOutputTextarea.value = oldInput;
        syncLineNumbers(editorTextarea, editorLineNumbers);
        syncLineNumbers(rawOutputTextarea, outputLineNumbers);
        updateMetaInfo();
    } else {
        clearAll();
    }

    checkInputValidity();
    
    // Auto convert swapped content
    if (editorTextarea.value) {
        handleConvert();
    }
}

// --- Live Input Validation ---
function checkInputValidity() {
    const text = editorTextarea.value.trim();
    
    if (!text) {
        setValidationState('ready', 'Ready');
        return true;
    }

    if (inputFormat === 'json') {
        try {
            JSON.parse(text);
            setValidationState('success', 'Valid JSON format');
            return true;
        } catch (err) {
            setValidationState('error', `Invalid JSON: ${err.message}`);
            return false;
        }
    } else {
        // Basic CSV validation
        const delimiter = csvDelimiter.value;
        const rows = parseCsvTo2DArray(text, delimiter);
        
        if (rows.length === 0) {
            setValidationState('error', 'Empty CSV file or invalid rows');
            return false;
        }
        
        // Check structural consistency (warn if row cell count mismatches header cell count)
        const headerLen = rows[0].length;
        const inconsistencies = rows.filter((r, idx) => idx > 0 && r.length !== headerLen && !(r.length === 1 && r[0] === ''));
        
        if (inconsistencies.length > 0) {
            setValidationState('error', `CSV Structure inconsistent: ${inconsistencies.length} row(s) contain unexpected column count.`);
            return false;
        }

        setValidationState('success', `Valid CSV format (${rows.length} rows parsed)`);
        return true;
    }
}

function setValidationState(state, message) {
    validationBar.className = `validation-bar ${state}`;
    
    let iconSvg = '';
    if (state === 'success') {
        iconSvg = `<svg class="validation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    } else if (state === 'error') {
        iconSvg = `<svg class="validation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
    } else {
        iconSvg = `<svg class="validation-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }

    validationBar.innerHTML = `${iconSvg} <span>${message}</span>`;
}

// --- Main Converter Trigger ---
function handleConvert() {
    const inputVal = editorTextarea.value.trim();
    if (!inputVal) {
        return;
    }

    const delimiter = csvDelimiter.value;

    try {
        if (inputFormat === 'json') {
            // Convert JSON -> CSV
            const parsedJson = JSON.parse(inputVal);
            const flatten = flattenJsonCheckbox.checked;
            
            const csvResult = convertJsonToCsv(parsedJson, {
                delimiter: delimiter,
                flatten: flatten,
                includeHeaders: true
            });
            
            rawOutputTextarea.value = csvResult;
            
            // Format preview data (flatten for the preview table grid view)
            const preProcessed = Array.isArray(parsedJson) ? parsedJson : [parsedJson];
            currentConvertedData = preProcessed.map(item => flatten ? flattenObject(item) : item);
            
        } else {
            // Convert CSV -> JSON
            const unflatten = unflattenCsvCheckbox.checked;
            const smartTypes = smartTypesCheckbox.checked;
            
            const jsonResult = convertCsvToJson(inputVal, {
                delimiter: delimiter,
                unflatten: unflatten,
                smartTypes: smartTypes
            });

            // Handle Indentation
            const indentOption = jsonIndent.value;
            let indentVal = 2;
            if (indentOption === '4') indentVal = 4;
            
            if (indentOption === 'minify') {
                rawOutputTextarea.value = JSON.stringify(jsonResult);
            } else {
                rawOutputTextarea.value = JSON.stringify(jsonResult, null, indentVal);
            }

            // Stored data for preview table (keep it flat for easier grid preview)
            currentConvertedData = convertCsvToJson(inputVal, {
                delimiter: delimiter,
                unflatten: false, // For table previews, flat columns are much cleaner to inspect
                smartTypes: smartTypes
            });
        }

        // Refresh output line counts
        syncLineNumbers(rawOutputTextarea, outputLineNumbers);
        
        // Refresh Table Preview
        tableSearch.value = '';
        filterPreviewTable();
        
    } catch (err) {
        showToast('Conversion Failed', err.message, 'error');
        setValidationState('error', `Conversion Error: ${err.message}`);
    }
}

// --- Switch Right Pane Tabs ---
function switchTab(tabId) {
    tabButtons.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    tabContents.forEach(content => {
        if (content.id === tabId) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// --- Preview Table Search & Filter ---
function filterPreviewTable() {
    if (!currentConvertedData || currentConvertedData.length === 0) {
        tableFilteredRows = [];
        renderTablePreview();
        return;
    }

    const query = tableSearch.value.trim().toLowerCase();
    
    if (!query) {
        tableFilteredRows = [...currentConvertedData];
    } else {
        tableFilteredRows = currentConvertedData.filter(row => {
            return Object.values(row).some(val => {
                if (val === null || val === undefined) return false;
                return String(val).toLowerCase().includes(query);
            });
        });
    }

    currentPage = 1;
    renderTablePreview();
}

// --- Table Preview Renderer ---
function renderTablePreview() {
    // Check if table is empty
    if (tableFilteredRows.length === 0) {
        previewTable.style.display = 'none';
        tableEmpty.style.display = 'flex';
        updatePaginationControls(0);
        return;
    }

    tableEmpty.style.display = 'none';
    previewTable.style.display = 'table';

    // Gather headers
    const headerSet = new Set();
    tableFilteredRows.forEach(row => {
        Object.keys(row).forEach(k => headerSet.add(k));
    });
    const headers = Array.from(headerSet);

    // Build headers row HTML
    let headerHtml = '';
    headers.forEach(h => {
        headerHtml += `<th>${escapeHtml(h)}</th>`;
    });
    previewTableHeader.innerHTML = headerHtml;

    // Render current page
    renderTablePage(headers);
}

function renderTablePage(headers) {
    if (!headers) {
        // Collect headers if not passed directly
        const headerSet = new Set();
        tableFilteredRows.forEach(row => {
            Object.keys(row).forEach(k => headerSet.add(k));
        });
        headers = Array.from(headerSet);
    }

    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    const endIndex = Math.min(startIndex + ROWS_PER_PAGE, tableFilteredRows.length);
    const pageRows = tableFilteredRows.slice(startIndex, endIndex);

    let rowsHtml = '';
    pageRows.forEach(row => {
        rowsHtml += '<tr>';
        headers.forEach(header => {
            const cellVal = row[header];
            let displayVal = '';
            if (cellVal !== undefined && cellVal !== null) {
                if (typeof cellVal === 'object') {
                    displayVal = JSON.stringify(cellVal);
                } else {
                    displayVal = String(cellVal);
                }
            }
            rowsHtml += `<td title="${escapeHtml(displayVal)}">${escapeHtml(displayVal)}</td>`;
        });
        rowsHtml += '</tr>';
    });

    previewTableBody.innerHTML = rowsHtml;
    updatePaginationControls(tableFilteredRows.length);
}

function updatePaginationControls(totalRows) {
    const totalPages = Math.max(Math.ceil(totalRows / ROWS_PER_PAGE), 1);
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalRows} rows)`;
    pagePrevBtn.disabled = currentPage === 1;
    pageNextBtn.disabled = currentPage === totalPages;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- Action Helpers (Copy & Download) ---
function copyOutputToClipboard() {
    const text = rawOutputTextarea.value;
    if (!text) {
        showToast('Empty Output', 'There is no converted output to copy.', 'error');
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            showToast('Copied', 'Successfully copied output to clipboard.', 'success');
        })
        .catch(err => {
            showToast('Copy Failed', err.message, 'error');
        });
}

function triggerFileDownload() {
    const text = rawOutputTextarea.value;
    if (!text) {
        showToast('Empty Output', 'There is no converted output to download.', 'error');
        return;
    }

    const format = inputFormat === 'json' ? 'csv' : 'json';
    const blob = new Blob([text], { type: format === 'json' ? 'application/json;charset=utf-8;' : 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `datamorph_output.${format}`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Download Started', `Saved output as datamorph_output.${format}`, 'success');
}

// --- Drag and Drop File Handlers ---
function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        inputPanel.addEventListener(eventName, preventDefaultBehavior, false);
    });

    function preventDefaultBehavior(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        inputPanel.addEventListener(eventName, () => {
            inputPanel.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        inputPanel.addEventListener(eventName, () => {
            inputPanel.classList.remove('dragover');
        }, false);
    });

    inputPanel.addEventListener('drop', handleFileDrop, false);
}

function handleFileDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length === 0) return;

    const file = files[0];
    const extension = file.name.split('.').pop().toLowerCase();
    
    // Auto detect layout direction based on file type
    if (extension === 'json') {
        if (inputFormat !== 'json') {
            swapConversionDirection();
        }
    } else if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
        if (inputFormat !== 'csv') {
            swapConversionDirection();
        }
        
        // Auto set delimiter for tabs
        if (extension === 'tsv') {
            csvDelimiter.value = '\t';
        } else {
            csvDelimiter.value = ',';
        }
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        editorTextarea.value = e.target.result;
        syncLineNumbers(editorTextarea, editorLineNumbers);
        updateMetaInfo();
        checkInputValidity();
        handleConvert();
        showToast('File Uploaded', `Successfully imported ${file.name}`, 'success');
    };
    reader.onerror = function() {
        showToast('Upload Failed', 'Failed to read the imported file.', 'error');
    };
    
    reader.readAsText(file);
}

// --- FAQ Accordion Collapsible Logic ---
function initFaq() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        const content = item.querySelector('.faq-content');
        
        trigger.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other FAQ items first
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-content').style.maxHeight = null;
                }
            });
            
            // Toggle current FAQ item
            if (isActive) {
                item.classList.remove('active');
                content.style.maxHeight = null;
            } else {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
}

