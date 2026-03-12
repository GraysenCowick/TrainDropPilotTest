# TrainDrop Marketing Strategy
> Built from a complete audit of the codebase — every feature listed here actually exists in the product.

---

## Part 1: What TrainDrop Actually Does Today

### Full Feature Inventory

**Business Owner — What they can do:**

**Modules (individual training units)**
- Create a module from a **video upload**: owner uploads a phone/screen recording → AI pipeline runs automatically: OpenAI Whisper transcribes the audio, Claude claude-opus-4-6 analyzes the transcript and generates a structured Markdown SOP, chapters are identified with timestamps, burned-in captions are generated (VTT), AI voiceover replaces/supplements original audio, a processed video is stored publicly
- Create a module from **text/notes**: paste rough bullet points or unformatted notes → Claude generates a clean, structured SOP in Markdown in ~15-30 seconds
- **Edit** the SOP (Markdown editor) and module title after creation
- **Publish** the module — generates a unique share link (`/m/[slug]`) that works without any employee account
- **Unpublish** to revert to draft
- **Regenerate** the SOP up to 3 times per 5-minute window if the output isn't right
- **Send to Team**: select employees from a saved team list → each gets a unique email (via Resend) with a personalized tracking link
- **Completion Status panel**: toggle to see every employee who was sent the module, whether they viewed/completed it, when they completed it, and how much time they spent
- Module cards on dashboard show a live completion progress bar (X/N assigned employees done)
- Delete module

**Training Tracks (ordered sequences of modules)**
- Create a track with title and description
- Add any published/ready modules to the track, reorder them with up/down controls, remove them
- **Publish the track** — locks all editing, saves the ordered module list as the published version
- **Unpublish** — unlocks for editing (with warning that employees see the current version until republish)
- **Send Track to Team**: select employees → each gets a unique email with a personalized track link (`/t/[token]`)
- **Team Status panel**: see overall completion per employee, a progress bar showing X/N modules done, and an expandable row showing exactly which modules each employee has and hasn't completed
- Delete track

**Team Management**
- Add employees by name and email — saved permanently in a team roster
- Edit employee name/email in-place
- Delete employee (completion history is preserved)
- Team roster shown in its own dashboard tab with count badge

**Settings**
- Set business name (appears in emails sent to employees)
- Change password
- Account deletion

---

**Employee — What they can do (no account required):**

**Module View (`/m/[slug]?token=xxx`)**
- Land on a branded page showing the module title
- If sent via team link: employee identity is pre-populated from the token (no prompt needed)
- If accessed via public share link: prompted for name and email (persisted in cookie)
- Watch the processed video with a custom player: play/pause, seek bar, mute/unmute, fullscreen, captions on by default
- Jump to specific chapters via the chapter list
- Read the full SOP in formatted Markdown (headers, lists, bold, horizontal rules)
- Click "Mark as Complete" — if there's a video, must watch ≥80% first; button is disabled otherwise
- Completion is recorded with timestamp and time-spent (in seconds)

**Track View (`/t/[token]`)**
- Arrive at a branded page showing the track title and overall progress (X of N modules complete)
- Desktop: sidebar showing all modules with completion checkmarks; click any to jump
- Mobile: compact tab row at top showing numbered module tabs with check icons for done ones
- View each module in sequence: video (with same full player) + SOP
- Mark each module complete (same 80% video gate)
- Auto-advances to next incomplete module after marking complete
- When all modules are done: full-screen celebration/completion state showing all modules checked
- Existing progress is loaded from the database on page load (revisiting shows correct state)

---

## Part 2: Value Proposition

### Who is the ideal customer?

**Primary ICP: The Hands-On Service Business Owner**
- Business size: 3-30 employees
- Industries: cleaning companies, restaurants, hair salons, barbershops, auto shops, landscaping, retail stores, gyms, childcare, dog grooming, property management
- Annual revenue: $200K - $2M
- They are the expert. They know exactly how to do every job. But they're the bottleneck for every new hire.
- Training today = shadow me for a week + a bunch of texts/calls when they forget
- They've thought about making training videos for years but never had time to do it right
- They use their iPhone for everything and want software that feels as easy as sending a text

**Secondary ICP: The Growing Franchise or Multi-Location Owner**
- 2-5 locations, trying to systemize so they can step back
- Needs consistency across locations without flying around to train everyone personally
- Currently using: WhatsApp groups, printed manuals, or a pile of YouTube links in a Notion doc

---

### The Problem (exactly what we solve)

Every time a new employee starts, the owner loses 10-30 hours explaining the same things they've explained a hundred times. And it doesn't even work — new hires forget half of it, do things wrong, and the owner has to retrain.

The alternatives are all broken:
- **Written SOPs (Google Docs)**: Nobody reads them. Hard to update. No way to know if anyone actually looked at it.
- **Loom/YouTube videos**: Employees have to find the link, there's no structure, no SOP alongside it, no way to know who watched.
- **Trainual / TalentLMS**: Overkill for a 10-person cleaning company. Too expensive ($49-$249/mo), too complex, takes weeks to set up. Built for HR teams, not owner-operators.
- **Nothing**: The current state for most small businesses. Owner is the training system.

**TrainDrop's position:** the first tool where you can go from "I have a video of myself doing this task" to "my employee has a complete, trackable training module" in under 5 minutes — with zero writing required.

---

### The Single Most Compelling Reason to Pay

**"Record yourself doing it once. Stop explaining it forever."**

The aha moment is: an owner uploads a 90-second phone video of themselves cleaning a bathroom or prepping a dish, and 3 minutes later they have a professional training video with captions, a formatted 5-step SOP, chapter markers, and a link they can send to every new hire forever.

That first moment — going from raw footage to a complete training module — is worth $29/month to any owner who has ever spent 3 hours walking a new employee through the same process.

---

### Competitive Differentiation

| | TrainDrop | Trainual | Loom + Notion | Google Docs |
|---|---|---|---|---|
| Video → SOP in one step | ✅ | ❌ | ❌ | ❌ |
| AI writes the SOP | ✅ | ❌ | ❌ | ❌ |
| Auto-captions | ✅ | ❌ | Loom only | ❌ |
| Completion tracking | ✅ | ✅ | ❌ | ❌ |
| No employee account needed | ✅ | ❌ | ❌ | Partial |
| Training tracks (sequences) | ✅ | ✅ | ❌ | ❌ |
| Per-employee tracking | ✅ | ✅ | ❌ | ❌ |
| Price | $29/mo | $49-249/mo | $15+ per tool | Free (but broken) |
| Setup time | 5 min | Days | Hours | Minutes (but useless) |

**The key differentiator:** Trainual requires you to *write* everything. TrainDrop lets you *show* it on video and the AI writes it for you. That's the unlock for owners who have never documented anything because it felt too hard.

---

### Price Positioning

- **Free tier**: 3 modules, text-to-SOP, shareable links, completion tracking. Enough for someone to experience the product and get value before paying.
- **Pro: $29/month**: Unlimited modules, video processing (the main thing), training tracks, team analytics. This is the meaningful tier.

At $29/month, the math is obvious: if this saves even ONE hour of re-training per month (it saves many more), it pays for itself. Compare to Trainual at $49-249 — 5x the price with 10x the setup friction.

The right move for launch: keep it simple, $29/month Pro, no annual plan required, free trial. Don't overthink pricing until you have 50 paying customers.

---

## Part 3: Marketing Strategy

### Positioning Statement

**"TrainDrop turns your phone videos and rough notes into complete employee training — with AI-written SOPs, auto-captions, and completion tracking — so you stop re-explaining everything every time you hire."**

---

### Key Messaging Pillars

**Pillar 1: Record it once, train forever**
The emotional hook. Speak to the exhaustion of being the training system. "Every time you hire, you lose a week repeating yourself. There's a better way."

**Pillar 2: AI writes the training for you**
The functional differentiator. "Point your phone at what you do, upload the video. TrainDrop transcribes it, writes the SOP, adds captions, and builds the training module. You do nothing."

**Pillar 3: Know who actually finished**
The trust/accountability hook. "A Google Doc link tells you nothing. TrainDrop tells you exactly who opened it, who completed it, and how long they spent. Stop wondering if your team actually read it."

**Pillar 4: No app for your employees**
The zero-friction advantage. "They get a link in their email. They click it, watch the video, read the steps, check a box. No downloads. No accounts. No friction."

**Pillar 5: Built for the owner, not the HR department**
The identity/positioning hook. "Trainual is for companies with an HR team. TrainDrop is for the owner who's also the trainer, the manager, and the one who fixes the toilet. Simple. Fast. Actually usable."

---

### Objection Handling

**"I'll just make a YouTube video and send the link."**
> You won't know if they watched it. You won't know if they understood it. There's no SOP alongside the video. You'll have to re-explain half of it anyway. TrainDrop ties the video and the written guide together, forces completion, and tells you who actually did it.

**"I'll write it up in Google Docs."**
> Will you actually write it? Most owners have been saying this for years. TrainDrop writes it for you in 30 seconds from your own words. And unlike a Google Doc, it tracks who read it.

**"My team doesn't need formal training, they can figure it out."**
> Then why do you spend your first week with every new hire holding their hand? "They can figure it out" is the reason turnover is expensive and every hire requires you personally.

**"$29/month is too much."**
> You spent more than $29 on re-training your last new hire. One avoided mistake, one saved hour, one employee who onboarded without calling you five times — that's the ROI. Most owners hit it in week one.

**"I don't have time to set this up."**
> The first module takes 5 minutes. Upload a video or paste your notes. The AI does the rest. If it takes more than 5 minutes, you get a full refund.

**"We already use Trainual."**
> If you're happy with Trainual and your team actually uses it, great. If you find that creating content is a project and employees don't really engage, TrainDrop's video-first approach and simpler UX might change that. And it's $20/month cheaper.

---

### Channel Strategy

**Where to find small business owners:**

**1. Facebook Groups (highest ROI, start here)**
- "Restaurant Owners Network" (huge, very active)
- "Cleaning Business Owners" groups (tons of them, very engaged)
- "Salon Owners" groups
- "Small Business Owners" general groups
- Local city/regional business Facebook groups
- Strategy: Don't spam. Be a member for a week first. Answer questions. Then post a genuine story: "I built a tool that helped me create training videos for my team. Happy to share what's working if anyone's dealing with the same issue."

**2. Reddit**
- r/smallbusiness, r/EntrepreneurRideAlong, r/Entrepreneur
- Answer questions about training/onboarding problems. Link to TrainDrop only when directly relevant.
- Long-form posts showing a before/after of the training creation process can go viral here

**3. TikTok / Instagram Reels (demo content)**
- Show the literal 3-minute journey: record a quick task on your phone → upload → watch the module appear
- "I uploaded a 90-second video of myself making our signature sandwich and this is what came out" — that's a viral format
- Target: small business owners, restaurant/salon/cleaning content
- Budget: $10-20/day boosting the best performing organic posts

**4. LinkedIn (for referral networks)**
- Target: business coaches, franchise consultants, staffing agencies, HR consultants who work with small businesses
- These are multipliers — one partnership with a business coach who has 200 clients is worth 500 Facebook posts

**5. Cold email (surprisingly effective for B2B SMB)**
- Target: Yelp/Google Maps listings for cleaning companies, restaurants, salons in your metro area
- Scrape emails from their websites
- Email: "Hi [name], I built a tool that [specific business like theirs] use to train new hires without spending hours explaining everything in person. Here's a 90-second demo. Free to try — no credit card."
- Personalization matters: reference their specific business type

**6. Local Business Networking (IRL)**
- BNI (Business Network International) chapters
- Local Chamber of Commerce events
- These give you warm relationships + word of mouth

---

### Content Strategy

**The best content for TrainDrop is the product itself. Show the demo.**

**Content types in priority order:**

1. **"Watch this happen" demo videos** (TikTok/Reels/LinkedIn)
   - Record yourself uploading a video and watching the module get created
   - Show the before (messy phone video) and after (polished training module)
   - Post 3x/week while building audience

2. **Pain point content** (Facebook groups, Reddit)
   - "How do you train new hires?" posts that invite discussion
   - "What's your biggest headache with new employees?"
   - Comment on other people's training struggles with helpful context (not pitches)

3. **Case study/story content** (email newsletter, LinkedIn)
   - Once you have a few real customers: "How [Maria's Cleaning Company] used TrainDrop to onboard their last 3 hires without a single phone call from a confused employee"
   - Even if it's your own story or a friend's — make it concrete and specific

4. **Educational content** (blog, SEO long-tail)
   - "How to create employee training videos without expensive equipment"
   - "SOP template for restaurant onboarding"
   - "How to onboard cleaning employees fast"
   - These are high-intent searches from your exact ICP

**Posting cadence:**
- Instagram/TikTok: 3-5x/week (demo clips, pain point hooks)
- LinkedIn: 2-3x/week (longer-form stories, insights)
- Facebook groups: Daily comment engagement, 1-2 posts/week
- Blog/SEO: 1 post/week on long-tail training/onboarding keywords

---

### Launch Playbook: First 30 Days to 50 Waitlist Signups

**Week 1: Set up and seed (Days 1-7)**
- [ ] Create a simple Typeform or Google Form waitlist (name, email, business type, biggest training pain)
- [ ] Set up a waitlist landing page (at traindrop.app or a subdomain) — SEPARATE from the app
- [ ] Record 3 demo videos showing the core product loop (video upload → module, text → SOP, track view)
- [ ] Join 10 relevant Facebook groups without posting yet — observe, understand the language they use
- [ ] DM 20 people in your personal network who own small businesses — ask for 15 minutes of feedback, not signups
- [ ] Post in r/Entrepreneur and r/smallbusiness with a genuine "I built this to solve my own problem" post

**Week 2: Facebook group blitz (Days 8-14)**
- [ ] Post in 5 Facebook groups per day (rotate, don't spam the same group)
- [ ] Template: "Quick question — how do you currently train new employees? I've been building something to help [specific industry] owners and want to know if I'm solving a real problem." Don't link yet — build conversation.
- [ ] Follow up in threads where owners describe the pain. THEN mention TrainDrop naturally.
- [ ] Set a daily goal: 3 real conversations per day with target customers
- [ ] Publish first demo video to TikTok and Instagram Reels

**Week 3: Cold outreach + content (Days 15-21)**
- [ ] Scrape 200 emails from Yelp/Google for cleaning companies, restaurants, salons in 3-5 cities
- [ ] Send personal cold emails: "Hi [name], I saw your [business type] on Google. I built a tool specifically for [business type] owners to create training videos without any production skills. Here's a 60-second demo. Free to try — no card required." Attach/link the best demo video.
- [ ] Target: 5-10% response rate, 2-3% click to waitlist. With 200 emails = 4-6 signups minimum.
- [ ] Publish 2nd and 3rd demo videos. Start boosting the best performer at $10/day on Instagram.
- [ ] Post a behind-the-scenes LinkedIn post: "Building in public: here's what I learned talking to 50 small business owners about how they train employees."

**Week 4: Amplify what's working (Days 22-30)**
- [ ] Double down on the channel getting the most engagement (likely Facebook groups or cold email)
- [ ] Offer free "setup calls" to any waitlist signup — 20-minute Zoom where you help them create their first module. This converts waitlist → raving fans.
- [ ] Ask every happy early user for a 1-paragraph testimonial and a referral to one other business owner they know
- [ ] Run a time-limited offer: "First 50 signups get 3 months of Pro free. Join the waitlist."
- [ ] Follow up with everyone who clicked but didn't complete the waitlist form

**Goal: 50 waitlist signups, 10+ real conversations with target customers, 2-3 paying beta users by day 30.**

---

### Metrics to Track

**Acquisition**
- Waitlist signups per week (target: 15-20/week after launch)
- Signup source (Facebook, cold email, organic, referral)
- Free → Pro conversion rate (target: 15-25%)

**Engagement / Activation**
- % of signups who create at least 1 module (target: 60%+)
- % of signups who send a module to at least 1 employee (target: 30%+)
- Time from signup to first module created (target: <24 hours)

**Retention / Revenue**
- MRR (target: $500 at 30 days, $2,000 at 90 days, $5,000 at 6 months)
- Churn rate (keep below 5%/month)
- Paying customers who create 3+ modules (these are retained)

**Product**
- Average modules per paying customer (health signal)
- Tracks created per paying customer
- Completion tracking usage rate (% of published modules where team status was checked)
- Video upload success rate (pipeline health)

---

### The One Thing

If you only do one thing in the first 30 days: **get into 10 Facebook groups for small business owners in service industries and have 50 real conversations about how they train new employees.** Don't sell. Ask and listen. The signups will follow.

The hardest thing to fix is talking to the wrong people. The product is good. The pipeline works. The gap is reach. Every hour spent in conversations with cleaning company owners is worth 10 hours spent on ads.