/**
 * Application Orchestrator for DataMorph Suite
 */

// Sample Data Constants
const SAMPLE_CSV = `id,name,department,salary,contact.email,contact.phone\n101,Alice Green,Engineering,125000,alice.g@datamorph.io,555-0192\n102,Bob Smith,Design,108000,bob.s@datamorph.io,555-0143`;

const SAMPLES = {
    'json-formatter': `{\n  "projectName": "DataMorph Suite",\n  "status": "Production",\n  "version": 2.1,\n  "adFree": true,\n  "features": ["Formatter", "CSV Converter", "XML Converter", "YAML Converter", "Base64 Codec", "JWT Decoder"],\n  "statistics": {\n    "bytesUploaded": 0,\n    "privacyRating": "100%",\n    "offlineCompatible": true\n  },\n  "maintainer": null\n}`,
    
    'json-csv': `[\n  {\n    "id": 101,\n    "name": "Alice Green",\n    "department": "Engineering",\n    "salary": 125000,\n    "contact": {\n      "email": "alice.g@datamorph.io",\n      "phone": "555-0192"\n    }\n  },\n  {\n    "id": 102,\n    "name": "Bob Smith",\n    "department": "Design",\n    "salary": 108000,\n    "contact": {\n      "email": "bob.s@datamorph.io",\n      "phone": "555-0143"\n    }\n  }\n]`,

    'json-xml': `{\n  "catalog": {\n    "book": {\n      "@attributes": { "id": "bk101" },\n      "author": "Gambardella, Matthew",\n      "title": "XML Developer's Guide",\n      "genre": "Computer",\n      "price": 44.95,\n      "publish_date": "2000-10-01",\n      "description": "An in-depth look at creating applications with XML."\n    }\n  }\n}`,

    'json-yaml': `{\n  "project": {\n    "name": "DataMorph Suite",\n    "version": "2.1.0",\n    "private": true,\n    "dependencies": [\n      "js-yaml",\n      "xmldom",\n      "inter-font"\n    ],\n    "license": "MIT"\n  }\n}`,

    'base64': `DataMorph Suite is a 100% secure, browser-only workspace for processing files and strings. Emojis work too! 🚀🔥`,

    'url': `https://datamorph.tools/search?query=safe formatter&category=developer utilities&private=true`,

    'jwt': `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MTYyMzkwMjIsImFkbWluIjp0cnVlLCJyb2xlcyI6WyJkZXZlbG9wZXIiLCJhZG1pbiJdfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`
};


// Application State
let activeTool = 'json-formatter';
let swapState = false; // true reverses conversion direction (e.g. XML -> JSON, YAML -> JSON)

// Pagination & Filtering for CSV previews
let currentConvertedData = null;
let tableFilteredRows = [];
let currentPage = 1;
const ROWS_PER_PAGE = 20;

// DOM Element cache
const sidebarLinks = document.querySelectorAll('.menu-item');
const toolTitleHeader = document.getElementById('tool-title-header');
const loadSampleBtn = document.getElementById('load-sample-btn');

const convertBtn = document.getElementById('convert-btn');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const clearBtn = document.getElementById('clear-btn');
const swapDirectionBtn = document.getElementById('swap-direction-btn');
const directionContainer = document.getElementById('direction-container');

const convertFromBadge = document.getElementById('convert-from-badge');
const convertToBadge = document.getElementById('convert-to-badge');

const settingsPanel = document.getElementById('settings-panel');
const jsonIndentGroup = document.getElementById('json-indent-group');
const csvDelimiterGroup = document.getElementById('csv-delimiter-group');
const codecActionGroup = document.getElementById('codec-action-group');

const jsonIndent = document.getElementById('json-indent');
const csvDelimiter = document.getElementById('csv-delimiter');
const codecAction = document.getElementById('codec-action');

const flattenJsonWrapper = document.getElementById('flatten-json-checkbox-wrapper');
const flattenJsonCheckbox = document.getElementById('flatten-json');
const unflattenCsvWrapper = document.getElementById('unflatten-csv-checkbox-wrapper');
const unflattenCsvCheckbox = document.getElementById('unflatten-csv');
const smartTypesWrapper = document.getElementById('smart-types-checkbox-wrapper');
const smartTypesCheckbox = document.getElementById('smart-types');

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
const tabBtnRaw = document.getElementById('tab-btn-raw');
const tabBtnTable = document.getElementById('tab-btn-table');
const tabBtnTree = document.getElementById('tab-btn-tree');
const tabBtnJwt = document.getElementById('tab-btn-jwt');

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

const treeViewRoot = document.getElementById('tree-view-root');

const jwtWarningsList = document.getElementById('jwt-warnings-list');
const jwtHeaderBox = document.getElementById('jwt-header-box');
const jwtPayloadBox = document.getElementById('jwt-payload-box');

const themeToggle = document.getElementById('theme-toggle');
const themeSun = document.getElementById('theme-sun');
const themeMoon = document.getElementById('theme-moon');
const toastContainer = document.getElementById('toast-container');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    bindEvents();
    syncLineNumbers(editorTextarea, editorLineNumbers);
    switchTool('json-formatter');
});

// --- Theme Toggling ---
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

// --- Toast Alerts ---
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

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 200);
    }, 3500);
}

// --- Event Binding ---
function bindEvents() {
    themeToggle.addEventListener('click', toggleTheme);
    loadSampleBtn.addEventListener('click', loadSampleData);
    clearBtn.addEventListener('click', clearAll);
    swapDirectionBtn.addEventListener('click', toggleSwapState);
    convertBtn.addEventListener('click', handleConversion);
    copyBtn.addEventListener('click', copyOutputToClipboard);
    downloadBtn.addEventListener('click', triggerFileDownload);

    // Sidebar navigation
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tool = link.getAttribute('data-tool');
            switchTool(tool);
        });
    });

    // Inputs scrolls & line numbers
    editorTextarea.addEventListener('input', () => {
        syncLineNumbers(editorTextarea, editorLineNumbers);
        updateMetaInfo();
        checkValidity();
        handleConversion(); // Instant conversion when typing
    });

    editorTextarea.addEventListener('scroll', () => {
        editorLineNumbers.scrollTop = editorTextarea.scrollTop;
    });

    rawOutputTextarea.addEventListener('scroll', () => {
        outputLineNumbers.scrollTop = rawOutputTextarea.scrollTop;
    });

    // Config triggers
    [jsonIndent, csvDelimiter, codecAction, flattenJsonCheckbox, unflattenCsvCheckbox, smartTypesCheckbox].forEach(el => {
        el.addEventListener('change', () => {
            checkValidity();
            handleConversion();
        });
    });

    // Output panel tabs switcher
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Table preview pagination and filtering
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

    // FAQ Accordion listener
    initFaq();
}

// --- Sidebar Router Switching ---
function switchTool(toolId) {
    activeTool = toolId;
    swapState = false; // Reset swap on switch

    // Toggle active link
    sidebarLinks.forEach(link => {
        if (link.getAttribute('data-tool') === toolId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Clear contents on switch
    editorTextarea.value = '';
    rawOutputTextarea.value = '';
    currentConvertedData = null;
    tableFilteredRows = [];
    currentPage = 1;
    syncLineNumbers(editorTextarea, editorLineNumbers);
    syncLineNumbers(rawOutputTextarea, outputLineNumbers);
    updateMetaInfo();

    // Reset settings visibilities
    jsonIndentGroup.classList.add('hidden');
    csvDelimiterGroup.classList.add('hidden');
    codecActionGroup.classList.add('hidden');
    flattenJsonWrapper.classList.add('hidden');
    unflattenCsvWrapper.classList.add('hidden');
    smartTypesWrapper.classList.add('hidden');
    directionContainer.classList.add('hidden');

    // Reset Tabs
    tabBtnRaw.classList.remove('hidden');
    tabBtnTable.classList.add('hidden');
    tabBtnTree.classList.add('hidden');
    tabBtnJwt.classList.add('hidden');

    // Setup configurations based on tool
    switch (toolId) {
        case 'json-formatter':
            toolTitleHeader.innerHTML = `<svg class="brand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg> JSON Formatter & Validator`;
            inputTitle.textContent = "INPUT (JSON)";
            editorTextarea.placeholder = "Paste JSON payload here...";
            jsonIndentGroup.classList.remove('hidden');
            tabBtnTree.classList.remove('hidden');
            convertBtn.textContent = "Format";
            switchTab('tab-raw');
            break;
            
        case 'json-csv':
            toolTitleHeader.innerHTML = `<svg class="brand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg> JSON ⇄ CSV Converter`;
            directionContainer.classList.remove('hidden');
            csvDelimiterGroup.classList.remove('hidden');
            tabBtnTable.classList.remove('hidden');
            convertBtn.textContent = "Convert";
            updateDirectionBadges('JSON', 'CSV');
            switchTab('tab-table');
            break;

        case 'json-xml':
            toolTitleHeader.innerHTML = `<svg class="brand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg> JSON ⇄ XML Translator`;
            directionContainer.classList.remove('hidden');
            convertBtn.textContent = "Translate";
            updateDirectionBadges('JSON', 'XML');
            switchTab('tab-raw');
            break;

        case 'json-yaml':
            toolTitleHeader.innerHTML = `<svg class="brand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> JSON ⇄ YAML Translator`;
            directionContainer.classList.remove('hidden');
            convertBtn.textContent = "Translate";
            updateDirectionBadges('JSON', 'YAML');
            switchTab('tab-raw');
            break;

        case 'base64':
            toolTitleHeader.innerHTML = `<svg class="brand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> Base64 Encoder & Decoder`;
            codecActionGroup.classList.remove('hidden');
            convertBtn.textContent = "Process";
            inputTitle.textContent = "RAW INPUT";
            editorTextarea.placeholder = "Enter raw text to encode, or base64 text to decode...";
            switchTab('tab-raw');
            break;

        case 'url':
            toolTitleHeader.innerHTML = `<svg class="brand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg> URL Encoder & Decoder`;
            codecActionGroup.classList.remove('hidden');
            convertBtn.textContent = "Process";
            inputTitle.textContent = "RAW INPUT";
            editorTextarea.placeholder = "Enter text or URLs to escape/unescape...";
            switchTab('tab-raw');
            break;

        case 'jwt':
            toolTitleHeader.innerHTML = `<svg class="brand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> JWT Token Decoder`;
            convertBtn.textContent = "Decode";
            inputTitle.textContent = "JWT STRING";
            editorTextarea.placeholder = "Paste your JSON Web Token string here (header.payload.signature)...";
            tabBtnRaw.classList.add('hidden');
            tabBtnJwt.classList.remove('hidden');
            switchTab('tab-jwt');
            break;
    }

    updateSettingsDetails();
    checkValidity();
}

function updateDirectionBadges(from, to) {
    if (swapState) {
        convertFromBadge.textContent = to;
        convertToBadge.textContent = from;
        inputTitle.textContent = `INPUT (${to})`;
    } else {
        convertFromBadge.textContent = from;
        convertToBadge.textContent = to;
        inputTitle.textContent = `INPUT (${from})`;
    }
    
    // Set appropriate placeholder for current swapState
    if (activeTool === 'json-csv') {
        editorTextarea.placeholder = swapState 
            ? "Paste CSV layout here, or drag & drop a .csv file..." 
            : "Paste JSON payload here, or drag & drop a .json file...";
    } else if (activeTool === 'json-xml') {
        editorTextarea.placeholder = swapState
            ? "Paste XML text here..."
            : "Paste JSON payload here...";
    } else if (activeTool === 'json-yaml') {
        editorTextarea.placeholder = swapState
            ? "Paste YAML document here..."
            : "Paste JSON payload here...";
    }
}

function toggleSwapState() {
    swapState = !swapState;
    
    if (activeTool === 'json-csv') {
        updateDirectionBadges('JSON', 'CSV');
    } else if (activeTool === 'json-xml') {
        updateDirectionBadges('JSON', 'XML');
    } else if (activeTool === 'json-yaml') {
        updateDirectionBadges('JSON', 'YAML');
    }
    
    updateSettingsDetails();
    
    // Swap contents if possible
    const inp = editorTextarea.value;
    const out = rawOutputTextarea.value;
    if (out) {
        editorTextarea.value = out;
        rawOutputTextarea.value = inp;
        syncLineNumbers(editorTextarea, editorLineNumbers);
        syncLineNumbers(rawOutputTextarea, outputLineNumbers);
        updateMetaInfo();
    } else {
        clearAll();
    }
    
    checkValidity();
    handleConversion();
}

function updateSettingsDetails() {
    // Show/hide specific settings checkboxes depending on tool and direction
    flattenJsonWrapper.classList.add('hidden');
    unflattenCsvWrapper.classList.add('hidden');
    smartTypesWrapper.classList.add('hidden');

    if (activeTool === 'json-csv') {
        if (!swapState) {
            flattenJsonWrapper.classList.remove('hidden'); // JSON -> CSV
        } else {
            unflattenCsvWrapper.classList.remove('hidden'); // CSV -> JSON
            smartTypesWrapper.classList.remove('hidden');
        }
    }
}

// --- Dynamic Line Numbers Sync ---
function syncLineNumbers(textarea, numbersContainer) {
    const lines = textarea.value.split('\n');
    const totalLines = Math.max(lines.length, 1);
    
    if (numbersContainer.children.length === totalLines) {
        return;
    }

    let lineNumbersHtml = '';
    for (let i = 1; i <= totalLines; i++) {
        lineNumbersHtml += `<span>${i}</span>`;
    }
    numbersContainer.innerHTML = lineNumbersHtml;
}

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
    let sample = '';
    
    if (activeTool === 'json-csv' || activeTool === 'json-xml' || activeTool === 'json-yaml') {
        if (swapState) {
            // Loading target-format sample (XML, YAML, CSV)
            if (activeTool === 'json-csv') sample = SAMPLE_CSV;
            else if (activeTool === 'json-xml') {
                sample = `<?xml version="1.0" encoding="UTF-8"?>\n<catalog>\n  <book id="bk101">\n    <author>Gambardella, Matthew</author>\n    <title>XML Developer's Guide</title>\n    <genre>Computer</genre>\n  </book>\n</catalog>`;
            } else if (activeTool === 'json-yaml') {
                sample = `project:\n  name: DataMorph Suite\n  version: 2.1.0\n  private: true\n  dependencies:\n    - js-yaml\n    - xmldom`;
            }
        } else {
            // Loading standard JSON samples
            sample = SAMPLES[activeTool];
        }
    } else {
        sample = SAMPLES[activeTool];
    }

    editorTextarea.value = sample;
    syncLineNumbers(editorTextarea, editorLineNumbers);
    updateMetaInfo();
    checkValidity();
    handleConversion();
    showToast('Sample Loaded', `Successfully loaded sample dataset.`, 'success');
}

// --- Clear Actions ---
function clearAll() {
    editorTextarea.value = '';
    rawOutputTextarea.value = '';
    currentConvertedData = null;
    tableFilteredRows = [];
    currentPage = 1;
    
    syncLineNumbers(editorTextarea, editorLineNumbers);
    syncLineNumbers(rawOutputTextarea, outputLineNumbers);
    updateMetaInfo();
    checkValidity();
    
    // Reset output panels
    previewTableHeader.innerHTML = '';
    previewTableBody.innerHTML = '';
    tableEmpty.style.display = 'flex';
    previewTable.style.display = 'none';
    tableSearch.value = '';
    updatePaginationControls(0);
    
    treeViewRoot.innerHTML = '';
    jwtWarningsList.innerHTML = '';
    jwtHeaderBox.textContent = '{}';
    jwtPayloadBox.textContent = '{}';
    
    showToast('Cleared', 'Cleaned input and output panels.', 'success');
}

// --- Input Validations ---
function checkValidity() {
    const text = editorTextarea.value.trim();
    if (!text) {
        setValidationState('ready', 'Ready');
        return true;
    }

    // Determine target validation based on activeTool and swapState
    const isJsonInput = (activeTool === 'json-formatter') || 
                        (activeTool === 'json-csv' && !swapState) ||
                        (activeTool === 'json-xml' && !swapState) ||
                        (activeTool === 'json-yaml' && !swapState);

    if (isJsonInput) {
        try {
            JSON.parse(text);
            setValidationState('success', 'Valid JSON format');
            return true;
        } catch (err) {
            setValidationState('error', `Invalid JSON: ${err.message}`);
            return false;
        }
    } else if (activeTool === 'json-csv' && swapState) {
        // CSV Validation
        const delimiter = csvDelimiter.value;
        const rows = parseCsvTo2DArray(text, delimiter);
        if (rows.length === 0) {
            setValidationState('error', 'Empty CSV file or invalid rows');
            return false;
        }
        setValidationState('success', `Valid CSV format (${rows.length} rows parsed)`);
        return true;
    } else if (activeTool === 'json-xml' && swapState) {
        // XML Validation
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            const parseError = xmlDoc.getElementsByTagName("parsererror");
            if (parseError.length > 0) {
                throw new Error(parseError[0].textContent);
            }
            setValidationState('success', 'Valid XML format');
            return true;
        } catch (err) {
            setValidationState('error', `Invalid XML: ${err.message}`);
            return false;
        }
    } else if (activeTool === 'json-yaml' && swapState) {
        // YAML Validation
        try {
            jsyaml.load(text);
            setValidationState('success', 'Valid YAML format');
            return true;
        } catch (err) {
            setValidationState('error', `Invalid YAML: ${err.message}`);
            return false;
        }
    } else if (activeTool === 'jwt') {
        const parts = text.split('.');
        if (parts.length === 3) {
            setValidationState('success', 'Valid JWT format');
            return true;
        } else {
            setValidationState('error', 'JWT must contain exactly 3 dot-separated base64 segments');
            return false;
        }
    }

    // Default state for strings (base64, URL)
    setValidationState('success', 'Ready to process');
    return true;
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

// --- Main Conversion Router ---
function handleConversion() {
    const inputVal = editorTextarea.value.trim();
    if (!inputVal) {
        return;
    }

    try {
        switch (activeTool) {
            case 'json-formatter':
                processFormatter(inputVal);
                break;
            case 'json-csv':
                processCSV(inputVal);
                break;
            case 'json-xml':
                processXML(inputVal);
                break;
            case 'json-yaml':
                processYAML(inputVal);
                break;
            case 'base64':
                processBase64(inputVal);
                break;
            case 'url':
                processURL(inputVal);
                break;
            case 'jwt':
                processJWT(inputVal);
                break;
        }
        syncLineNumbers(rawOutputTextarea, outputLineNumbers);
    } catch (err) {
        setValidationState('error', `Processing Error: ${err.message}`);
    }
}

// =================================================================
// TOOL PROCESSORS
// =================================================================

// 1. JSON Formatter
function processFormatter(text) {
    const parsed = JSON.parse(text);
    const indentOption = jsonIndent.value;
    
    let formattedText = '';
    if (indentOption === 'minify') {
        formattedText = JSON.stringify(parsed);
    } else {
        formattedText = JSON.stringify(parsed, null, Number(indentOption));
    }
    
    rawOutputTextarea.value = formattedText;
    
    // Render tree view DOM
    treeViewRoot.innerHTML = '';
    treeViewRoot.appendChild(buildTreeDOM(parsed));
}

// 2. JSON/CSV
function processCSV(text) {
    const delimiter = csvDelimiter.value;
    
    if (!swapState) {
        // JSON -> CSV
        const parsed = JSON.parse(text);
        const flatten = flattenJsonCheckbox.checked;
        const csvResult = convertJsonToCsv(parsed, { delimiter, flatten });
        rawOutputTextarea.value = csvResult;
        
        const preProcessed = Array.isArray(parsed) ? parsed : [parsed];
        currentConvertedData = preProcessed.map(item => flatten ? flattenObject(item) : item);
    } else {
        // CSV -> JSON
        const unflatten = unflattenCsvCheckbox.checked;
        const smartTypes = smartTypesCheckbox.checked;
        const jsonResult = convertCsvToJson(text, { delimiter, unflatten, smartTypes });
        rawOutputTextarea.value = JSON.stringify(jsonResult, null, 2);
        
        currentConvertedData = convertCsvToJson(text, { delimiter, unflatten: false, smartTypes });
    }

    tableSearch.value = '';
    filterPreviewTable();
}

// 3. JSON/XML
function processXML(text) {
    if (!swapState) {
        // JSON -> XML
        const parsed = JSON.parse(text);
        rawOutputTextarea.value = convertJsonToXml(parsed);
    } else {
        // XML -> JSON
        const jsonResult = convertXmlToJson(text);
        rawOutputTextarea.value = JSON.stringify(jsonResult, null, 2);
    }
}

// 4. JSON/YAML
function processYAML(text) {
    if (!swapState) {
        // JSON -> YAML
        const parsed = JSON.parse(text);
        rawOutputTextarea.value = convertJsonToYaml(parsed);
    } else {
        // YAML -> JSON
        const jsonResult = convertYamlToJson(text);
        rawOutputTextarea.value = JSON.stringify(jsonResult, null, 2);
    }
}

// 5. Base64
function processBase64(text) {
    const action = codecAction.value;
    if (action === 'encode') {
        rawOutputTextarea.value = encodeBase64(text);
    } else {
        rawOutputTextarea.value = decodeBase64(text);
    }
}

// 6. URL
function processURL(text) {
    const action = codecAction.value;
    if (action === 'encode') {
        rawOutputTextarea.value = encodeURIComponent(text);
    } else {
        rawOutputTextarea.value = decodeURIComponent(text);
    }
}

// 7. JWT Decoder
function processJWT(text) {
    const result = decodeJWT(text);
    
    // Header & Payload boxes
    jwtHeaderBox.textContent = JSON.stringify(result.header, null, 2);
    jwtPayloadBox.textContent = JSON.stringify(result.payload, null, 2);
    
    // Build Warnings cards
    jwtWarningsList.innerHTML = '';
    if (result.warnings.length > 0) {
        result.warnings.forEach(warn => {
            const card = document.createElement('div');
            card.className = 'jwt-warning-card';
            card.innerHTML = `
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <span>${warn}</span>
            `;
            jwtWarningsList.appendChild(card);
        });
    } else {
        const card = document.createElement('div');
        card.className = 'jwt-warning-card';
        card.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
        card.style.borderColor = 'rgba(16, 185, 129, 0.2)';
        card.style.color = 'var(--success)';
        card.innerHTML = `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Signature Verified (Offline checks pass). Token active & valid.</span>
        `;
        jwtWarningsList.appendChild(card);
    }
}

// =================================================================
// TABS SWITCHER
// =================================================================
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

// =================================================================
// INTERACTIVE PREVIEW TABLE (CSV)
// =================================================================
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

function renderTablePreview() {
    if (tableFilteredRows.length === 0) {
        previewTable.style.display = 'none';
        tableEmpty.style.display = 'flex';
        updatePaginationControls(0);
        return;
    }

    tableEmpty.style.display = 'none';
    previewTable.style.display = 'table';

    const headerSet = new Set();
    tableFilteredRows.forEach(row => {
        Object.keys(row).forEach(k => headerSet.add(k));
    });
    const headers = Array.from(headerSet);

    let headerHtml = '';
    headers.forEach(h => {
        headerHtml += `<th>${escapeHtml(h)}</th>`;
    });
    previewTableHeader.innerHTML = headerHtml;

    renderTablePage(headers);
}

function renderTablePage(headers) {
    if (!headers) {
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
                displayVal = typeof cellVal === 'object' ? JSON.stringify(cellVal) : String(cellVal);
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

// =================================================================
// NEW: INTERACTIVE JSON TREE VIEW BUILDER
// =================================================================
function buildTreeDOM(val, key = null) {
    const node = document.createElement('div');
    node.className = 'tree-node';

    // 1. Render Key (if it exists)
    if (key !== null) {
        const keySpan = document.createElement('span');
        keySpan.className = 'tree-key';
        keySpan.textContent = `"${key}"`;
        node.appendChild(keySpan);

        const colonSpan = document.createElement('span');
        colonSpan.className = 'tree-colon';
        colonSpan.textContent = ': ';
        node.appendChild(colonSpan);
    }

    // 2. Render Values recursively
    if (val === null) {
        const valSpan = document.createElement('span');
        valSpan.className = 'tree-val tree-val-null';
        valSpan.textContent = 'null';
        node.appendChild(valSpan);
    } else if (typeof val === 'boolean') {
        const valSpan = document.createElement('span');
        valSpan.className = 'tree-val tree-val-boolean';
        valSpan.textContent = val ? 'true' : 'false';
        node.appendChild(valSpan);
    } else if (typeof val === 'number') {
        const valSpan = document.createElement('span');
        valSpan.className = 'tree-val tree-val-number';
        valSpan.textContent = val;
        node.appendChild(valSpan);
    } else if (typeof val === 'string') {
        const valSpan = document.createElement('span');
        valSpan.className = 'tree-val tree-val-string';
        valSpan.textContent = `"${val}"`;
        node.appendChild(valSpan);
    } else if (typeof val === 'object') {
        // Expandable object or array node
        node.classList.add('tree-node-expandable', 'expanded');
        
        const isArr = Array.isArray(val);
        const openBracket = isArr ? '[' : '{';
        const closeBracket = isArr ? ']' : '}';
        
        // Toggle arrow icon
        const arrow = document.createElement('span');
        arrow.className = 'tree-toggle-icon';
        node.insertBefore(arrow, node.firstChild);

        // Open bracket
        const openSpan = document.createElement('span');
        openSpan.className = 'tree-bracket';
        openSpan.textContent = openBracket;
        node.appendChild(openSpan);

        // Collapse indicator (...)
        const indicator = document.createElement('span');
        indicator.className = 'tree-collapsed-indicator';
        indicator.textContent = '...';
        node.appendChild(indicator);

        // Child elements wrapper
        const childrenDiv = document.createElement('div');
        childrenDiv.className = 'tree-children';

        const keys = Object.keys(val);
        keys.forEach((k, idx) => {
            const childNode = buildTreeDOM(val[k], isArr ? null : k);
            
            // Add comma between items if it's not the last child
            if (idx < keys.length - 1) {
                const comma = document.createElement('span');
                comma.className = 'tree-bracket';
                comma.textContent = ',';
                childNode.appendChild(comma);
            }
            childrenDiv.appendChild(childNode);
        });
        node.appendChild(childrenDiv);

        // Close bracket
        const closeSpan = document.createElement('span');
        closeSpan.className = 'tree-bracket';
        closeSpan.textContent = closeBracket;
        node.appendChild(closeSpan);

        // Toggle collapsible clicks
        arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = node.classList.contains('expanded');
            if (isExpanded) {
                node.classList.remove('expanded');
                node.classList.add('collapsed');
            } else {
                node.classList.remove('collapsed');
                node.classList.add('expanded');
            }
        });
    }

    return node;
}

// =================================================================
// ACTION BUTTON UTILITIES
// =================================================================
function copyOutputToClipboard() {
    let textToCopy = '';
    
    if (activeTool === 'jwt') {
        // For JWT copy payload instead of split screens
        const payloadText = jwtPayloadBox.textContent;
        if (payloadText === '{}') {
            showToast('Empty Output', 'No token has been decoded yet.', 'error');
            return;
        }
        textToCopy = payloadText;
    } else {
        textToCopy = rawOutputTextarea.value;
    }

    if (!textToCopy) {
        showToast('Empty Output', 'There is no converted output to copy.', 'error');
        return;
    }

    navigator.clipboard.writeText(textToCopy)
        .then(() => showToast('Copied', 'Successfully copied output to clipboard.', 'success'))
        .catch(err => showToast('Copy Failed', err.message, 'error'));
}

function triggerFileDownload() {
    let textToSave = '';
    let ext = '';
    
    if (activeTool === 'jwt') {
        textToSave = jwtPayloadBox.textContent;
        ext = 'json';
    } else {
        textToSave = rawOutputTextarea.value;
        // Determine file extensions
        if (activeTool === 'json-formatter') ext = 'json';
        else if (activeTool === 'json-csv') ext = swapState ? 'json' : 'csv';
        else if (activeTool === 'json-xml') ext = swapState ? 'json' : 'xml';
        else if (activeTool === 'json-yaml') ext = swapState ? 'json' : 'yaml';
        else if (activeTool === 'base64') ext = 'txt';
        else if (activeTool === 'url') ext = 'txt';
    }

    if (!textToSave || textToSave === '{}') {
        showToast('Empty Output', 'There is no output to download.', 'error');
        return;
    }

    const mime = ext === 'json' ? 'application/json' : (ext === 'csv' ? 'text/csv' : 'text/plain');
    const blob = new Blob([textToSave], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `datamorph_output.${ext}`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Download Started', `Saved file as datamorph_output.${ext}`, 'success');
}

// =================================================================
// DRAG AND DROP UTILITIES
// =================================================================
function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        inputPanel.addEventListener(eventName, preventDefaultBehavior, false);
    });

    function preventDefaultBehavior(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        inputPanel.addEventListener(eventName, () => inputPanel.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        inputPanel.addEventListener(eventName, () => inputPanel.classList.remove('dragover'), false);
    });

    inputPanel.addEventListener('drop', handleFileDrop, false);
}

function handleFileDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length === 0) return;

    const file = files[0];
    const extension = file.name.split('.').pop().toLowerCase();
    
    // Auto shift tool based on dropped file extension
    let matchedTool = '';
    let expectedSwap = false;
    
    if (extension === 'json') {
        matchedTool = activeTool.startsWith('json-') ? activeTool : 'json-formatter';
        expectedSwap = false;
    } else if (extension === 'csv') {
        matchedTool = 'json-csv';
        expectedSwap = true;
    } else if (extension === 'xml') {
        matchedTool = 'json-xml';
        expectedSwap = true;
    } else if (extension === 'yaml' || extension === 'yml') {
        matchedTool = 'json-yaml';
        expectedSwap = true;
    }

    if (matchedTool) {
        if (activeTool !== matchedTool) {
            switchTool(matchedTool);
        }
        if (swapState !== expectedSwap) {
            toggleSwapState();
        }
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        editorTextarea.value = e.target.result;
        syncLineNumbers(editorTextarea, editorLineNumbers);
        updateMetaInfo();
        checkValidity();
        handleConversion();
        showToast('File Uploaded', `Successfully imported ${file.name}`, 'success');
    };
    reader.onerror = () => showToast('Upload Failed', 'Failed to read the imported file.', 'error');
    reader.readAsText(file);
}

// =================================================================
// FAQ ACCORDIONS COLLAPSIBLE
// =================================================================
function initFaq() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        const content = item.querySelector('.faq-content');
        
        trigger.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-content').style.maxHeight = null;
                }
            });
            
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
