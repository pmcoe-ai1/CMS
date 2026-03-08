---

## 6. Constraints

| ID | Constraint |
|----|-----------|
| 6.1 | When replicating an existing website, all publicly visible content and design must be captured without requiring access to the source site's CMS, database, hosting account, or backend of any kind. |
| 6.2 | When migrating a website to the system, existing URLs must be preserved or properly redirected to maintain current search engine rankings. |
| 6.3 | The system must comply with GDPR, CCPA, and other applicable regional privacy regulations for handling user data, form submissions, cookies, and AI conversation data. |
| 6.4 | AI search optimisation features must not conflict with traditional SEO best practices. The system must optimise for both simultaneously. |
| 6.5 | Tenant data isolation must be enforced at the architecture level. No application-layer bug, misconfiguration, or AI prompt injection may expose one tenant's data to another tenant. |

---

## 7. Acceptance Criteria

The system will be considered acceptable when:

| ID | Criterion |
|----|-----------|
| 7.1 | A non-technical user can create a new page through the AI chat interface, including all content sections, forms, and schema markup, without touching any code. |
| 7.2 | A non-technical user can create a new page through the visual design canvas using drag-and-drop and inline editing, without using the AI chat interface. |
| 7.3 | A non-technical user can update a value across multiple pages by issuing a single natural language instruction through the AI interface. |
| 7.4 | All pages pass Google's Rich Results Test with valid, automatically generated schema markup appropriate to the page type. |
| 7.5 | All pages load in under 3 seconds from designated target regions. |
| 7.6 | When given a public URL of an existing website, the system produces a visually accurate replica without requiring any backend access to the source site. |
| 7.7 | When given a public URL, the system extracts a design system (design-only clone mode) and stores it as W3C Design Tokens that can be applied to new content. |
| 7.8 | Content can be exported to WordPress XML, static HTML, and structured JSON/Markdown formats with all metadata intact. |
| 7.9 | The four default tenant-level user roles (Administrator, Editor, Author, Viewer) function correctly with appropriate access restrictions enforced identically through both the traditional interface and the AI interface. |
| 7.10 | Custom roles with granular permissions can be created and assigned, with permissions enforced through both interfaces. |
| 7.11 | A full site backup can be created and restored through both the traditional interface and the AI interface. |
| 7.12 | The SEO and AI search health dashboard shows 100% schema validation pass rate and no critical issues on all published pages. |
| 7.13 | robots.txt, llms.txt, XML sitemap, and markdown page versions are all automatically generated and stay in sync with content changes. |
| 7.14 | Every page automatically contains structured answer blocks, question-based headings, and FAQPage schema where applicable, without manual intervention. |
| 7.15 | The AI visibility monitoring dashboard accurately tracks citations across at least 3 major AI platforms. |
| 7.16 | Content freshness alerts trigger correctly when pages exceed the configured staleness threshold. |
| 7.17 | All uploaded and extracted website assets are stored independently and remain accessible even if the original source website becomes unavailable. |
| 7.18 | All pages automatically include correct meta titles (under 60 chars, keyword in first 60 chars), meta descriptions (under 160 chars), canonical URLs, and Open Graph tags without manual intervention. |
| 7.19 | The traditional SEO dashboard correctly displays keyword rankings, organic traffic, CTR, index coverage, Core Web Vitals, and backlink data sourced from Google Search Console and Analytics integrations. |
| 7.20 | The system correctly identifies and alerts on SEO issues: orphan pages, broken internal links, missing schema, duplicate content, thin content, Core Web Vitals failures, and pages excluded from index. |
| 7.21 | All pages pass Google's mobile-friendly test and render identically to desktop content under mobile-first indexing. |
| 7.22 | Hub-and-spoke topic cluster architecture is supported, with automatic internal linking between hub and spoke pages when topics are related. |
| 7.23 | A new tenant can be provisioned through the platform administrator interface and is operational (with workspace, default roles, and initial admin account) without manual infrastructure configuration. |
| 7.24 | A user with memberships in multiple tenants can log in, select a tenant, and operate entirely within that tenant's data — with no visibility into any other tenant's content, users, or configuration. |
| 7.25 | SSO via SAML 2.0 or OIDC can be configured independently per tenant, with one tenant using Okta and another using Microsoft Entra ID simultaneously on the same CMS installation. |
| 7.26 | Multi-step content approval workflows can be configured per tenant with role-based routing and notification at each step. |
| 7.27 | The visitor AI chat widget on a published website correctly answers natural language questions using the publishing tenant's content and does not reveal information from other tenants or from admin-only content. |
| 7.28 | External AI agents can discover and query a tenant's website through the MCP server endpoint, with OAuth 2.1 authentication enforced and all interactions logged in the tenant-scoped audit trail. |

---

## 8. Out of Scope

| Item | Reason |
|------|--------|
| Hosting infrastructure provision | The CMS is deployable to the user's chosen hosting platform. The system does not provide hosting services. Hosting selection, provisioning, and management are the user's responsibility. |
| E-commerce with full inventory management | Simple payment form and checkout integration is in scope. Full product catalogue, inventory tracking, warehouse management, and order management are not. |
| Native mobile application | Website only. Responsive design and progressive web app (PWA) capabilities cover mobile access. The visitor-facing AI interface (section 5.10) is accessible via mobile browser. |
| Custom API development beyond specified protocols | MCP, A2A, ACP, and UCP protocol endpoints are in scope. Custom API development for bespoke integrations beyond these protocols is not required for the initial version. |
| Off-site SEO activities | The system handles on-site optimisation. Off-site activities (PR, directory listings, social media management, review solicitation, link building) are outside the system's scope. The system may provide recommendations for off-site activities but does not execute them. |

---

## 9. Dependencies

| ID | Dependency |
|----|-----------|
| 9.1 | Public URL of any website the user wishes to replicate. No backend access, credentials, or source code access to the source site is required. |
| 9.2 | Third-party service account credentials (payment processor, email marketing, analytics) provided by the tenant for integrations they choose to enable. |
| 9.3 | Domain registrar access for DNS configuration when connecting a custom domain. |
| 9.4 | Brand assets (logo files, colour codes, fonts) provided by the tenant if not extractable from the source website during replication. |
| 9.5 | Identity provider configuration (SAML/OIDC metadata, SCIM API credentials) provided by each tenant that chooses to enable SSO or automated user provisioning. |

---

## 10. Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| Time for non-technical user to create a new page | Under 10 minutes via either AI chat or visual editor | From launch |
| Time for non-technical user to update content across site | Under 5 minutes via AI chat | From launch |
| Page load time (designated target regions) | Under 3 seconds | From launch |
| Schema validation pass rate | 100% of published pages | From launch |
| Google Core Web Vitals pass rate | 100% of published pages | From launch |
| AI search optimisation completeness (schema, robots.txt, llms.txt, sitemap, answer blocks, markdown versions) | 100% of published pages | From launch |
| Content export completeness | 100% of content recoverable in standard formats | From launch |
| Website replication visual accuracy | 95%+ match to source site as assessed by user | Per replication |
| AI citation rate improvement | Measurable increase over baseline within 90 days of launch | 90 days post-launch |
| Content freshness compliance | 100% of pages updated within configured staleness threshold | Ongoing |
| Organic traffic growth | Measurable increase in organic search traffic within 6 months | 6 months post-launch |
| Keyword ranking improvement | Target keywords ranking on page 1 within 6 months | 6 months post-launch |
| Index coverage health | 100% of intended pages indexed, 0 critical errors | From launch |
| Mobile-first compliance | 100% of pages pass mobile-friendly test | From launch |
| SEO issue detection accuracy | System correctly identifies 95%+ of common SEO issues | From launch |
| Tenant provisioning time | New tenant operational within 5 minutes of creation | From launch |
| Cross-tenant data isolation | Zero cross-tenant data leakage incidents | Ongoing |

---

## Appendix A: AI Search Optimisation Research Basis

The AI search optimisation requirements in this document are grounded in the following research:

| Finding | Source | Relevant Requirement |
|---------|--------|---------------------|
| Pages with comprehensive schema are 2.7x more likely to be cited in AI answers | BrightEdge, January 2026 | 5.17.1.1 |
| Citing credible sources = up to +115% AI visibility improvement | Princeton KDD 2024 study (10,000 queries) | 5.17.3.7 |
| Adding statistics = +40% AI visibility improvement | Princeton KDD 2024 study | 5.17.3.6 |
| Keyword stuffing = negative impact on AI visibility | Princeton KDD 2024 study | 5.17.3.8 |
| Brand mentions correlate 0.664 with AI Overview visibility (strongest signal) | Ahrefs, 75,000 brands | 5.17.4.1 |
| 34% of AI citations come from PR-driven coverage | BrightEdge | Out of scope (off-site) |
| Content structured for chunk-level retrieval is 50% more likely to be cited | Onely analysis | 5.17.3.1 |
| Pages not refreshed quarterly are 3x more likely to lose AI citations | AirOps research | 5.17.5.2 |
| Content with 19+ data points earns nearly 2x ChatGPT citations | Siege Media / BrightEdge | 5.17.3.6 |
| 52% of Gemini citations come from brand-owned websites | Yext, 6.8M citations | 5.17.6.1 |
| ChatGPT draws primarily from directories and list articles | Yext, 6.8M citations; First Page Sage | 5.17.6.1 |
| Perplexity prioritises factual density and niche directories | Yext, 6.8M citations | 5.17.6.1 |
| Wikipedia = 47.9% of ChatGPT's top 10 sources | Onely analysis | Out of scope (off-site) |
| Voice commerce projected to reach $80 billion annually | Industry forecast | 5.17.6.3 |
| AI search visitors convert at 3-4x rate of traditional organic | Industry data, 2026 | 5.18.2.3 |
| GEO can boost AI visibility by up to 40% | Princeton KDD 2024 study | 5.17 (all AI search sections) |

## Appendix B: AI Crawler Reference

| Crawler User Agent | Platform | Purpose |
|-------------------|----------|---------|
| GPTBot | OpenAI / ChatGPT | Training data + search |
| ChatGPT-User | OpenAI | Real-time search |
| ClaudeBot | Anthropic / Claude | Real-time search |
| PerplexityBot | Perplexity | Real-time indexing + search |
| Google-Extended | Google Gemini / AI Overviews | AI features |
| Bytespider | ByteDance AI | Training + search |
| CCBot | Common Crawl | Training data |
| Applebot-Extended | Apple Intelligence | AI features |
| cohere-ai | Cohere | Training + search |
| anthropic-ai | Anthropic | Training |

## Appendix C: Traditional SEO Research Basis

The traditional SEO requirements in this document are grounded in the following research:

| Finding | Source | Relevant Requirement |
|---------|--------|---------------------|
| Content quality = ~26% of Google ranking algorithm (top factor) | First Page Sage, Q1 2025 (15-year continuous study) | 5.16.1 |
| Backlinks = ~13% of ranking algorithm | First Page Sage, Q1 2025 | Out of scope (off-site) |
| Niche expertise / topical authority = ~13% of algorithm | First Page Sage, Q1 2025 | 5.13.13 |
| Searcher engagement = ~12% of algorithm | First Page Sage, Q1 2025 | 5.16.1 |
| Trustworthiness = ~9% of algorithm | First Page Sage, Q1 2025 | 5.16.3 |
| Keyword in meta title = ~7% of algorithm | First Page Sage, Q1 2025 | 5.13.1 |
| Text relevance = 0.47 correlation with rankings (highest single signal) | Semrush, 2024 ranking factor study | 5.16.1 |
| Top 3 Google results capture 68.7% of all clicks | AIOSEO | 5.13.1 |
| Over 90% of searchers only click page 1 results | Multiple studies | 5.13.1 |
| Google rewrites 60–70% of title tags | Industry observation | 5.13.1 |
| Mobile = 62.5% of global website traffic | 2025 data | 5.14.7 |
| 1-second page load delay = 20% conversion loss | Google internal research | 5.14.6 |
| Google processes 8.5 billion searches per day | Google | General context |
| ~90% of web pages get zero organic traffic | Ahrefs | 5.16.1 |
| Google maintains up to 20 versions of your pages | 2024 Google API leak | 5.16.4 |
| Helpful Content System integrated into core algorithm | Google, March 2024 | 5.16.2 |
| INP replaced FID as Core Web Vital | Google, 2024 | 5.14.6 |
| AI Overviews trigger on ~16–18% of commercial queries | Industry data, late 2025 | 5.17.6.1 |
| Social signals confirmed as local ranking factor | Whitespark, 2026 | 5.18.1.4 |
| 72% of marketers say digital PR > traditional link building | Industry survey | Out of scope (off-site) |
| Backlinks declined from 50%+ to ~13% of algorithm over past decade | First Page Sage historical data | Context |
| Google treats brands as entities, not just URL collections | 2024 API leak; industry consensus | 5.17.4.1 |
| Schema markup enables rich results with significantly higher CTR | Multiple studies | 5.15.1 |
| ISR is preferred rendering architecture for 2026 over CSR | Yotpo technical SEO guide | 5.14.3 |
