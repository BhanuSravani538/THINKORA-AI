# THINKORA — AI-Powered Research Intelligence

> **From scattered knowledge to confident decisions.**

THINKORA is an AI-powered research intelligence and decision-support platform designed for students, researchers, professionals, and organizations. It transforms scattered documents and contradictory findings into structured, auditable evidence graphs and interactive decision simulators.

---

## 🌟 Core Value Proposition

- **Analyze Documents**: Upload and ingest multi-page research reports, technical specifications, and audits with layout-aware extraction.
- **Trace Claims to Evidence**: Inspect line-level provenance and quotes directly anchored to the source passage.
- **Identify Contradictions**: Detect empirical discrepancies, statistical variations, and methodology divergences across sources.
- **Discover Missing Information**: Surface missing criteria, evidence gaps, and unreported variables with actionable next-step collection recommendations.
- **Make Confident Decisions**: Simulate what-if scenarios with real-time constraint recalculation separating hard constraints from weighted preferences.

---

## 🏗️ Architecture

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide icons, React Flow architecture.
- **Backend**: Node.js, Express.js, TypeScript, Zod validation, `pdf-parse` Unicode NFC extraction, JWT authentication, and Supabase PostgreSQL schema.
- **Decision Engine**: Deterministic multi-criteria scoring engine with explicit unit/currency tracking (INR ₹, USD $), missing value preservation (`null`), and dynamic evidence completeness indicators.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Full Application (Frontend & Backend)
```bash
# Terminal 1: Backend Express API (port 5000)
npm run server:dev

# Terminal 2: Frontend Vite App (port 5173)
npm run dev
```

### 3. Run Test Suites
```bash
# Test decision simulator logic
npx tsx tests/decisionSimulator.test.ts

# Test currency parsing, Unicode NFC, and glyph recovery
npx tsx tests/currencyParsing.test.ts

# Test evidence completeness indicator
npx tsx tests/evidenceCompleteness.test.ts

# Test backend PDF extraction
npx tsx tests/backendExtraction.test.ts
```

---

## 📄 License
MIT © THINKORA Intelligence Platform
