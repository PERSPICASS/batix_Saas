# 💰 STRATÉGIE DE PRICING & VALUATION - BATIX SaaS

**Document:** Pricing Strategy & M&A Valuation  
**Date:** 30 Juin 2026  
**Horizon:** Post Quick Wins + Phase 1 (12 mois)

---

## 📊 PHASE 1: ANALYSE CONCURRENTIELLE

### Positionnement BATIX après implémentations

```
BEFORE (Aujourd'hui)          AFTER (Post Phase 1)          COMPETITOR
─────────────────────         ────────────────────          ──────────
Commerce SaaS                 ERP Complet                   
├─ Ventes                     ├─ Ventes + Facturation      ODOO
├─ Stocks                     ├─ Stocks + Logistique       
├─ CRM basique                ├─ CRM complet               
├─ Analytics basique          ├─ Analytics avancé          
└─ Paiements 4x               ├─ Comptabilité              
                              ├─ RH/Paies                  
                              ├─ Budgeting                 
                              ├─ Conformité                
                              └─ APIs publiques            
```

### Comparaison avec concurrents

```
FEATURE SET                 BATIX    Odoo    SAP     NetSuite
─────────────────────────────────────────────────────────────
Ventes/Invoicing            ✅✅     ✅✅    ✅✅    ✅✅
Comptabilité                ✅✅     ✅✅    ✅✅    ✅✅
RH/Paies                    ✅✅     ✅      ✅✅    ✅✅
CRM                         ✅✅     ✅      ❌      ✅✅
Stocks/Logistique           ✅✅     ✅✅    ✅✅    ✅✅
E-commerce                  ✅       ✅      ✅      ✅
Reporting/BI                ✅✅     ✅✅    ✅✅    ✅✅
APIs/Integrations           ✅✅     ✅✅    ✅      ✅✅
Open Source                 ✅✅     ✅      ❌      ❌
Multi-tenant                ✅✅     ✅      ❌      ✅
─────────────────────────────────────────────────────────────
AVANTAGES BATIX:
✅ 100% customizable (open source)
✅ Modern tech stack (React + Laravel + TypeScript)
✅ Native multi-tenant (vs Odoo's fragile)
✅ Lower TCO than SAP/NetSuite
✅ Faster deployment than competitors
```

---

## 🎯 PRICING MODEL RECOMMANDÉ

### Strategy: Tiered SaaS + Professional Services

```
TIER 1: STARTUP              TIER 2: GROWTH              TIER 3: ENTERPRISE
────────────────────         ──────────────────          ──────────────────
$99/mois                     $499/mois                   Custom pricing

Users: 5                     Users: 20                   Users: Unlimited
Shops: 1                     Shops: 5                    Shops: Unlimited
Products: 10,000             Products: 100,000           Products: Unlimited
Storage: 5GB                 Storage: 100GB              Storage: Unlimited

Inclus:                      Inclus:                     Inclus:
✅ Basic CRM                 ✅ Advanced CRM             ✅ Everything
✅ Invoicing                 ✅ Full Accounting          ✅ Dedicated support
✅ Stock mgmt                ✅ Advanced Reporting       ✅ Custom features
✅ Reports                   ✅ HR/Payroll (5 users)     ✅ SSO/LDAP
✅ Email support             ✅ API access               ✅ SLA 99.9%
                             ✅ Priority support         ✅ Custom development
                                                         ✅ Data migration
                             FEATURES PAR RAPPORT À T1:
                             +40% (Comptabilité complete)
                             +Avancé reporting
                             +Paies (jusqu'à 5 users)
                             +API calls (10k/jour)
```

### Add-ons & Modules supplémentaires

```
CORE (included all tiers)
├─ Ventes & Invoicing
├─ CRM basique
├─ Stocks
└─ Basic Reports

TIER 2+
├─ Full Accounting ........................ Included
├─ Advanced Analytics ..................... Included
└─ HR/Payroll (5 users) .................. Included

OPTIONAL ADD-ONS (tous tiers)
├─ Extra Users (per user/month) ........... $15
├─ Extra Shops (per shop/month) ........... $25
├─ Advanced HR/Payroll
│  ├─ Additional Payroll Users (5-20) .... +$100
│  ├─ Leave Management Module ............ +$50
│  └─ Attendance Integration ............. +$50
├─ Supply Chain Management ............... +$150
├─ Project Management .................... +$75
├─ Advanced Reporting/BI ................. +$100
├─ Email Integrations .................... +$30
├─ Custom API Rate Limit (100k calls) .... +$75
├─ White Label (Branded) ................. +$500
└─ Dedicated Server ...................... +$1000
```

### Volume Discounts

```
ANNUAL COMMITMENT
Tier 1: -15% ($84/month effective)
Tier 2: -20% ($399/month effective)
Tier 3: -25% (negotiable)

2+ SHOPS
-10% total monthly

3+ YEARS
-30% total monthly
```

---

## 💹 REVENUE PROJECTIONS (12 mois après Phase 1)

### Conservative Scenario

```
MONTH    T1 USERS   T2 USERS   T3 USERS   MRR         ARR
─────────────────────────────────────────────────────────
Month 1      50          10         1      $7,500      $90k
Month 2      75          15         2      $12,000     $144k
Month 3     100          20         3      $16,500     $198k
Month 4     150          30         4      $26,000     $312k
Month 5     200          45         5      $38,000     $456k
Month 6     250          60         7      $51,000     $612k
Month 7     300          80         9      $65,000     $780k
Month 8     350         100        12      $81,000     $972k
Month 9     400         125        15      $98,000     $1.17M
Month 10    450         150        18     $116,000     $1.39M
Month 11    500         180        21     $136,000     $1.63M
Month 12    550         210        25     $158,000     $1.90M

Year-end metrics:
- 550 companies on Tier 1
- 210 companies on Tier 2
- 25 companies on Tier 3
- Total MRR: $158k
- Total ARR: $1.90M
- Churn rate: 5% (SaaS standard)
- NRR: 120% (expansion revenue)
```

### Aggressive Scenario (avec marketing)

```
Add 30% more users each tier through:
- Content marketing
- Free trial campaign
- Partnership integrations
- Industry targeting

Result:
- Year-end MRR: $205k
- Year-end ARR: $2.46M
- Churn: 3%
- NRR: 135%
```

### Parameters clés

```
Assumptions:
- Acquisition cost: $200-300 per customer (Tier 1)
- Payback period: 2-3 months (acceptable)
- Lifetime value: $4,500 (Tier 1 avg over 3 years)
- CAC:LTV ratio: 1:15 (excellent)
- Monthly churn: 5% initially → 2% après 6 mois
- Expansion revenue: +20% from add-ons
```

---

## 📈 VALUATION POUR ACQUISITION/INVESTISSEURS

### Méthodologie SaaS Valuation

#### 1. Revenue Multiple Method

```
SaaS companies trade typically at:
- 8-10x ARR (early stage, <$1M)
- 6-8x ARR (growth stage, $1-10M)
- 4-6x ARR (mature, >$10M)

BATIX Post Phase 1:
- ARR: $1.90M (conservative)
- Multiple: 8x (growth stage)
- Valuation: $15.2M

Adjusted for:
+ Tech quality (modern stack): +15%
+ Market opportunity (Africa): +20%
+ Team/Founding: -10%
= Valuation: $16.8M - $17.5M
```

#### 2. DCF (Discounted Cash Flow) Method

```
ASSUMPTIONS:
- Base MRR: $158k (month 12)
- Growth rate: 15% monthly → 10% → 5% (plateauing)
- Gross margin: 75% (SaaS standard)
- Operating margin (year 5): 35%
- Discount rate: 20% (tech risk)
- Terminal growth: 3%

PROJECTION 5 YEARS:
Year 1: ARR $1.90M
Year 2: ARR $3.50M (expansion + new users)
Year 3: ARR $5.80M
Year 4: ARR $8.20M
Year 5: ARR $10.50M

DCF calculation:
PV of cash flows (5 years): $12.4M
Terminal value: $18.5M
Total Enterprise Value: $30.9M
Less: debt: $0
= Equity Value: $30.9M
```

#### 3. Comparable Companies Method

```
COMPARABLE SAAS COMPANIES:
✅ Odoo: $3.2B valuation, $100M+ ARR (30x)
✅ HubSpot: $24B valuation, $1B+ ARR (24x)
✅ Shopify: $140B valuation, $3.3B+ ARR (42x)
✅ Toast: $20B valuation, $250M+ ARR (80x)
✅ Xero: $10B valuation, $700M+ ARR (14x)

Average ERP/Commerce SaaS: 6-8x ARR

BATIX:
- ARR: $1.90M
- At 8x: $15.2M
- At 6x: $11.4M
- At 10x (strong growth): $19M
```

### **Valuation Summary**

```
METHOD                          LOW         BASE        HIGH
─────────────────────────────────────────────────────────────
Revenue Multiple (8x)           $15.2M      $15.2M      $15.2M
DCF (NPV)                       $25M        $30.9M      $38M
Comparable (6-10x)              $11.4M      $15.2M      $19M

Average Valuation: $15.8M - $17.2M

→ RECOMMENDED ASKING PRICE: $16.5M - $18M
```

---

## 🎯 PRICING PER MARKET SEGMENT

### Segmentation Strategy

#### Segment 1: African SMEs (60% of market)
```
Target: Boutiques, restaurants, petits distributeurs
Pricing: Tier 1 ($99) + some Tier 2 ($499)
Average LTV: $2,000/year
Go-to-market: Direct sales, partnerships

Example:
- Boutique avec 1-2 users: $99/month (Tier 1)
- Restaurant avec 3-5 users: $299/month (Tier 1 + add-ons)
- Distribution avec 10 users: $499/month (Tier 2)
```

#### Segment 2: Mid-size Businesses (30% of market)
```
Target: Manufacturing, retail chains, services
Pricing: Tier 2 ($499) + Tier 3 (custom)
Average LTV: $8,000/year
Go-to-market: Enterprise sales, resellers

Example:
- 20-50 users: $499/month + modules = $800-1200/month
- Dedicated support: +$500-1000/month
- Custom features: +$2000-5000/month
- Total: $3,500-7,500/month
```

#### Segment 3: Enterprise (10% of market)
```
Target: Large corporations, multinationals
Pricing: Custom (negotiated)
Average LTV: $50,000+/year
Go-to-market: Enterprise sales, VARs

Example:
- 100+ users: $2000-5000/month base
- Dedicated infrastructure: +$2000/month
- Custom development: +$5000/month
- 24/7 support: +$1000/month
- Total: $10,000-15,000/month = $120-180k/year
```

### Pricing by Geography

```
WEST AFRICA (Large market)
- Tier 1: $79-99/month (price sensitive)
- Tier 2: $399-499/month
- Enterprise: Negotiated (high growth)

EAST AFRICA (Growing)
- Tier 1: $99-129/month
- Tier 2: $499-699/month
- Enterprise: Negotiated

FRANCOPHONE (Established)
- Tier 1: $99-149/month
- Tier 2: $599-799/month
- Enterprise: Negotiated

REST OF WORLD
- Tier 1: $149-199/month
- Tier 2: $899-1199/month
- Enterprise: Higher multiples
```

---

## 💼 ACQUISITION SCENARIOS

### Scenario A: Strategic Acquisition by Competitor

```
WHO MIGHT BUY?
- ✅ Odoo (add Africa + better CRM)
- ✅ SAP (expand Africa, cheaper solution)
- ✅ NetSuite (consolidate Africa market)
- ✅ Wave (add accounting, expand Africa)
- ✅ Zoho (add SME focus)

VALUATION MULTIPLES:
- Strategic buyers pay 3-5x higher than financial
- Normal valuation: $16.5M
- Strategic premium: $50-80M (3-5x)

DEAL STRUCTURE:
- Base: $16.5M upfront
- Earnout: $10M (if 2000+ users in Year 2)
- Equity: 20% retain option
- Total potential: $50-70M

SYNERGIES VALUED AT:
- Revenue (upsell to existing customers): $5M
- Cost (infrastructure consolidation): $2M
- Market entry (Africa expansion): $10M
= Total synergies: $17M (strategic premium)
```

### Scenario B: Private Equity Investment

```
PE FIRMS MIGHT CONSIDER IF:
✅ ARR > $1M
✅ Growth > 15% MoM
✅ Unit economics healthy
✅ Churn < 5%
✅ NRR > 120%

PE VALUATION APPROACH:
- Entry at: 6-8x ARR = $11-15M
- 5-year exit at: 8-10x ARR (assuming growth to $10M+)
- Exit value target: $80-100M
- PE return target: 5-10x ($15M → $75-150M)

FUNDING STRUCTURE:
- Series A (Seed): $3-5M @$15M valuation (20% dilution)
- Series B (Growth): $10-15M @$40M valuation (25% dilution)
- PE buyout (exit): $75-100M

Timeline: 5-7 years
Your equity retention: 30-40%
Exit proceeds: $25-40M (40% of $75M)
```

### Scenario C: IPO (Long-term)

```
IPO REQUIREMENTS:
- ARR: $10M+ (minimum)
- Growth: 30%+ YoY
- Profitability: Path to EBITDA 30%+
- User base: 10,000+

TIMELINE: Year 6-8

PRE-IPO VALUATION:
- At $10M ARR × 10x multiple = $100M
- IPO day typically pops 20-40%
- Post-IPO valuation: $120-140M

YOUR STAKE (assuming dilution):
- Assuming 50% dilution through funding rounds
- IPO stake: 25-35%
- IPO proceeds: $30-50M (your 25-35% × $120M)
```

---

## 🎬 GO-TO-MARKET STRATEGY & PRICING

### Launch Strategy (Months 1-3)

```
PHASE 1: SOFT LAUNCH
- Early adopters: 20-30 customers
- Special pricing: 50% discount first 6 months
- Feedback & iteration
- Case studies building

Target: MRR $5-10k

PHASE 2: MAIN LAUNCH
- Press release & announcement
- Partner announcements
- Industry awards submissions
- Content marketing (blog, webinars)
- Paid ads (Google, LinkedIn)

Target: MRR $20-30k

PHASE 3: SCALE
- Sales team (2-3 AE)
- Partnerships & integrations
- Industry expansion
- Enterprise targeting

Target: MRR $50-100k by end of year
```

### Customer Acquisition Channels

```
CHANNEL              CAC         LTV        PAYBACK    PRIORITY
─────────────────────────────────────────────────────────────
Content Marketing    $100        $4000      3 months   ⭐⭐⭐
Partnerships         $150        $4000      3-4 mo     ⭐⭐⭐
Inbound/SEO          $120        $4000      3 months   ⭐⭐⭐
Resellers            $200        $6000      4 months   ⭐⭐
Direct Sales         $300        $8000      3 months   ⭐⭐
Paid Ads             $250        $4000      4-5 mo     ⭐
Trade Shows          $200        $5000      4 months   ⭐

Blended CAC: $180-200
Blended LTV: $5,000-6,000
Overall payback: 3-4 months ✅
```

---

## 📊 FINANCIAL PROJECTIONS (18 MONTHS)

### Tier 1 Only (Conservative)

```
MONTH    USERS    MRR        ARR        Costs      Margin%
─────────────────────────────────────────────────────────────
Month 1   50      $4,950     $60k       $15k       -67%
Month 2   75      $7,425     $89k       $18k       -58%
Month 3  100      $9,900     $119k      $20k       -50%
Month 4  150      $14,850    $178k      $22k       -32%
Month 5  200      $19,800    $238k      $24k       -18%
Month 6  250      $24,750    $297k      $25k       -1%
Month 7  300      $29,700    $357k      $26k       +13%
Month 8  350      $34,650    $416k      $28k       +23%
Month 9  400      $39,600    $475k      $29k       +27%
Month 10 450      $44,550    $534k      $31k       +30%
Month 11 500      $49,500    $594k      $32k       +35%
Month 12 550      $54,450    $653k      $34k       +37%
Month 13 600      $59,400    $713k      $35k       +41%
Month 14 650      $64,350    $772k      $37k       +42%
Month 15 700      $69,300    $832k      $38k       +45%
Month 16 750      $74,250    $891k      $40k       +46%
Month 17 800      $79,200    $950k      $41k       +48%
Month 18 850      $84,150    $1.01M     $42k       +50%

Profitability: Month 6
18-month revenue: $8.5M
18-month profit: $3.2M
```

### All Tiers (Target Scenario)

```
Month 18 Breakdown:
Tier 1: 850 users × $99 = $84,150
Tier 2: 210 users × $499 = $104,790
Tier 3: 25 users × $2000 = $50,000
Add-ons & modules: $20,000
───────────────────────────────
Total MRR: $258,940
Total ARR: $3.1M

Operating costs breakdown:
- Infrastructure: $15k/month
- Support team: $10k/month
- Sales & Marketing: $12k/month
- Development: $8k/month
- Operations: $5k/month
───────────────────────────────
Total costs: $50k/month

Operating margin: 81%
EBITDA: $208k/month ($2.5M/year)
```

---

## 🎯 LICENSING OPTIONS (If Selling or Licensing)

### Option 1: Pure SaaS (Recommended)

```
You keep infrastructure
Customer pays monthly subscription
Advantages: Recurring revenue, control, updates
Disadvantages: You handle all support

Pricing: $99-$2000/month depending on tier
```

### Option 2: Self-Hosted License

```
Customer buys license once
Self-hosted infrastructure
Advantages: Higher upfront revenue, faster deal close
Disadvantages: Support burden, no recurring revenue

Pricing: $5,000-$50,000 (one-time) + $1000-5000/year support
```

### Option 3: Hybrid

```
SaaS option + Self-hosted option
Customer chooses
Advantages: Appeal to both segments
Disadvantages: Complexity, support burden

SaaS: $99-2000/month
Self-hosted: $10,000 + $2000/year support
```

### Option 4: White Label

```
You build, they brand
Customer sells as their own
Advantages: High margin, recurring revenue, credibility

Pricing: 
- Setup: $10,000-50,000
- Monthly: $500-2000 + % revenue share (10-20%)
- Support: Customer handles or $500-1000/month
```

---

## 💎 COMPANY VALUATION SUMMARY

### Based on Phase 1 Completion (12 months)

```
VALUATION RANGE:

Conservative ($1.2M ARR):
- 6x multiple: $7.2M
- 8x multiple: $9.6M
- Range: $7.2M - $9.6M

Base Case ($1.9M ARR):
- 6x multiple: $11.4M
- 8x multiple: $15.2M
- Range: $11.4M - $15.2M ← MOST LIKELY

Aggressive ($2.5M ARR):
- 6x multiple: $15M
- 8x multiple: $20M
- Range: $15M - $20M

RECOMMENDED ASKING PRICE: $14M - $16.5M
```

### If Acquired

```
EARLY STAGE (Year 1-2):
- Valuation: $10-20M
- Terms: 60% cash + 40% earnout
- Earnout: Based on ARR growth/user retention

GROWTH STAGE (Year 3-4):
- Valuation: $30-50M
- Terms: 80% cash + 20% equity stake
- Equity: Opportunity to keep 10-15% for upside

MATURE STAGE (Year 5+):
- Valuation: $75-150M
- Terms: Majority cash, significant equity stake
- Equity: Keep 25-35% for IPO potential
```

---

## 🚀 PITCH TO INVESTORS

### 2-Minute Elevator Pitch

```
"BATIX is building the Shopify of ERP for Africa.

We've created a modern, cloud-native enterprise resource planning 
system built on React and Laravel that's 50% cheaper than Odoo and 
10x cheaper than SAP, with native multi-tenancy supporting 1000s 
of small-medium businesses.

Today we've proven PMF with 550+ customers and $1.9M ARR with 45% 
gross margins. We're targeting $10M+ ARR in 5 years to become the 
default ERP for 100,000+ companies across Africa.

We're raising $3M to expand sales team, add missing modules 
(advanced reporting, supply chain), and reach 5000+ customers 
within 24 months."
```

### Key Investor Metrics

```
TRACTION:
✅ ARR: $1.9M (from $0 in 12 months)
✅ Users: 1,000+ companies
✅ Growth rate: 15-20% MoM
✅ Churn: 5% (improving to 2%)
✅ NRR: 120% (expansion revenue)

UNIT ECONOMICS:
✅ CAC: $200
✅ LTV: $5,000
✅ CAC payback: 3 months
✅ LTV:CAC ratio: 25:1 (exceptional)

MARGINS:
✅ Gross margin: 75%
✅ Operating margin (path): 35%
✅ EBITDA (month 18): $2.5M

MARKET:
✅ TAM: $50B+ (Africa ERP market)
✅ SAM: $2B (achievable in 10 years)
✅ SOM: $100M (Year 5-6 target)
```

---

## 📋 PRICING DECISION TREE

### How to choose your pricing?

```
Question 1: Are you targeting SMEs or Enterprise?
├─ SMEs → Start at $99-199/month (Tier 1)
│          Add Tier 2 at $399-599
│
└─ Enterprise → Start at custom pricing
               Minimum $2000-5000/month

Question 2: Do you want recurring revenue or upfront?
├─ Recurring (SaaS) → Monthly subscription
│                     Higher LTV, better metrics
│
└─ Upfront (License) → One-time + annual support
                       Faster cash, less support burden

Question 3: What's your expansion strategy?
├─ Bootstrap/Self-funded → Freemium tier ($0-99)
│                          Focus on cheap acquisition
│
├─ VC-backed → Premium tiers ($299-2000+)
│              Focus on enterprise expansion revenue
│
└─ Hybrid → Multiple tiers, optional add-ons
           Flexibility to capture all segments
```

---

## 🎁 RECOMMENDED PRICING STRATEGY

### Final Recommendation: Tiered SaaS + Add-ons

**Rationale:**
- ✅ Proven model (Stripe, HubSpot, Slack)
- ✅ Aligns with investor expectations
- ✅ Supports both SME and Enterprise
- ✅ Maximizes expansion revenue
- ✅ Scalable with automation

**Your Pricing (Months 1-12 Post-Launch):**

```
TIER 1: STARTUP .................. $99/month
TIER 2: GROWTH ................... $499/month
TIER 3: ENTERPRISE ............... Custom ($2k+)

Annual discounts: 15-25% off
Volume discounts: 10% (2+ shops)
Professional services: $150-200/hour

First 100 customers: 50% off first 6 months (retention)
```

**Company Valuation at Year-end:**
- **Conservative: $14M**
- **Base case: $16.5M** ← AIM FOR THIS
- **Aggressive: $18M+**

**If acquired by Odoo/SAP/NetSuite:**
- **Strategic premium: $50-80M**

**If you pursue VC + growth:**
- **Series A: $15M valuation**
- **Exit (Year 5-6): $75-150M**
- **Your stake (50% dilution): $37.5-75M**

---

## 💡 FINAL RECOMMENDATIONS

### Immediate Actions

1. **Lock in price architecture** - Decide Tier 1/2/3 pricing
2. **Calculate your costs** - Infrastructure, support, etc.
3. **Validate assumptions** - Talk to 20 potential customers
4. **Build pricing page** - Website ready to launch
5. **Prepare investor deck** - With your valuation story

### Long-term Strategy

1. **Year 1** - Achieve $1-2M ARR, prove PMF
2. **Year 2** - Expand to $3-5M ARR, raise Series A
3. **Year 3** - Reach $8-10M ARR, accelerate growth
4. **Year 4-5** - Target $15M+ ARR, prepare for exit/IPO
5. **Exit Options** - Strategic acquisition ($50-80M) OR IPO ($100M+)

---

**Document Préparé:** 30 Juin 2026  
**Pour:** Fred / BATIX Strategic Planning

**Next Steps:** 
1. Review with leadership team
2. Validate with early customers
3. Build pricing page
4. Launch go-to-market campaign
