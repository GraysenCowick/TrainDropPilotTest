# LANDING_PAGE_PROMPT.md
> Paste this entire prompt into Claude Code in a fresh project folder. It is fully self-contained — no access to the TrainDrop codebase is needed.

---

## THE PROMPT

Build a complete, production-ready marketing landing page for **TrainDrop** — a SaaS product that helps small business owners create AI-powered employee training modules from phone videos and text notes.

This is a **static Next.js site** (or plain HTML/CSS/JS — your call, but Next.js preferred) deployable to Vercel. No backend required. The email capture uses a Tally.so embed (instructions below).

---

## PRODUCT DESCRIPTION (read carefully — copy must reflect only what the product actually does)

TrainDrop is a web app for small business owners (cleaning companies, restaurants, salons, auto shops, retail, landscaping, gyms — any service business with 3-50 employees).

**What it actually does:**

1. **Video → Training Module**: Owner uploads a phone video of themselves doing a task. TrainDrop's AI automatically transcribes the audio, writes a structured SOP (standard operating procedure) in Markdown, identifies chapter timestamps, adds burned-in captions to the video, and generates an AI voiceover. The result is a polished training module.

2. **Text → SOP**: Owner pastes rough notes or bullet points → AI generates a clean, formatted step-by-step SOP in about 15-30 seconds.

3. **Publish & Share**: Published modules get a shareable link that employees can open without creating an account. Modules can be grouped into ordered **Training Tracks** (sequences of modules for full onboarding).

4. **Send to Team**: Owner selects employees from a saved roster → each employee gets a personalized email with a unique tracking link. No employee account needed.

5. **Employee Experience**: Employee opens the link → sees the training video with captions + chapter markers, reads the SOP, and clicks "Mark as Complete" (must watch ≥80% of video first). Works on phone or desktop.

6. **Completion Tracking**: Owner sees exactly which employees have viewed and completed each module, when they completed it, and time spent. Training Tracks show per-employee progress across all modules with a progress bar.

7. **Team Management**: Owner maintains a roster of employees (name + email) to send training to.

**What does NOT exist (do not mention these features):** mobile app, AI quiz/assessment generation, certificates, integrations (Slack, Zapier, etc.), multi-user admin accounts, LMS features, course marketplace.

**Pricing (real):**
- Free: 3 modules, text-to-SOP, shareable links, completion tracking
- Pro: $29/month — unlimited modules, video processing, AI voiceover, auto-captions, Training Tracks, team analytics

---

## DESIGN SYSTEM

Match the app's aesthetic exactly:

**Colors:**
- Background: `#07090f` (very dark navy-black)
- Surface (cards): `#0f1220` (dark navy)
- Border: `#1a2035` (subtle navy border)
- Text primary: `#eef2f9` (near-white)
- Text secondary: `#7a85a0` (muted blue-gray)
- Accent: `#00cfff` (bright cyan — use for CTAs, highlights, icons, gradient glow)
- Accent hover: `#00b8e6`
- Destructive: `#ef4444` (only used in danger zones, not on landing page)

**Typography:**
- Font: Inter (Google Fonts) — already a system font on most devices, or import from Google
- Heading weight: 700-800
- Body weight: 400-500
- Letter spacing: slightly tight for headings (-0.02em)

**Visual style:**
- Dark mode only
- Subtle radial glow behind hero (cyan, very faint: `radial-gradient(ellipse at center, rgba(0,207,255,0.06) 0%, transparent 70%)`)
- Cards: `background: #0f1220; border: 1px solid #1a2035; border-radius: 16px;`
- Hover on cards: `border-color: rgba(0,207,255,0.3)` and very subtle `background` shift
- Buttons: primary = `background: #00cfff; color: #07090f; font-weight: 700; border-radius: 10px;`
- Secondary buttons: `background: transparent; border: 1px solid #1a2035; color: #eef2f9;`
- Pill badges: `background: rgba(0,207,255,0.1); border: 1px solid rgba(0,207,255,0.2); color: #00cfff; border-radius: 999px;`
- All corners: generous border-radius (10-16px for cards, 8-10px for buttons, 999px for pills)

**Logo:**
```
[TD] TrainDrop
```
Where `[TD]` is a `32x32px` rounded square (`border-radius: 8px`) with `background: #00cfff`, containing the text "TD" in `#07090f`, `font-weight: 800`, `font-size: 13px`. Followed by "TrainDrop" in `#eef2f9`, `font-weight: 700`, `font-size: 16px`.

---

## PAGE SECTIONS (build all of these, in this order)

---

### SECTION 1: NAVBAR (sticky, backdrop blur)

**Left:** Logo (TD square + "TrainDrop" text)
**Right:**
- "Features" link (anchor to #features)
- "Pricing" link (anchor to #pricing)
- "Log In" link (href="/login" — just a text link)
- "Get Started Free" button (href="#waitlist" — primary CTA, accent color)

Sticky with `backdrop-filter: blur(12px)` and subtle bottom border. On mobile: hide the "Features" and "Pricing" links, keep Logo + "Get Started" button only.

---

### SECTION 2: HERO

**Layout:** Full-width, centered text, padding-top: 120px, padding-bottom: 80px

**Above headline pill badge:**
```
⚡ AI-powered employee training for small businesses
```
(Accent pill, cyan text, cyan border, lightning bolt emoji)

**Headline (H1):**
```
Stop explaining the same
thing every time you hire
```
The word "explaining" should be in accent color `#00cfff`. Line break as shown. Font size: clamp(36px, 6vw, 64px). Font-weight: 800.

**Subheadline (max-width: 600px, centered):**
```
Record a quick video on your phone. TrainDrop turns it into a
complete training module — AI-written SOP, auto-captions, and
tracking that shows you who actually finished.
```
Font-size: 18px. Color: `#7a85a0`. Line-height: 1.6.

**CTA buttons (side by side on desktop, stacked on mobile):**
1. Primary: "Start Free — No Credit Card" → `#waitlist` section (accent background, dark text)
2. Secondary: "See How It Works" → `#how-it-works` (ghost button, white border)

**Social proof micro-line below buttons:**
```
✓ Free plan available   ✓ 3-minute setup   ✓ No employee accounts needed
```
Font-size: 13px. Color: `#7a85a0`. Checkmarks in accent color.

**Background:** The radial glow centered behind the hero section.

---

### SECTION 3: TRUST / MARQUEE BAR

A simple horizontal divider bar (border-top and border-bottom: `#1a2035`), padding: 20px 0.

Three items centered with dividers between them:

```
🏢 Built for small businesses  |  🤖 Powered by Claude AI  |  📍 Built in Lincoln, NE
```

Font-size: 14px. Color: `#7a85a0`. Icons in accent color.

---

### SECTION 4: PAIN POINTS ("Sound familiar?")

**Section title:** "You know your business. But training new hires is eating your week."
**Subtitle:** "Every owner we talked to said the same thing."

**Grid:** 2 columns on desktop, 1 on mobile. 6 pain point cards.

Each card: dark surface card, small checkmark icon (accent color), left-aligned text.

**The 6 pain points:**
1. "You trained someone last week and they're already doing it wrong"
2. "Every new hire shadows you for a week instead of learning from a system"
3. "You have a Google Doc that nobody reads"
4. "You've explained the same process 40 times to 40 different people"
5. "You're the only one who knows how half your business actually runs"
6. "\"I'll make a training video someday\" has been the plan for 3 years"

---

### SECTION 5: HOW IT WORKS (id="how-it-works")

**Section title:** "From messy video to complete training. In minutes."
**Subtitle:** "No production skills. No writing. No HR team required."

**3 steps, horizontal on desktop / vertical on mobile:**

Each step has: large step number (accent color), icon, title, description.

**Step 1 — Upload or Paste**
Icon: 📹 (or a video camera SVG icon)
Title: "Record or type it out"
Description: "Grab your phone and record yourself doing the task — messy, unscripted, unedited. Or paste your rough notes. Either works."

**Step 2 — AI Does the Work**
Icon: ⚡ (or zap SVG icon)
Title: "AI builds the training module"
Description: "TrainDrop transcribes your video, writes a clean step-by-step SOP, adds captions, and creates an AI voiceover. Ready in under 5 minutes."

**Step 3 — Send & Track**
Icon: 📊 (or chart SVG icon)
Title: "Send it. Know who finished."
Description: "Email your team a unique link. They watch the video, read the steps, mark complete. You see exactly who did it — and who didn't."

**Visual connector:** A horizontal arrow or dotted line connecting the steps on desktop.

---

### SECTION 6: FEATURES (id="features")

**Section title:** "Everything you need. Nothing you don't."
**Subtitle:** "Built for owners who don't have time to learn new software."

**6 feature cards in a 3-column grid (desktop) / 2-column (tablet) / 1-column (mobile):**

Each card: icon in accent-colored rounded square, bold title, 1-2 sentence description.

**Feature 1 — AI-Written SOPs**
Icon: FileText
Title: "AI writes the SOP for you"
Description: "Upload a video or paste your notes. Claude AI turns it into a structured, step-by-step Standard Operating Procedure. Edit it however you want."

**Feature 2 — Auto-Captioned Video**
Icon: Captions / CC badge
Title: "Professional video with auto-captions"
Description: "Burned-in captions make training accessible and watchable anywhere — even on a noisy job site with the sound off."

**Feature 3 — AI Voiceover**
Icon: Mic
Title: "AI voiceover replaces shaky audio"
Description: "TrainDrop adds a clean AI voiceover so your training sounds professional even if your original recording didn't."

**Feature 4 — Completion Tracking**
Icon: BarChart
Title: "See who finished. Stop guessing."
Description: "Every employee gets a unique link. You see who viewed it, who completed it, and exactly how long they spent. No more \"did you watch the training?\" conversations."

**Feature 5 — Training Tracks**
Icon: ListOrdered (numbered list)
Title: "Bundle modules into full onboarding tracks"
Description: "Group your training modules into a step-by-step track. New hires work through them in order. You see progress across every module."

**Feature 6 — No Employee Accounts**
Icon: Unlock / Link
Title: "Employees just click a link"
Description: "No apps to download. No passwords to forget. Your team gets an email with a link, they click it, and they're in. Works on any device."

---

### SECTION 7: WHO IT'S FOR

**Section title:** "Built for any small business with processes to document"

**Industry tag cloud — pill badges in a wrapped flex layout:**

Cleaning Companies · Restaurants & Cafes · Hair Salons & Barbershops · Auto Shops · Landscaping & Lawn Care · Retail Stores · Gyms & Fitness Studios · Property Management · Childcare Centers · Dog Grooming · Plumbers & Electricians · Medical & Dental Offices · Food Trucks · Franchises · Hotels & Hospitality

Style: `background: rgba(255,255,255,0.04); border: 1px solid #1a2035; border-radius: 999px; padding: 6px 14px; font-size: 14px; color: #7a85a0;`

**Tagline below:** "If you've ever had to retrain someone from scratch, TrainDrop is for you."

---

### SECTION 8: PRICING (id="pricing")

**Section title:** "Simple pricing. Start free."
**Subtitle:** "Upgrade only when you need more."

**Two cards side by side (desktop) / stacked (mobile), max-width: 700px, centered:**

**Card 1 — Free**
```
Free
$0 / month

✓ 3 training modules
✓ Text-to-SOP (AI-generated)
✓ Shareable public links
✓ Completion tracking
✓ Team roster management

[Get Started Free]  (secondary button)
```

**Card 2 — Pro (highlighted with accent border + "Most Popular" badge above)**
```
Pro
$29 / month

✓ Unlimited modules
✓ Video upload & processing
✓ AI voiceover generation
✓ Auto-captions
✓ Training Tracks (sequences)
✓ Per-employee progress tracking
✓ Team analytics dashboard

[Start Free Trial]  (primary button → #waitlist)
```

"Most Popular" badge: absolute positioned above the card, accent background, dark text, pill shape.

**Below both cards:**
```
No contracts. Cancel anytime. Free plan never expires.
```
Color: `#7a85a0`, font-size: 13px, centered.

---

### SECTION 9: WAITLIST FORM (id="waitlist")

**Section title:** "Join the waitlist. Get early access."
**Subtitle:** "We're rolling out Pro access to early signups first. Drop your info and we'll be in touch."

**Embed a Tally form.** Use the following implementation:

Add a Tally form embed. The form should collect:
- First name
- Business name
- Email address
- Business type (dropdown: Cleaning Company / Restaurant or Cafe / Salon or Barbershop / Retail Store / Auto Shop / Landscaping / Gym or Fitness Studio / Other)

**Tally embed code (replace `YOUR_FORM_ID` with the actual ID once the form is created at tally.so):**

```html
<iframe
  data-tally-src="https://tally.so/embed/YOUR_FORM_ID?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
  loading="lazy"
  width="100%"
  height="400"
  frameborder="0"
  marginheight="0"
  marginwidth="0"
  title="TrainDrop Waitlist"
></iframe>
<script>
  var d=document,w="https://tally.so/widgets/embed.js",v=function(){"undefined"!=typeof Tally?Tally.loadEmbeds():d.querySelectorAll("iframe[data-tally-src]:not([src])").forEach((function(e){e.src=e.dataset.tallySrc}))};if("undefined"!=typeof Tally)v();else if(d.querySelector('script[src="'+w+'"]')==null){var s=d.createElement("script");s.src=w,s.onload=v,s.onerror=v,d.body.appendChild(s);}
</script>
```

**Fallback (if Tally form ID not available):** render a simple HTML form:
```
Name: [input]
Business Name: [input]
Email: [input]
Business Type: [select dropdown]
[Join Waitlist] button
```
On submit, use `mailto:hello@traindrop.app` as the action, or display a "Thanks — we'll be in touch!" confirmation message via JS. The form should have a dark surface background (`#0f1220`) matching the cards, with accent-colored submit button.

**Section background:** Subtle radial glow (same cyan glow as hero) to draw attention.

---

### SECTION 10: FINAL CTA

**Headline:**
```
Ready to stop re-training
everyone from scratch?
```
"re-training" in accent color.

**Body:**
```
Create your first training module in 5 minutes.
Free forever — no credit card required.
```

**Button:**
```
[Get Early Access →]
```
→ scrolls to `#waitlist`. Large primary button.

**Social proof line:**
```
Join hundreds of business owners building smarter training systems
```
(Note: use "Join business owners" not a specific number — don't fabricate user counts)

---

### SECTION 11: FOOTER

**Left:** Logo (same as navbar) + tagline "Built in Lincoln, NE"
**Center:** Navigation links — Privacy · Terms · Log In
**Right:** "© 2025 TrainDrop. All rights reserved."

Three-column flex on desktop, stacked centered on mobile.
Top border: `#1a2035`.

**Footer links:**
- Privacy → `/privacy`
- Terms → `/terms`
- Log In → `/login`

---

## TECHNICAL REQUIREMENTS

**Framework:** Next.js 15 (App Router) with TypeScript. Or plain HTML/CSS/JS if you prefer — either works.

**If Next.js:**
- Single page: `app/page.tsx`
- Styles: Tailwind CSS or plain CSS modules — your choice
- No API routes needed
- `next.config.js`: set `output: 'export'` for static Vercel deployment
- Font: Import Inter from Google Fonts in `app/layout.tsx`

**If plain HTML:**
- Single `index.html` file with inline CSS in `<style>` and JS in `<script>`
- Import Inter from Google Fonts CDN

**Mobile responsiveness:** Full mobile optimization required. The page must look excellent on 375px wide iPhone screens. Key breakpoints:
- Mobile: < 640px (single column, stacked buttons, simplified nav)
- Tablet: 640px - 1024px (2-column grids)
- Desktop: > 1024px (3-column grids, full nav)

**Performance:** No heavy libraries. Lucide icons can be used for the icons (or inline SVGs). No image assets required — this is all CSS/typography/icon-based.

**Scroll behavior:** Add `scroll-behavior: smooth` to `html` element for anchor link scrolling.

**Animations (optional but nice):**
- Fade-in on scroll for feature cards (use Intersection Observer, pure JS)
- Subtle pulse on the accent glow in the hero
- Button hover states: slight brightness increase + transform: scale(1.02)

**Vercel deployment:** Include a `vercel.json` if needed. The site should deploy with `vercel --prod` or by connecting the repo to Vercel's dashboard.

---

## COPY GUIDELINES

- **Tone:** Direct, honest, slightly irreverent. Speak like a business owner, not a marketer. Avoid corporate buzzwords.
- **Never say:** "revolutionary," "game-changing," "best-in-class," "seamless," "robust," "leverage," "synergy"
- **Do say:** specific, concrete things. "3 minutes" not "fast." "see who finished" not "actionable insights." "your phone video" not "media content."
- **Headlines:** Short declarative statements or questions. Max 10 words.
- **CTA copy:** Action-oriented. "Start Free," "Get Early Access," "Join the Waitlist" — not "Submit" or "Learn More."
- **Pain points:** Written in second person ("you"), present tense, specific situations — not generic.

---

## FILE STRUCTURE (if Next.js)

```
traindrop-landing/
├── app/
│   ├── layout.tsx          # html/body, Inter font, metadata
│   └── page.tsx            # Full landing page (all sections in one file is fine)
├── components/
│   └── (optional: Navbar, Footer, FeatureCard if you want to break it up)
├── public/
│   └── (no image assets needed)
├── package.json
├── next.config.js          # output: 'export' for static export
├── tailwind.config.ts      # if using Tailwind
├── tsconfig.json
└── vercel.json             # optional
```

---

## METADATA

```html
<title>TrainDrop — Employee Training That Actually Gets Done</title>
<meta name="description" content="Turn your phone videos and rough notes into complete employee training modules — with AI-written SOPs, auto-captions, and completion tracking. Built for small businesses.">
<meta property="og:title" content="TrainDrop — Employee Training That Actually Gets Done">
<meta property="og:description" content="Record a task on your phone. TrainDrop writes the SOP, adds captions, and tracks who finishes. Built for cleaning companies, restaurants, salons, and more.">
<meta name="theme-color" content="#00cfff">
```

---

## WHAT GOOD LOOKS LIKE

When done, the landing page should:
1. Load in under 2 seconds
2. Communicate the core value prop within the first 5 seconds of viewing
3. Have a clear, obvious CTA above the fold
4. Make a small business owner think "yes, that's exactly my problem" within the first scroll
5. Include exactly zero aspirational/fake features — only what the product actually does
6. Feel like it belongs in the same design system as the app (dark, cyan, sharp)
7. Be fully usable on a phone
8. Have a working (or placeholder-ready) email capture

Build the full page. Don't stub anything out. Write all the copy. Ship it.
