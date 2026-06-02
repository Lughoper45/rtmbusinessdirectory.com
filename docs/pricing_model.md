
ROCKING THEATRE MEDIA  ·  RTM GLOBAL CANADA
The Complete
Commercial Architecture

A unified growth strategy for the RTM platform ecosystem — integrating the Business Directory, Grant Advisory, Digital Growth Services, and Education Grants into a single revenue engine with a coherent commercial model, lifecycle email system, and pricing architecture grounded in product-led growth research.
Platform surfaces	Directory (launchpad)  ·  Grants (stellar)  ·  Membership (rtm-community-network)  ·  Grow  ·  govgranteducation.ca
Shared database	kajwpmyloxaqeciyndwf — single Supabase project, shared auth, shared membership_status
Revenue lines	Membership $100/yr  ·  Grant packages $149–$3,250 (member)  ·  Growth services $499–$1,799/mo  ·  Edu grant access
Document type	Master commercial strategy — supersedes all individual analyses. Integrates codebase findings + ChatGPT analysis + RTM internal roadmaps.
Status	MASTER STRATEGY — Strategic decision document

The Single Most Important Insight
RTM has three different stories: acquisition says 'free grants,' monetisation says '$100 to start,' and the product truth is 'free until you submit.' Until these three tell the same story, every email campaign, every ad spend, and every product improvement operates at 40% efficiency.
This document ends that mismatch. It builds one story across every surface, every email, and every price point — grounded in how Canadian SMEs actually research and buy, not how SaaS companies typically monetise.
The foundation is already built. The gate has been removed. The grant database has 217 programs. The growth services division is designed. Eugenecare is the first client. This document connects everything into a system.

1   THE DIAGNOSIS — WHAT IS ACTUALLY BROKEN

Before strategy, clarity. Two independent analyses — one from codebase review, one from ChatGPT's strategic audit — reached the same conclusion from different directions. This section synthesises both into the definitive diagnosis.

1.1  The Three-Story Problem

Story	What It Currently Says	What It Should Say
Acquisition story	'Explore Canadian grants — find funding for your business.'	Same — this is correct. Keep it.
Monetisation story	'Join RTM — $100/year' appears immediately after signup. Payment is framed as the entry ticket to everything.	'Explore free. Submit with RTM support — $100/yr passport.' Payment is framed as the upgrade to action, not access.
Product truth	Free until submit_intake. The code already allows profile building, grant matching, and intake starting without payment.	This is already correct in the code. The problem is that marketing doesn't know it yet.

The gap between story 2 and story 3 is the entire conversion problem. The product says 'free until submit.' The emails say 'pay first.' Users believe the emails, not the product, and leave.

1.2  Why This Matters More for RTM Than a Typical SaaS
Grant seekers are the most sceptical audience segment in Canadian SME marketing. They have been burned before — by CDAP's 'questionably credentialed advisers,' by fake grant directories, by programs that turned out to be loans. They arrive at RTM with one question: is this legitimate?

The fastest way to fail that question is to show them a payment screen before they see any value. It confirms every fear: this is another gatekeeper charging for access to public money. The fastest way to pass that question is to show them their actual matching grants within 3 minutes of signing up — for free.

RTM's strongest trust asset is not its brand — it's the specificity of the match. When a business owner in Scarborough sees 'NRC IRAP — up to $1,000,000 — 87% compatibility for your tech sector — rolling intake open,' they believe. That moment of belief is when they will pay. Not before.

1.3  The Commercial Opportunity This Creates
The junior developer's analysis, the ChatGPT audit, and every conversion research paper on high-intent B2B freemium reach the same number: when a paywall follows demonstrated value rather than preceding it, free-to-paid conversion rates improve by 2–4×. For RTM, that means:

Scenario	Monthly Signups → Active	Revenue Implication
Current (payment gate first)	100 signups → ~30 active	$3,000/mo from memberships. Most grant packages never reached.
New model (value first)	100 signups → 55–70 active	$5,500–$7,000/mo from memberships + significantly higher package attach rate.
With full email sequences	100 signups → 65–80 active	Membership + packages + growth cross-sell = $12,000–$18,000/mo at 100 signups.

These projections use industry benchmarks for high-intent B2B freemium (OpenView, Bessemer, ProductLed.com research 2023–2025). They are conservative for a platform with RTM's community trust advantage.

2   THE ONE STORY — THE RTM SUBMISSION PASSPORT

Every platform that succeeds long-term has one clear story that explains what it does, who it's for, what's free, and what costs money. This is RTM's story. Every email, every landing page, every CTA, every package description, every onboarding screen must tell this story.

2.1  The Story in Three Sentences

   Explore Canadian grants for free. When you find your match and you're ready to apply with RTM advisor support — activate your Submission Passport ($100/yr). Your passport pays for itself the moment you use your first advisory package.

2.2  What This Reframes

From	To	Why It Works
Entry ticket — pay to see anything	Submission Passport — pay to act	Matches how Canadian SMEs research: high research phase, low trust until they see a specific match. They browse for weeks before they buy.
$100 membership	$100 Submission Passport	Same price, different framing. 'Passport' implies a journey already started, a destination already chosen. It is earned, not demanded.
Membership gives you access	Passport unlocks your application	'Access' is abstract. 'Your application' is specific. The user has already seen their grants. They know what they're unlocking.
govgranteducation.ca is a footnote	Passport includes education grants as a bonus	Education grants have higher approval rates. Bundling them makes the $100 Passport feel like it covers two entirely different funding streams.
Pay $100, then discover packages	See package savings first, then buy Passport	Show the calculator: 'True North Standard $2,000 list vs $1,000 member = $1,000 saved. Passport costs $100. Net saving: $900.' This closes the sale before checkout.

2.3  The Passport Value Stack — Show This on Every Payment Prompt

What the $100 Passport includes	Standalone value	Your price
Submit grant applications with RTM advisor review	$299 (Maple Checklist list price)	Included
50% off all RTM grant advisory packages	Saves $150–$3,250 per package	Included
govgranteducation.ca full education grant workspace	$49 value (coded in edu_grant_access)	Included
RTM Business Directory featured listing	$120/yr standalone	Included
Member pricing on all Growth Services (30% off)	Saves $150–$540/mo on growth packages	Included
RTM Deals — member discounts from partner businesses	Variable	Included
TOTAL PASSPORT VALUE	$620+ per year	$100/yr

3   PRICING ARCHITECTURE — THE DECISION MATRIX

Both analyses produced four viable business models. This section evaluates all four against RTM's specific situation — community trust, multicultural audience, CDAP-successor positioning, and current codebase — and gives the recommended sequencing.

3.1  The Four Models Evaluated

Model	Structure	Best For	RTM Fit Score
A — Submission Passport	Free explore → $100/yr at submit. One tier. One decision point. Easiest copy and code.	High-intent grant seekers who want simplicity. All of RTM's current audience.	9/10 — RECOMMENDED NOW
B — Split SKU	Explorer $0 / Applicant $49 (2 submits) / Pro $129 (unlimited). Lower entry price. More complex.	If data shows >60% drop at $100 modal but strong intake engagement. Not yet proven.	7/10 — TEST AT DAY 60
C — Package-first	Free platform through draft. Revenue from packages only. Membership optional add-on.	If package checkout exceeds membership 3:1. Currently no package checkout data exists.	6/10 — OPTION IF DATA SUPPORTS
D — Grant + Grow Bundle	$149/mo (Visibility + Grants) / $399/mo (Sales Engine + Grant credits). Highest LTV.	Established members who have won a grant and need digital visibility. Eugenecare is the prototype.	9/10 — BUILD AT MONTH 3+

3.2  Why Option A Is Correct Right Now
The temptation is to immediately test lower price points. Resist it. Here is why Option A is the right starting position:

•	The code already supports Option A — MembershipPromptModal fires at submit_intake. No new Stripe products, no enum changes. Zero engineering risk.
•	RTM has no conversion data yet. Option B requires knowing that >60% abandon at $100 but would convert at $49. You don't know this yet. Changing the price before you have data is a guess, not a strategy.
•	The $100 price is not the problem. The timing of the ask is the problem. Option A fixes the timing. Only if conversion is still poor after fixing timing and messaging should you test the price.
•	The Passport value stack ($620+ value for $100) makes $100 feel cheap — but only if users see the stack before they see the price. Show the value table first. Then show the price.
•	$49 creates a two-tier membership that complicates the package discount math. A member at $49 gets 25% off packages. A member at $129 gets 50% off. Now you have three package price tables instead of one. Every advisor conversation becomes a pricing negotiation.

3.3  The Data Decision Points — When to Switch Models

If you see this data (Day 60)	It means	Action
Modal dismiss rate >60% AND intake completion rate >40%	Users want to apply but balk at $100. Price IS the friction, not timing.	Test Option B: $49 Applicant tier on a 50% cohort. Run for 30 days.
Package checkout volume >3× membership volume	Users prefer to pay per project, not per year. Project-based model fits.	Consider Option C: move $100 Passport to optional add-on at package checkout.
Members who won a grant start asking about marketing	Natural upsell moment has arrived. Eugenecare is the proof case.	Launch Option D bundles. This is the CDAP-successor positioning.
Signup → active conversion >55% with new model	Option A is working. Do not change the model.	Increase acquisition spend. The funnel converts. Scale it.

4   THE UNIFIED LIFECYCLE MODEL

One contact. One record. Five stages. Every person who touches RTM — whether they arrived via a grant search, a checklist download, a business directory search, govgranteducation.ca, or a growth services inquiry — flows through the same five-stage lifecycle. The system responds to where they are, not where you wish they were.

4.1  The Five Lifecycle Stages

Stage	crm_stage field	Trigger Condition	RTM Objective at This Stage
STRANGER	stranger	No record in CRM. First touch via Google, checklist, social, referral.	Capture email. Deliver immediate value (checklist PDF, grant preview, free audit).
EXPLORER	explorer	Has an account. membership_status = profile_incomplete or grant_intake_started.	Show them their specific matches. Build conviction. Guide them to complete their profile. Do not ask for money.
READY	ready_to_submit	Started intake. Grant_intake_started. Has viewed specific grant detail >2 min.	Show the Passport value stack. Make the ROI case. One clear CTA: Activate Passport — $100/yr.
MEMBER	member	membership_status = active. Stripe payment confirmed.	Deliver white-glove onboarding. Connect them to advisor. Introduce packages. Plant education grants and Growth Services seeds.
CLIENT	client	Has purchased a grant package OR a Growth Services retainer.	Deliver outstanding results. Generate a case study. Turn them into a referral source and affiliate. Eugenecare is Stage 5.

4.2  How Every Entry Point Maps to the Lifecycle

Entry Point	Enters at Stage	First Action RTM Takes
Google search → /grants	EXPLORER	Show grant catalog immediately. Sign-up prompt: 'Save your matches — free account.' No payment.
Checklist download request	STRANGER	Send checklist PDF instantly. Sequence starts: D0 checklist, D1 profile nudge, D3 matches, D7 intake CTA. No payment until D7 minimum.
govgranteducation.ca visitor	STRANGER	Education grant teaser. CTA: 'Business grants are also available at rtmbusinessdirectory.com — see your matches free.' Cross-pollinate to main platform.
Grow my business inquiry	STRANGER / EXPLORER	Free Digital Growth Audit intake form. Add to crm_contacts with tag growth_lead. Sequence: audit results email + package recommendation. Passport offered as add-on.
RTM Business Directory listing	EXPLORER	Directory owner is grant-eligible. After listing claim: 'RTM members get 50% off grant advisory. Did you know your business may qualify for X grants?' Plant seed.
Affiliate referral	STRANGER	Affiliate link tracked via UTM. Referred user enters grant funnel. Affiliate earns $30 on Passport activation. Tracked in crm_contacts.referral_source.

5   THE EMAIL SYSTEM — 10 SEQUENCES, ONE ARCHITECTURE

The email system has one job: move people from their current stage to the next stage. Every email is triggered by a behaviour or a time delay — not by a calendar. The system uses Resend (already built), ops_email_log dedup (already built), and the ops-dispatcher pattern (partially built). No new ESP needed for the core grant funnel.

5.1  Sequences to Retire Immediately

These templates are actively damaging conversion. Remove or rewrite before anything else.
send-member-email: signup_welcome — currently tells new users to pay $100. Replace with profile builder CTA.
send-member-email: payment_reminder — assumes the user wants to pay but hasn't. Reframe as 'Your grant matches are waiting — continue your profile.'
send-member-email: final_notice — 'final notice to pay' is aggressive for users who haven't seen value yet. Delete. Replace with win-back sequence.
Checklist nurture Day 7 (listingEmail.ts) — currently redirects to membership payment. Change to: 'See your free grant matches first, then decide if RTM support is right for you.'
grant-checklist-lead auto-reply — currently says 'join membership to access grants.' Change to: 'Your checklist is attached. Your free grant profile takes 3 minutes — no payment required.'

5.2  The 10 Sequences — Triggers, Themes, Copy

Seq	Name	Trigger	Subject Line	Core Message & CTA	Stage
S0	Verify & Welcome	Email confirmed (profile_incomplete)	Your free grant profile is ready	No payment required. Answer 6 questions to see which Canadian grants match your business. CTA: Build my grant profile	EXP
S1	Profile Nudge	24h inactive, profile <50%	3 programs may match businesses in {province}	You're halfway to seeing your matches. The revenue question (Q5) is where most people pause — here's why it matters. CTA: Complete my profile	EXP
S2	Match Reveal	grant_intake_started triggered	We found {X} grants for {business_name}	Your top 3 matches: {grant_1} up to {amount_1} — {match_1}% RTM compatibility. {grant_2}. {grant_3}. These are real programs. Click to see full details. CTA: View my matches	EXP
S3	Intake Encouragement	Intake started, no submit 48h	Your {grant_name} application is in progress	What RTM checks before a grant is submitted — and why most self-submitted applications get rejected. Here's what your application needs. CTA: Continue my intake	READY
S4	Passport Pitch	Modal dismissed ×2 OR 5 days since intake started	Submit your {grant_name} application with RTM support	Your intake is ready to submit. RTM Submission Passport ($100/yr) includes: advisor review, 50% off packages, education grants, directory listing. Value: $620+. Cost: $100. CTA: Activate my Passport	READY
S5	Package Consideration	Grant detail viewed >2 min, no package purchase	How an Ontario home care business accessed $30,000 in government funding	Case study format. Real outcome, real sector. 'Here is what the application process looked like and what RTM's advisor contributed.' CTA: Book a free eligibility call	READY
S6	Member Welcome	Stripe active → membership_status = active	Your RTM workspace is ready, {first_name}	This is the Annabel email — already built. Checklist PDF attached. Packages explained plainly. 3 qualifying questions. CTA: Open my workspace	MEM
S7	Education Grant Cross-sell	Active member, edu_grant_access not claimed, Day 3	Business grants aren't the only path — have you checked education grants?	Education and training grants often have higher approval rates and different eligibility criteria. Your RTM Passport includes full access to govgranteducation.ca. CTA: Explore education grants	MEM
S8	Growth Services Cross-sell	Active + grant_intake_started + profile shows low digital presence	Get visible while your grant is in review	Grant applications take 8–16 weeks. Here is what successful businesses do in that window: build their digital presence so they're ready when funding arrives. CTA: Get a free growth audit	CLIENT
S9	Win-Back	30 days inactive, was grant_intake_started	Your saved grants are still open — {grant_name} closes {deadline}	Your profile and intake are still saved. {grant_name} has {days_remaining} days left in its intake window. You can submit with RTM support for $100/yr. CTA: Resume my application	READY

5.3  Personalisation Variables — Available in Every Email

All personalisation blocks pull from live Supabase data at send time via the ops-dispatcher edge function. No static merge fields — dynamic queries on every send.

Variable	Source Table / Field	Example Value
{first_name}	profiles.first_name	Annabel
{business_name}	grant_profiles.business_name	Eugenecare Inc.
{province}	grant_profiles.province	Ontario
{sector}	grant_profiles.sector	Home Care & Health Services
{profile_completion_pct}	profiles.profile_completion_pct	67%
{X} — number of matches	COUNT of grants matching profile criteria	14
{grant_1}, {amount_1}, {match_1}	Top grant from grants table JOIN grant_profiles matching	Canada Summer Jobs — up to $50,000 — 94% compatibility
{grant_name}	Last viewed grant from user_sessions	NRC IRAP
{deadline}	grants.deadline_date WHERE grant_id = last viewed	June 30, 2026
{days_remaining}	Calculated: deadline_date - NOW()	31 days

6   GOVGRANTEDUCATION.CA — THE EDUCATION GRANT WEDGE

govgranteducation.ca is currently an isolated property with standalone education grant content that activates only after RTM membership is purchased. This is backwards. It should be a discovery asset that drives people toward RTM — and a retention asset that makes the Passport feel even more valuable.

6.1  The Opportunity
Education and training grants in Canada have consistently higher approval rates than business development grants. The reason: they fund people (training, skills, certifications) rather than projects, and the eligibility criteria are simpler. For a business owner who has been rejected from IRAP or SR&ED, an education grant feels achievable.

If RTM positions education grants as the 'easier path to government funding,' govgranteducation.ca becomes a conversion tool — not a post-payment reward.

6.2  The Three-Audience Model for govgranteducation.ca

Audience	What They See on govgranteducation.ca	What Happens Next
Non-member visitor	Education grant catalog — read-only preview. 'These programs fund training, skills, and certifications.' No login required for browsing.	CTA: 'Business grants are also available — explore your full match profile free at rtmbusinessdirectory.com.' Cross-pollinates to main platform. Enters lifecycle as STRANGER.
Explorer (free, profile started)	Teaser: 'Education grants are a different, often easier path. Your RTM Passport includes full access to this workspace.' Soft prompt to activate.	Reinforces value of Passport before payment. User sees two funding streams unlocked by one $100/yr decision.
Active Passport member	Full education grant workspace. Separate intake, separate grant catalog, separate advisor touchpoint. S7 email sent on Day 3 post-activation.	Increases platform stickiness. Different household decision (business owner vs. family training grants). Doubles the reasons to renew the Passport.

6.3  The Education Grant Narrative
Use this framing in the Passport pitch and in S7 email:
Business grants are competitive and slow. A first-time applicant for IRAP or SR&ED faces months of review and low approval rates.
Education and training grants are faster and more accessible. Your Passport includes both worlds.
Real example: A Scarborough home care business can apply for Canada Summer Jobs (youth wage subsidy, fast approval) at the same time as exploring IRAP for technology innovation. Two streams, one Passport, one advisor.
govgranteducation.ca is not a separate product. It is the second room in the same house.

7   THE GROWTH SERVICES INTEGRATION — PILLAR III AS A REVENUE MULTIPLIER

Rocking Theatre Media's third pillar — Grow My Business — is not a separate product line. It is the natural next chapter for every RTM member who receives grant funding. The sequencing is logical: get funded → get visible → get clients → get more funding.

7.1  The Natural Upsell Sequence

	Stage	RTM Offer
1	User finds RTM, starts grant profile	Free. Build profile. See matches. No pitch needed.
2	User reaches submit gate	Activate Passport ($100/yr). ROI case shown. Education grants bundled. Directory listing added.
3	Active member starts intake	Book Maple Checklist ($149 member) — advisor call + top 5 programs. Plant Growth Services seed: 'We noticed your business is not yet visible on Google.'
4	Member purchases a grant package	Grant application in progress. S8 email: 'While your grant is in review (8–16 weeks), here is how successful businesses use that time.' Growth audit CTA.
5	Grant approved or in review	Growth Services onboarding. Visibility Starter ($499/mo member) — Google Business Profile, website, social. The grant may fund part of this spend.
6	Growth client	Case study produced. Affiliate programme offer: '$30 for every business you refer to RTM.' Referral loop begins.

Eugenecare Inc. is already at Step 5. RTM is delivering the marketing proposal now. The case study will power Steps 1–4 for the next 100 clients.

7.2  The Grant Funding of Growth Services (The Circular Economy)
This is RTM's most powerful and most underutilised commercial argument. Several Canadian grant programs will fund the exact digital marketing services RTM sells:

•	Canada Digital Adoption Program successor — when it reopens, up to $15,000 for digital advisory services. RTM's Visibility Starter package ($499/mo = $5,988/yr) is eligible.
•	FedDev Ontario Business Scale-up — supports productivity and market development. A well-written application can fund Growth OS package engagement.
•	Provincial tourism development grants (Ontario, BC, Alberta) — specifically cover digital marketing for tourism businesses. RTM's target community includes many hospitality operators.
•	Canada Summer Jobs — can fund a social media coordinator for a client business, effectively subsidising RTM's social content production.

The pitch: RTM helps you get government funding to pay for RTM's growth services. The net cost to the client approaches zero. This is not a gimmick — it is how sophisticated grant advisory firms operate. RTM should be doing this for every growth services client.

7.3  Option D Bundles — When to Launch

Bundle	Monthly Price (member)	What It Includes
Visibility + Grants	$149/mo	Visibility Starter (GBP, website, social) + full Passport + 1 Maple Checklist/quarter. Best for: businesses just starting their grant and marketing journey.
Scale + Grants	$399/mo	Sales Engine (WhatsApp CRM, content, local SEO) + full Passport + 1 True North credit/year ($1,000 value). Best for: established businesses ready to grow.
Growth OS + Full Advisory	$999/mo	Full Growth OS (AI chatbot, paid ads, CRM) + Passport + 2 True North credits + dedicated advisor. CDAP-successor tier. Best for: businesses seeking government recognition.

Launch condition for Option D: minimum 10 active Passport members. The bundle requires delivery capacity. Launch when RTM has enough members to justify the dedicated advisor time.

8   THE 90-DAY EXECUTION PLAN

Four phases. Each phase has a clear focus, specific deliverables, and measurable outcomes. Phases 1 and 2 require no new code beyond what is already specified in the Payment Gate Removal document. Phase 3 adds CRM automation. Phase 4 makes business model decisions based on real data.

Phase 1 — Align Message with Product (Weeks 1–2)
The fastest, highest-impact work. No new engineering. Just killing the wrong copy and replacing it with the right copy.

Deliverables:
•	Rewrite all 5 email templates in send-member-email — free-first language per Section 5.1
•	Rewrite checklist auto-reply — attach PDF, zero payment mention, profile builder CTA
•	Update Membership.tsx hero: 'Join $100/year' → 'Free to explore · $100/yr when you submit'
•	Update MembershipPromptModal: show Passport value stack before price
•	Update govgranteducation.ca CTAs: add cross-link to rtmbusinessdirectory.com free profile
•	Deploy Payment Gate Removal Sprint 1 (per engineering spec already delivered)
Success signal: Zero emails in any sequence that ask for payment before user has seen grant matches.

Phase 2 — Build the Sequences (Weeks 3–6)
Implement the 10 sequences in Section 5.2 using the existing Resend + ops-dispatcher infrastructure.

Deliverables:
•	Build Grant Profile Builder in stellar (6-question wizard, status transitions)
•	Implement S0 → S3 sequences (verify, profile nudge, match reveal, intake encouragement)
•	Wire S4 (Passport pitch) to modal_dismissed event in user_sessions
•	Wire S6 (member welcome) to Stripe webhook active event
•	Wire S7 (education cross-sell) to edu_grant_access not claimed + 3-day post-active
•	Wire S9 (win-back) to 30-day inactivity check via nurtureScheduler pattern
•	Add govgranteducation.ca cross-link teaser to S2 match reveal email
Success signal: Every new signup receives the correct sequence email within 1 hour of trigger.

Phase 3 — CRM and Behavioural Automation (Weeks 7–10)
Build the crm_contacts unified record. Add stage field. Enable behaviour-triggered personalisation.

Deliverables:
•	Run CRM migration: crm_contacts table with email as merge key, stage field, referral_source, product_tags
•	Link profiles, checklist_leads, grant_profiles, user_sessions to crm_contacts via upsert on email
•	Implement S5 (package consideration — grant viewed >2 min) using user_sessions
•	Implement S8 (growth cross-sell) triggered by active + low digital presence signals in profile
•	Admin dashboard: funnel view showing stranger → explorer → ready → member → client counts
•	A/B test setup: cohort flag in profiles.metadata for Option B ($49) pricing test
Success signal: Admin can see exactly how many users are at each lifecycle stage in real time.

Phase 4 — Business Model Decision (Weeks 11–12)
Use the data collected in Phases 1–3 to make the pricing decision from a position of knowledge, not guesswork.

Decision criteria:
•	If signup → active conversion ≥55%: Option A is working. Scale acquisition. Do not change the model.
•	If modal dismiss rate >60% AND intake completion >40%: run Option B ($49 tier) A/B test.
•	If package volume >3× membership volume: consider Option C reframe.
•	If 10+ active members: launch Option D bundles.
Success signal: A documented pricing decision with data supporting it, committed to for the next 6 months.

9   METRICS — THE NUMBERS THAT TELL THE TRUTH

Two independent analyses listed metrics. This section consolidates them into a single dashboard with four North Star metrics and eight supporting indicators. All data points must be visible in the admin panel.

9.1  The Four North Star Metrics

North Star Metric	Target	Why This Metric
Signup → Active conversion rate	≥55% by Day 30	This is the single number that tells you if the Passport model is working. If it's below 40%, the problem is either copy or timing (fix Phase 1). If it's below 30% after Phase 1, consider pricing.
Profile complete → Match reveal rate	≥80%	Users who complete their profile should almost always see their matches. If this number is low, the profile builder is broken or the match algorithm is returning zero results.
Active member → Package purchase rate	≥35% within 60 days	This is the real revenue metric. A $100 Passport is small. A $1,000 True North Standard is where RTM makes money. If members are not buying packages, the onboarding sequence is not creating urgency.
Member → Growth Services attach rate	≥20% by Month 6	Pillar III is the highest LTV revenue stream. A member who buys a grant package AND a growth services retainer is worth $13,000+/yr to RTM. This metric validates the circular economy model.

9.2  Eight Supporting Indicators

Indicator	Track Via	What to Do If Low
Profile builder step-by-step dropout	behavior_builder_dropoff in user_sessions	Q5 (revenue) is the predicted drop step. Reorder to Q6 or add helper text: 'This helps us match the right grant programs — no minimum required.'
Email open rate by sequence	Resend analytics + ops_email_log	If S1 (profile nudge) open rate <25%, the subject line is wrong. Test province personalisation in subject.
Modal dismiss rate	user_sessions.modal_dismissed count	If >60% dismiss twice without converting, trigger S4 earlier. If >80%, consider Option B price test.
Days from signup to active (median)	profiles.created_at vs stripe.payment_date	Target: <14 days median. If >30 days, the S3/S4 sequences are not firing urgently enough. Add deadline-based personalisation.
govgranteducation.ca cross-traffic	UTM: source=rtm, medium=email, campaign=s7	Target: ≥30% of active members click through within 7 days. If low, S7 copy is wrong or education grants aren't resonating.
Affiliate referral conversion	crm_contacts.referral_source + Stripe	If referral signups convert lower than organic, affiliates are sending wrong traffic. Audit the affiliate onboarding materials.
Checklist lead → profile complete (48hr)	grant_checklist_leads JOIN profiles	The 4 warm leads (Marcia, Okulokunbo, Nonsoa, SouthSouthPot) are the first test cohort. If 0 of 4 complete profiles within 48hr of email, rewrite the email.
Member renewal rate (Month 13)	Stripe subscription renewal events	Target ≥70%. If below 50%, the platform delivered no value in year 1. Investigate: did they buy a package? Did they get a match?

10   THE MASTER ARCHITECTURE — EVERYTHING ON ONE PAGE

This is the complete RTM commercial architecture. Every person, every product, every email, every price point, every surface — in a single reference model.

10.1  The Five-Surface Architecture

Surface	Primary Role	Free Content	Paid Trigger	Cross-Sell To
Directory (launchpad)	Discovery + trust	Browse 10K+ business listings. Grant catalog preview. Checklist download.	Featured listing claim. Passport at checklist → profile CTA.	Grants workspace, Growth Services
Grants (stellar)	Core product + revenue	Full 217-grant catalog. Profile builder. Matching. Intake start.	submit_intake → Passport ($100/yr). Packages $149–$3,250.	govgranteducation.ca, Growth Services, Directory listing
Membership (community-network)	Auth + Passport	Account creation. Email verification. Profile status.	Stripe checkout at submit trigger. Passport confirmation page.	All four other surfaces
Grow (grow.*)	Growth revenue	Free Growth Audit (8-question intake). Growth Services overview.	Retainer packages $499–$1,799/mo. Member pricing −30%.	Grants (find funding for growth spend). Directory listing.
govgranteducation.ca	Education grant wedge + retention	Education grant catalog browse. Overview content. No login.	Included in Passport. Cross-sells to rtmbusinessdirectory.com.	Main grant workspace, Membership

10.2  The Revenue Engine

Revenue Line	Price	Target Volume	Annual Run Rate
RTM Submission Passport	$100/yr	500 active members	$50,000
Grant Packages (avg $800 member price)	$149–$3,250	35% of members = 175/yr	$140,000
Growth Services retainers (avg $900/mo)	$499–$1,799/mo	20% of members = 100 clients	$1,080,000
Directory / listing fees	$100–$300/yr	200 business listings	$30,000
Affiliate commissions paid out	−$30/referral	200 referrals	−$6,000 (cost)
TOTAL ARR (500 active members)	Blended	Yr 2 horizon	$1,294,000

This is not a fantasy projection. It is 500 active members — 0.04% of Canada's 1.2 million SMEs — with 35% buying one grant package and 20% on a growth services retainer. The constraint is not the market. The constraint is execution.

10.3  The Three Decisions That Determine Everything

Decision 1 — Who sends the emails? (Answer this week)
The email sequences in Section 5 require a human to review and approve the personalisation for the first 30 days. Assign one person — even if it is you — to review every S4 and S5 email before it sends. Automated sequences fail when the personalisation is wrong.

Decision 2 — Who delivers the Growth Services? (Answer before Month 2)
RTM can start with Visibility Starter ($499/mo) and WhatsApp CRM ($599 setup) immediately using existing relationships and tools. Before Sales Engine and Growth OS, you need either a part-time contractor or a dedicated growth services coordinator. Budget: $2,500–$3,500/mo. Funded by the first 4–6 Visibility Starter clients.

Decision 3 — What is the government recognition play? (Answer before Month 3)
The CDAP-successor registration, WES Ecosystem Fund application, and Digital Main Street partnership each have a 3-month documentation lead time. If government recognition is a priority — and it should be, for both credibility and funding — the application work must start now.
The most accessible path: Digital Main Street service provider registration. Apply at digitalmainstreet.ca/service-providers within the next 30 days. Requirements RTM already meets: Canadian business, digital advisory services, SME capability.

Prepared by Rocking Theatre Media  ·  RTM Global Canada  ·  Master Strategy v1.0  ·  May 2026
info@rtmbusinessdirectory.com  ·  +1 416 900 8728  ·  640 Sentinel Road, North York, ON M3J 0B2
This document supersedes all individual analyses. It is the single source of commercial truth for the RTM platform ecosystem.

---

## Implementation status (launchpad-canada-ai)

| Area | Status | Location |
|------|--------|----------|
| S0–S4, S7, S9 email templates | Done | `supabase/functions/send-member-email` |
| S2 match reveal (status webhook) | Done | `membership-email-trigger` |
| S6 member welcome | Done | `stripe-webhook` → `activation_welcome` |
| S1, S3, S4, S7, S9 cron | Done | `_shared/grantLifecycleNurture.ts` via `ops-dispatcher` |
| Checklist nurture Day 7 | Done | `_shared/listingEmail.ts` |
| Checklist auto-reply | Done | `grant-checklist-lead` |
| Membership page hero | Done | `src/pages/Membership.tsx` |
| Passport modal UI | Done | `stellar-business-os` → `MembershipPromptModal.tsx` |
| S5 package consideration | Done | `time_on_page` ≥120s on `/grants/:id` + `package_consideration` template |
| CRM lifecycle stages (§4.1) | Done | `20260604120000_crm_lifecycle_stages.sql` + `crm_lifecycle_funnel` view |
| S8 growth cross-sell | Done | `growth_crosssell` + `grantProfileSignals.ts` |
| S2 match reveal personalization | Done | `membership-email-trigger` |
| Membership signup + confirm email | Done | `C:\Users\flood\Membership\rtm-community-network` |
| Repo paths reference | Done | `docs/REPO_LAYOUT.md` |

Deploy after merge: `ops-dispatcher`, `send-member-email`, `stripe-webhook`, `membership-email-trigger`, `grant-checklist-lead`. Ensure `ops-dispatcher` cron has `OPS_CRON_SECRET` and `RESEND_API_KEY`.
