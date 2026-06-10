# DataMorph ⇄ Secure JSON & CSV Converter

**DataMorph** is a premium, client-side developer utility web application designed to convert JSON structures to CSV formats and vice versa. It combines a state-of-the-art minimalist interface (inspired by Vercel and Linear) with robust formatting logic, dynamic pagination, and 100% data privacy.

👉 **Hosted Demo:** `https://yourdomain.dev` *(Replace with your live URL after hosting)*

---

## Key Features

- **100% Local Processing (Privacy First):** No backend servers, no analytics, no cookies. All parsing and conversions happen inside the browser sandbox using HTML5 FileReaders.
- **Deep Nested JSON Flattening:** Recursively walks and flattens nested arrays and child object structures into clean dot-notated columns (e.g. `profile.address.zip`) and reconstructs them when unflattening.
- **Interactive Grid Previews:** Features a fast tabular data table showing the parsed records. Sort rows, scroll with custom bars, paginate through pages (20 rows per page), and filter values dynamically using the built-in search bar.
- **RFC 4180 Compliance:** Standard-compliant CSV outputs. Quotes, newlines, and commas inside cells are automatically escaped and structured.
- **Smart Type Inference:** Converts text-based fields in CSV files back to proper Boolean states, Null states, and floating/integer values when parsing into JSON.
- **Drag & Drop Handling:** Toss files directly into the editor. Autodetects extensions (`.json`, `.csv`, `.tsv`) and configures delimiters and layouts instantly.
- **Light/Dark Themes:** Built with a custom variables system toggling between Vercel-like Slate/Zinc Dark Mode (default) and a crisp Light Mode.
- **SEO Optimized:** Ready-to-go Google metadata, semantic tags, and pre-injected JSON-LD Schema structures (`SoftwareApplication` and `FAQPage`) to facilitate Page 1 search rankings.

---

## File Architecture

- **`index.html`** — Landing page markup, navigation, hero, interactive terminal panel, and SEO structured scripts.
- **`styles.css`** — Core layout grid system, dark/light theme definitions, custom scrolls, toast notification layouts, and animations.
- **`converter.js`** — Core utility library containing parsing routines, flattener engines, and RFC 4180 CSV cell sanitizers.
- **`app.js`** — Application UI manager. Attaches event triggers, syncs scrollbars, drives toast popups, and updates interactive previews.
- **`test-converter.js`** — Lightweight Node.js verification test suite to check parsing logic in isolation.

---

## Getting Started

### Local Setup
Since the application runs purely in standard HTML5, CSS, and JS, you do not need to install any external build frameworks or package managers.

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/json-to-csv.git
   cd json-to-csv
   ```
2. Open `index.html` directly in your browser of choice.

3. Alternatively, spin up a simple local dev server:
   ```bash
   python3 -m http.server 8080
   # Open http://localhost:8080
   ```

### Running Logic Unit Tests
If you modify conversion functions inside `converter.js`, you can verify logic changes by running the test suite in Node.js:
```bash
node test-converter.js
```

---

## Hosting (Deploying Live)

This project can be hosted for **free** on any static host.

### Deploying to Vercel
1. Link your GitHub account to [Vercel](https://vercel.com).
2. Click **Add New Project**, select this repository, and click **Deploy**.
3. Once live, register a custom domain (e.g., `datamorph.dev`) and point the GSC (Google Search Console) crawlers to your index for search placement.

---

## License

This project is licensed under the MIT License. Feel free to fork, expand, or embed this utility on your own pages!
