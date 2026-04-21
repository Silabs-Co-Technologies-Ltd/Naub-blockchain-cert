# NITDA Blockchain Certificate System

A blockchain-powered digital certificate system for IT service providers, built for the National Information Technology Development Agency (NITDA) of Nigeria.

## 🎯 What We Built

This system provides a secure, tamper-proof way to issue and verify digital certificates for IT service providers. Each certificate is cryptographically secured and permanently recorded on the blockchain, ensuring authenticity and preventing forgery.

### Key Features

- ✅ **Real Blockchain Integration** - Uses Polygon Amoy testnet for actual transactions
- ✅ **Tamper-Proof Certificates** - SHA-256 cryptographic hashing
- ✅ **Public Verification** - Anyone can verify certificates using blockchain
- ✅ **AI Verification Summary** - Intelligent multilingual analysis (English, Yoruba, Hausa)
- ✅ **AI Dashboard Insights** - Gemini-powered analytics and portfolio analysis
- ✅ **Expiry Auto-Flagging** - Automated renewal queue with AI brief
- ✅ **Anomaly Detection** - AI-monitored suspicious verification patterns
- ✅ **AI Application Review** - Risk assessment before certificate issuance
- ✅ **Renewal Guidance Chatbot** - Interactive AI assistant for expired certificates
- ✅ **AI Renewal Notices** - Gemini-drafted formal renewal emails
- ✅ **Natural Language Search** - Chat-like certificate search for admins
- ✅ **Admin Dashboard** - Complete certificate management interface
- ✅ **QR Code Support** - Easy certificate sharing and verification
- ✅ **Responsive Design** - Works on desktop and mobile devices

---

## 🤖 AI Features

All AI features use **Google Gemini 2.0 Flash** and include graceful fallbacks when no API key is configured.

### 1. Multilingual Verification Summary (Public)

Automatically generated on every certificate verification — in English, Yoruba, and Hausa.

```
🇬🇧 ENGLISH: This certificate, issued to TechBridge Solutions under the Cybersecurity 
Services category, was validated successfully on the blockchain. It remains valid 
until Dec 2025 and shows no signs of revocation or tampering.

🇳🇬 YORUBA: Iwe-ẹri yii, ti a fi fun TechBridge Solutions labẹ ẹka Cybersecurity 
Services, ti jẹrisi ni aaye lori blockchain...

🇳🇬 HAUSA: Wannan takardar shaida, wacce aka ba wa TechBridge Solutions a ƙarƙashin 
rukunin Cybersecurity Services, an tabbatar da ita a kan blockchain...
```

- Context-aware: different summaries for valid / expired / revoked certificates
- Falls back to template-based summaries if API key unavailable

---

### 2. AI Dashboard Insights (Admin)

Gemini analyzes your certificate portfolio and surfaces data-driven insights on every dashboard load.

**Example output:**
```
1. 8 of 12 certificates (67%) are currently active and valid.
2. 3 certificates expired this quarter — ISP and Cybersecurity categories are most affected.
3. 47 verifications in the last 7 days indicate active usage by procurement teams.
4. 2 certificates issued this month; 1 revocation on record.
```

- Refreshable on demand via "Refresh" button
- Powered by live certificate and verification data

---

### 3. Expiry Auto-Flagging & Renewal Queue (Admin)

Certificates are automatically bucketed into three urgency tiers, with an AI-generated executive brief at the top.

| Tier | Criteria | Color |
|------|----------|-------|
| Critical | Expiring within 7 days | Red |
| Warning | Expiring within 8–30 days | Yellow |
| Expired | Already past expiry date | Gray |

- Sorted by most-urgent-first within each tier
- Each entry is clickable, linking directly to the certificate detail page
- AI brief summarizes the situation and recommends specific actions

---

### 4. Anomaly / Suspicious Verification Detection (Admin)

The system continuously analyzes verification logs for suspicious patterns:

| Pattern | Trigger | Severity |
|---------|---------|---------|
| High-Frequency Lookup | Same cert verified >10× in 1 hour | Medium / High |
| Bulk Scanning | Same IP checks >5 different certs in 1 hour | Medium / High |
| Elevated Volume | >4× verification-to-cert ratio in 24 hours | Low |

- Anomaly cards appear on the dashboard only when issues are detected
- Each alert includes type, severity badge, and a plain-English explanation

---

### 5. AI Application Review Assistant (Admin — Issue Page)

Before issuing a certificate, admins can run an AI risk review on the applicant's data.

**What it checks:**
- Company name legitimacy for Nigerian IT providers
- Email domain (flags free providers like Gmail/Yahoo)
- Phone number format (Nigerian +234 standard)
- Address completeness and specificity
- Field consistency and cross-field plausibility

**Output:**
```
RISK: medium
FLAGS: Free email provider detected, Phone number appears short
RECOMMENDATION: Verify company registration and phone number before issuing.
```

Risk levels: `low` (green) / `medium` (yellow) / `high` (red). Certificate issuance is never blocked — the admin makes the final call.

---

### 6. Renewal Guidance Chatbot (Public — Verify Page)

When a verified certificate is **expired or revoked**, a chat widget appears on the verification page.

**Example conversation:**
```
User: What documents do I need to renew?
AI:   For Cybersecurity Services renewal, you'll need: updated CAC registration, 
      evidence of continued operations in the Cybersecurity sector, a completed 
      NITDA renewal form, and your latest tax clearance certificate.

User: How long does the process take?
AI:   The renewal process typically takes 2–4 weeks from submission of complete 
      documentation. Submit all documents together to avoid delays.
```

- Maintains conversation history within the session
- Category-specific answers based on the certificate being viewed
- Falls back to template responses without an API key

---

### 7. AI-Drafted Renewal Notices (Admin — Certificate Detail)

For expired or revoked certificates, admins can generate a formal renewal notice email with one click.

**Features:**
- Subject line and full email body generated by Gemini
- Category-specific document requirements
- Official NITDA tone and formatting
- "Copy to Clipboard" and "Open in Email Client" (mailto) actions

**Example:**
```
Subject: NITDA Certificate Renewal Required – NITDA-2024-001234

Dear TechBridge Solutions,

This is an official notice from the National Information Technology Development 
Agency (NITDA)...
```

---

### 8. Natural Language Search (Admin — Dashboard)

Toggle "AI Search" on the certificate table to search using plain English instead of exact IDs.

**Example queries:**
- `"expired cybersecurity certs"` → filters expired certificates in Cybersecurity category
- `"valid ISP providers"` → shows valid Network Infrastructure certificates
- `"certs expiring before June"` → applies a date filter
- `"TechVision"` → searches by company name fragment

Gemini parses the query into structured filters (status, category, date range, text search). Falls back to keyword matching without an API key.

---

## 🔒 Why Blockchain? Security Over Database-Only

### The Problem with Database-Only Systems

Traditional database systems have critical vulnerabilities:

```
Database-Only System:
┌─────────────────┐
│   Admin Panel   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Database      │ ◄─── Single point of failure
│   (Centralized) │
└─────────────────┘
```

**Major Security Issues:**
- ❌ **Single Point of Failure** - If database is compromised, all certificates are at risk
- ❌ **Admin Privileges** - Admins can modify/delete any certificate with no trace
- ❌ **No Tamper Evidence** - Changes leave no permanent audit trail
- ❌ **Trust Issues** - Users must trust the organization completely
- ❌ **Data Loss Risk** - Database corruption or deletion affects everything

### Our Blockchain-Enhanced Security

```
Blockchain Certificate System:
┌─────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │   Public        │
└─────────────────┘    │   Verification  │
         │              └─────────────────┘
         ▼                       │
┌─────────────────┐              │
│   Database      │              │
│   (Local Cache) │              ▼
└─────────────────┘    ┌─────────────────┐
         │              │   Blockchain    │
         │              │   (Immutable)   │
         └──────────────► │   Network      │
                        └─────────────────┘
```

**Security Benefits:**

#### 1. **Immutability - Permanent Records**
Once a certificate is recorded on blockchain, it cannot be changed:
```javascript
// Database-Only (Vulnerable):
certificate.status = "revoked";  // ✅ Easy to change, no evidence
certificate.companyName = "Fake Company";  // ✅ No detection possible

// Blockchain (Secure):
// ❌ Impossible to modify existing records
// ✅ Every change creates new transaction
// ✅ Permanent audit trail forever
```

#### 2. **Decentralization - No Single Point of Control**
Even if our servers are compromised, blockchain records remain intact.

#### 3. **Cryptographic Proof - Tamper Detection**
Every certificate has a unique SHA-256 hash:
```javascript
const hash = crypto.createHash("sha256")
  .update(JSON.stringify(certificateData))
  .digest("hex");
// Result: 0x9d282b84125eed830f545a721e9f49400fab1e90f3b59b17e8dbba7a3a64bd70
```

#### 4. **Public Verification - Independent Trust**
Anyone can verify certificates without trusting our database.

#### 5. **Complete Audit Trail**
Blockchain provides permanent history of all changes.

---

## 🏗️ How We Built This

### Technology Stack

#### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons
- **React Hook Form + Zod** - Form management and validation

#### Backend
- **Next.js API Routes** - Serverless API endpoints
- **File-based Storage** - JSON file storage for certificates
- **Blockchain Integration** - Real blockchain transactions

#### AI
- **Google Gemini 2.0 Flash** (`@google/genai`) - All AI features
- Template-based fallbacks for every AI feature (no API key required for core functionality)

#### Blockchain
- **Ethers.js v6** - Ethereum library for blockchain interactions
- **Polygon Amoy Testnet** - Low-cost testnet for development
- **SHA-256 Hashing** - Cryptographic certificate hashing

---

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Blockchain    │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   (Polygon)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   File Storage  │    │   Transaction   │
│   (Radix UI)    │    │   (JSON Files)  │    │   Records       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────┐
│   Google Gemini AI                  │
│   (Insights, Alerts, Chat, Review)  │
└─────────────────────────────────────┘
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/certificates/issue` | POST | Issue new certificate |
| `/api/verify/[id]` | GET | Verify certificate authenticity |
| `/api/verify/summary` | POST | Generate AI multilingual summary |
| `/api/verify/log` | POST | Log verification event |
| `/api/admin/analytics` | GET | Certificate statistics |
| `/api/admin/insights` | GET | AI-generated portfolio insights |
| `/api/admin/expiry-alerts` | GET | Expiry flagging with AI brief |
| `/api/admin/anomalies` | GET | Suspicious verification detection |
| `/api/admin/draft-renewal-notice` | POST | AI-drafted renewal email |
| `/api/admin/nl-search` | POST | Natural language certificate search |
| `/api/ai/review-application` | POST | Risk review for new applications |
| `/api/ai/renewal-chat` | POST | Renewal guidance chatbot |
| `/api/certificates/[id]/revoke` | POST | Revoke a certificate |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm package manager
- MetaMask wallet (for blockchain transactions)
- Google Gemini API key (optional — all AI features fall back to templates)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nitda-blockchain-cert
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create `.env.local` file:
   ```env
   # Polygon Amoy testnet configuration
   TEST_WALLET_PRIVATE_KEY=your_private_key_here
   TESTNET_RPC_URL=https://rpc-amoy.polygon.technology

   # Google Gemini AI (optional — fallbacks work without this)
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Get test tokens**
   - Visit [Polygon Faucet](https://faucet.polygon.technology)
   - Get free test MATIC tokens for transactions

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Public verification: `http://localhost:3000`
   - Admin dashboard: `http://localhost:3000/admin`

### Admin Access

- **Username**: `admin@nitda.gov.ng`
- **Password**: `admin123`

---

## 🔧 Technical Implementation Details

### Blockchain Integration

#### Transaction Flow
1. **Certificate Data** → JSON string
2. **SHA-256 Hash** → Cryptographic hash generation
3. **Blockchain Transaction** → Real transaction on Polygon Amoy
4. **Local Storage** → Cache for fast lookups
5. **Verification** → On-chain validation

#### Gas Optimization
- **Self-transfer transactions** - Minimal gas costs (~0.0007 MATIC)
- **Efficient data storage** - Only hash stored on-chain
- **Local caching** - Reduces blockchain queries

### AI Integration

All AI features share a consistent pattern:
1. Gather relevant data from the database
2. Build a structured prompt with context
3. Call Gemini 2.0 Flash with appropriate temperature and token limits
4. Parse and validate the response
5. Fall back to template output if the API is unavailable or returns an error

```typescript
// Consistent AI call pattern
const ai = new GoogleGenAI({ apiKey });
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash-exp",
  contents: prompt,
  config: {
    temperature: 0.5,
    maxOutputTokens: 200,
    thinkingConfig: { thinkingBudget: 0 }, // Disabled for speed
  },
});
```

### File Structure

```
├── app/                         # Next.js App Router
│   ├── admin/                   # Admin portal
│   │   ├── dashboard/
│   │   │   ├── page.tsx         # Dashboard (insights, expiry, anomalies, NL search)
│   │   │   ├── issue/page.tsx   # Issue form with AI review
│   │   │   └── certificate/[id]/page.tsx  # Detail with renewal notice
│   ├── api/                     # API routes
│   │   ├── admin/
│   │   │   ├── analytics/       # Certificate statistics
│   │   │   ├── insights/        # AI portfolio insights
│   │   │   ├── expiry-alerts/   # Expiry flagging + AI brief
│   │   │   ├── anomalies/       # Suspicious verification detection
│   │   │   ├── draft-renewal-notice/  # AI renewal email drafting
│   │   │   └── nl-search/       # Natural language search
│   │   ├── ai/
│   │   │   ├── review-application/  # Application risk review
│   │   │   └── renewal-chat/    # Renewal guidance chatbot
│   │   ├── certificates/        # Certificate CRUD + issuance
│   │   └── verify/              # Verification + AI summary
│   └── verify/page.tsx          # Public verification + chatbot
├── components/                  # React components
├── lib/                         # Core business logic
│   ├── blockchain.ts            # Blockchain integration
│   ├── database.ts              # Data management
│   └── certificate-utils.ts    # Utilities
└── .data/                       # JSON file storage
```

---

## 🔍 How Verification Works

When someone verifies a certificate:

1. **Enter certificate ID** (e.g., `NITDA-2025-816082150`)
2. **System gets certificate** from database
3. **Retrieves blockchain hash** from certificate record
4. **Checks local cache** for fast response
5. **Verifies on blockchain** (if wallet configured)
6. **Generates AI summary** in English, Yoruba, and Hausa
7. **Shows renewal chatbot** if certificate is expired or revoked

---

## 🛠️ Development

### Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

### Environment Variables

```env
# Required for blockchain transactions
TEST_WALLET_PRIVATE_KEY=your_private_key_here
TESTNET_RPC_URL=https://rpc-amoy.polygon.technology

# Optional — AI features fall back to templates without this
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🔒 Security for Production

### What You Need to Do

- **Environment Variables** - Secure private key storage
- **HTTPS** - Encrypted communication
- **Database Security** - Replace file storage with proper database (PostgreSQL/MongoDB)
- **Access Control** - Implement proper JWT-based authentication
- **Rate Limiting** - Prevent abuse of API endpoints and AI calls

### Blockchain Security

- **Private Key Management** - Use secure key storage solutions (HSM/KMS)
- **Network Security** - Use mainnet for production
- **Gas Management** - Monitor and optimize gas usage
- **Transaction Validation** - Verify all blockchain operations

---

## 📊 Monitoring & Analytics

### Built-in Analytics

- **Certificate Statistics** - Total, valid, expired, revoked counts
- **AI Portfolio Insights** - Gemini-powered trend analysis
- **Expiry Monitoring** - Real-time renewal queue with urgency tiers
- **Verification Logs** - Track certificate lookups
- **Security Anomalies** - Automated suspicious pattern detection

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support or questions:
- **Email**: support@nitda.gov.ng
- **Documentation**: This README
- **Issues**: GitHub Issues

---

**Built with ❤️ for NITDA - Empowering Nigeria's Digital Future**
