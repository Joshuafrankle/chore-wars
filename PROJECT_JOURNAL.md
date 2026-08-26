# Chore Wars — The Story So Far

This file is a running diary of this project: what it is, how it got built, what broke, how we fixed it, and what's still left. Written in plain language on purpose — the goal is that you can read this before an interview and explain any part of it in your own words, even the bits you didn't type yourself.

It gets updated every time something meaningful changes. If you're reading this mid-project, the bottom sections are the newest.

---

## 1. What is this app, in one breath?

A phone-friendly web app for a shared house (like a student house or a rented HMO). It does two things a landlord and their tenants both need:

1. **Chores** — instead of "it's always the new person's turn to do the bins" (unfair, and everyone knows it), the app tracks who's actually done how much work, and always hands the next chore to whoever's behind. If you go on holiday for two weeks, you don't get punished for it later — but you also don't get to coast forever, because the app quietly remembers you owe more turns.
2. **Household structure** — an owner (the landlord/property manager) sets up a house with a certain number of rooms and bathrooms. Tenants join with an invite code, pick their room and bathroom, and from that point on the chore rotation "just knows" who's eligible for what (e.g., only people who share Bathroom B get assigned Bathroom B duty).

The person managing the house (the "owner") never does chores themselves and never manually assigns anyone anything — the whole point is that nobody has to be the bad guy nagging people about turns. The algorithm is the bad guy.

## 2. The tech, explained like you've never heard of it

- **Next.js** — the framework the whole app is built with. Think of it as "React, plus a bunch of decisions already made for you about routing, servers, etc." A folder named `chores` with a `page.tsx` inside it automatically becomes the `/chores` page — no extra setup.
- **TypeScript** — JavaScript, but every variable has to say what *kind* of thing it is (a number, a piece of text, etc.) so mistakes get caught before the code even runs, not after a user hits a bug.
- **Supabase** — a company that gives you a real database (Postgres) plus login/signup (called "Auth") without you having to run any servers yourself. It's like renting a fully-furnished apartment instead of building a house from scratch.
- **Row-Level Security (RLS)** — a bouncer that lives *inside the database itself*. Even if the app's code has a bug, the database will still refuse to show Household A's data to someone from Household B, because the bouncer checks every single request. This is a big deal — most apps only check permissions in their code, which means one bug can leak everything. Here, even a buggy request gets stopped at the door.
- **TanStack Query** — a helper library for "go fetch this data, and if it changes, quietly refresh it without me having to write that logic by hand." Used for the chores list, since it needs to update the moment someone marks something done.
- **Framer Motion** — the animation library. Used for the satisfying "mark done" animation (checkmark bounce, points flying up, streak updating).
- **Vitest** — a testing tool. Used specifically for the *fairness scoring logic*, since that's the one piece of math in the whole app that absolutely has to be correct — everything else is UI, but if the fairness math is wrong, the entire point of the app is broken.

## 3. How we actually built this, in order

### Phase 0 — The brief
Started from a written spec: build a fairness-based chore app, mobile-first, with a specific design mandate — *don't* make it look like a generic AI-generated app (no cream-background-serif-font look, no black-background-neon look, no fake-newspaper look). Pick colors and fonts that actually mean something for "people sharing a home."

### Phase 1 — Foundations
Built first: the design tokens (color names like `hallway` for background, `doorframe` for cards, `ink` for text — named for what they *mean* in a house, not generic "primary/secondary"), the fonts, and the login system. Login uses a "magic link" — you type your email, we send you a link, you click it, you're in. No passwords to remember or leak.

**How auth actually works, simply:** there's a file called `proxy.ts` that runs *before every page loads*. It checks "does this person have a valid login cookie?" If not, it bounces them to `/login`. This is why you can't just guess a URL and see someone else's data — the bouncer checks first.

### Phase 2 — Household setup (the peer-to-peer version)
Originally built so *anyone* could create a household and immediately join it themselves — like a group of friends all being equal. This later got completely reworked (see Phase 5).

### Phase 3 — The fairness engine
This is the one piece of real "business logic" in the whole app, and it's deliberately kept as a small, pure, isolated function — meaning it doesn't touch the database, doesn't know about the internet, it just takes in numbers and spits out an answer. That makes it trivially easy to test: feed it fake data, check the answer is right.

**How it works, explained for a 10-year-old:** imagine three kids, Alice, Bob, and Charlie, and a chart on the fridge tracking how many chores each has done. Every time a new chore needs doing, you look at the chart and give it to whoever has the *smallest number*. Do that forever, and things naturally even out — busy kids catch up later, kids who did more already get a break. Nobody has to argue about whose turn it is, because the chart doesn't lie and doesn't play favorites.

We wrote 8 automated tests for this (and later added more) — little checks that run in seconds and would immediately scream if someone accidentally broke the fairness math while changing something else.

### Phase 4 — Marking chores done + the signature animation
Built the actual "tap to finish a chore" flow. This is the moment the app is supposed to feel the most satisfying — so it got a real animation treatment: the button morphs into a checkmark, small dots representing effort points fly upward, the fairness numbers count up smoothly instead of jumping, and a soft color pulse plays behind the card. All of this respects a setting called "reduced motion" — if someone's device says "please don't animate things at me," we skip straight to the end state instead of forcing the animation on them.

**Bug #1 — the double-click race condition.** Early version: check if a chore is still "waiting to be done," *then* mark it done in a separate step. Problem: if two requests happen almost simultaneously (a double-click, a flaky connection retrying, two browser tabs open) both could pass the check before either one finished writing, and you'd end up with the same chore completed twice, handing out double points. **The fix:** instead of "check, then act" as two steps, we made the *database update itself* be the check — `UPDATE the row SET status='done' WHERE status is still 'pending'`. Only one request can ever win that race, because the database guarantees only one write happens at a time. The loser just gets told "someone already did that" instead of quietly corrupting the data. This is a classic, well-known pattern (sometimes called "compare-and-swap") and it's a good one to mention in interviews — it shows understanding that checking something and acting on it aren't automatically safe just because they happen close together in your code.

**Bug #2 — the point-farming exploit.** Once completing a chore reassigns the *next* turn based on lowest score, a sneaky problem appears: if you're still the lowest-scoring person right after finishing a chore, you might get handed the exact same chore again immediately — and since *anyone* can mark *any* chore done (so a helpful roommate gets credit for pitching in), a person could just keep completing the same chore over and over, farming points. **The fix, two layers:** (1) when picking who's next for a specific chore, skip anyone who did *that exact chore* within its own repeat window (so a weekly chore's last doer isn't reassigned it for a week) — this is a "nice to have" that avoids confusing "assigned to someone who can't act on it" states. (2) The *real* guard is on the completion endpoint itself: even if someone tries to claim credit for a chore they're not currently assigned, the server checks "did this exact person complete this exact chore recently?" and refuses if so, regardless of who it's nominally assigned to. Two layers because the first one is about *good UX* and the second is about *actually stopping the cheat* — a nice example of "the UI hint and the security check are not the same thing, and you need both."

### Phase 5 — The big pivot: owner vs. tenant
Partway through, the real-world picture got clearer: this isn't a group of equal friends, it's a landlord (or property manager) who owns/manages the house but doesn't live there, plus tenants who do. That's a fundamentally different shape than "anyone can create a household and join it" — so this got rebuilt:

- **Owners** create and configure a house (name, how many rooms, how many bathrooms) but are never tenants themselves and never appear in anyone's chore rotation — they can own *multiple* houses.
- **Tenants** can only join an existing house via an invite code — they can't spin up their own.
- Joining became a proper two-step **onboarding flow**: enter the invite code, then fill in your name, pick your room, and pick which bathroom you use.
- **Bathroom-specific chores**: since a house might have 3 bathrooms, "bathroom cleaning" isn't one chore for everyone — it's a separate chore *per bathroom*, and only people who picked that bathroom are eligible for it. Kitchen and common-area cleaning stay whole-household.
- Manual chore creation was **removed entirely**. Every house automatically gets exactly 3 standing duties (Kitchen, Common Area, one per Bathroom) — nobody has to think about setting anything up.

This required rewriting the security rules (RLS policies) too, since now an owner needs to be able to *see* their tenants' data (for oversight) without being able to silently edit it, and without any random logged-in user being able to peek into a house they don't own or live in.

**Recurring bug — the "missing profile" trap.** Several times during testing, creating a house failed with a cryptic foreign-key error. Root cause, explained simply: when someone signs up, a background helper automatically creates their "profile" row (name, etc.) linked to their login. But that helper only runs on *brand new* signups — if a test account existed *before* that helper was set up (or got deleted and recreated in an unusual way), it ends up with a login but no profile, like a hotel guest with a room key but no name on the guest list. Anything that tried to use that account as an "owner" then failed, because the database couldn't find who they were. **The fix** was a small one-time script that finds any login without a matching profile and creates one — safe to re-run any time this crops up again (and it did crop up again later, for the same underlying reason with a different test account).

### Phase 6 — Studying a reference app, on purpose
Was asked to study a real app called "Chorly" (a parent/kid chore app) for inspiration on *look and feel*, but explicitly **not** copy its actual logic — because Chorly's model doesn't fit this app at all. Chorly has a parent manually assigning chores and approving photo proof before anyone gets credit; this app is built around nobody having to be the manager doing that every week. So we took the *visual* ideas (clean cards, a leaderboard, streaks, a nicer "add household member" flow) and explicitly rejected the *logic* ideas (manual assignment, mandatory photo approval, a spendable-points reward shop) because they contradicted decisions already made on purpose.

This is a good interview story too: "I researched a competitor for UI inspiration, but consciously separated what was worth borrowing from what would have undone the core design decision."

### Phase 7 — The visual redesign
Added: a real bottom navigation bar, a leaderboard (ranked list instead of just a bar chart), streaks (how many times in a row someone finished a chore *on time*), an Insights page with a simple points/contribution breakdown, and a proper "invite a roommate" popup (instead of always showing the invite code on the main screen).

**Bug — the invite dialog going off-screen.** The popup box ("dialog") was centered using an old CSS trick (position it, then shift it left/up by exactly half its own size). That trick fights with animations that also try to control position, and — the real problem — it had no limit on how tall the box could get. If the content inside was tall enough (a long list, a long link), the box would center itself right off the top *and* bottom of the screen with no way to scroll to the rest of it. **The fix:** switched to a simpler, more robust approach — put the box inside a full-screen invisible container that just uses "center everything inside me" (flexbox), and gave the box itself a maximum height with scrolling if it's ever taller than the screen. This is a good lesson: centering with `position + transform` is fragile the moment content height is unpredictable; centering with flexbox almost never is.

**Bug — long names breaking the layout.** If someone's account name defaulted to something like an email address's username part (no spaces in it), several places on screen had no safety net to stop it — no width limit, so it just overflowed sideways past the edge of its card. Fixed two ways at once: (1) capped how long a name can actually be, right where it's typed in (so the problem can't happen going forward), and (2) went through every single place a name gets displayed and made sure long text gets cut off with "…" instead of breaking the layout, even for names already saved before the cap existed.

### Phase 8 — Color and theme overhaul
The original color palette (an amber/brown "brass" accent) didn't match what was wanted — described as "the brown theme," which needed to go. We picked a warm coral-pink to replace it everywhere (and properly *renamed* the underlying design token too, not just its color, so the code doesn't lie about what color it actually is). Also discovered the dark-mode background was *also* brown-tinted and fixed that separately, then went further and whitened up the light mode and switched the font to something more "premium app" feeling (one font family, Plus Jakarta Sans, used for both headings and body text — letting weight do the differentiating instead of mixing two different fonts).

Added a proper **light/dark mode toggle** — before this, the app only followed your phone/computer's system setting with no way to override it inside the app itself.

### Phase 9 — Rooms, WhatsApp links, and email headaches
Added room numbers (with the database itself guaranteeing two people can never claim the same room — not just a warning in the app, an actual hard rule the database enforces) and an optional WhatsApp group invite link shown right after joining.

Then hit a real-world infrastructure problem that had nothing to do with our code: Supabase's free built-in email sender has a very low rate limit (meant for light testing only), so after enough test signups, sign-in emails stopped sending entirely. Fixing this meant setting up a proper outside email service (Resend) — which then surfaced *another* layer of real-world email trickiness: a brand-new sending domain has no "reputation" yet, so even correctly-configured email can land in spam until a **DMARC** record (a DNS setting that tells email providers "here's how strict you should be about verifying mail claiming to be from me") gets added. None of this was a code bug — it's the kind of infrastructure/deliverability knowledge that doesn't show up until you actually try to send real email at any scale, and it's genuinely useful to have gone through it once.

### Phase 10 — Owner house management, and the bathroom-count question
Gave owners a real management screen per house (click into any house from "Your houses" to see it): tenant count vs. room cap, total chores completed, total points earned, a per-tenant breakdown, and the ability to edit or delete the house. Deleting is blocked outright while any tenant remains — no cascade-delete-everyone option was offered, on purpose, since accidentally wiping a house full of real people's history is a much worse failure mode than an owner having to remove tenants first.

**A good "why didn't you just..." example:** when first built, the edit form let you change the house's *name*, *room count*, and *WhatsApp link* — but not the number of bathrooms. That wasn't an oversight, it was a deliberate gap, and explaining *why* is a good interview answer in itself: room count is genuinely just a number (a cap), but bathrooms in the data model aren't a number at all — each one is its own row with a label, tenants already assigned to a *specific* bathroom, and its own auto-created "clean this bathroom" chore with real history attached. A plain "change the count from 2 to 1" field would hide a real question — *which* bathroom disappears, and what happens to whoever's assigned to it? Rather than build something that could silently strand a tenant or quietly delete history, the actual fix was a proper bathroom list: add one freely (harmless, just creates a new empty row), but only remove one if nobody's currently assigned to it — the exact same safety rule the house-delete button already uses, just applied one level down.

---

## 4. How the whole flow works today, start to finish

1. **Sign up / log in** — magic link email, no password.
2. **First-time landing** — if you're not yet part of any house, you land on a simple choice: "Set up a house" (become an owner) or "Join with a code" (become a tenant).
3. **Owner path** — name the house, say how many rooms and bathrooms it has, optionally add a WhatsApp link, get an invite code to hand out.
4. **Tenant path** — enter the invite code, then fill in your name, pick your room (only rooms nobody's claimed yet are even selectable), pick your bathroom, land on a "you're in!" welcome screen with the WhatsApp link if there is one.
5. **Home screen (tenant)** — a personal greeting, a leaderboard of who's contributed how much, and the actual chore list, each chore showing who's currently due, when it's due, and a "Mark done" button.
6. **Marking a chore done** — the completion is atomically guarded against double-submission, the fairness ledger updates, the next turn gets automatically assigned to whoever's now lowest-scored (skipping anyone who just did that exact chore, and skipping anyone who's already claimed credit for it too recently), and the signature animation plays.
7. **Tenants page** — everyone in the house as a compact card: avatar, name, streak, fairness score.
8. **A tenant's own profile page** — their room, bathroom, fairness score, streak, and their recent chore-completion history.
9. **Insights page** — a simple visual breakdown of who's contributed what share of the total household effort.
10. **Owner's home screen** — instead of chores, a list of every house they manage, each clickable into a detail page showing tenant count vs. room cap, total chores done, total points earned, a per-tenant breakdown, forms to edit the house's details or (only once it's empty of tenants) delete it, and a bathroom list they can add to freely or remove from (only if nobody's currently assigned to that bathroom).

## 5. What's built vs. what's still on the roadmap

**Built and working:**
- Magic-link auth, owner/tenant roles, multi-house ownership
- Room + bathroom assignment with real double-booking protection
- Automatic 3-duty chore provisioning (kitchen, common area, per-bathroom)
- The fairness scoring engine, unit-tested
- Mark-done flow with optimistic UI, animation, and anti-cheat guards
- Streaks, leaderboard, Insights page
- Owner house management: edit, delete (with tenant-count guard), per-house metrics
- Light/dark theme toggle
- Custom design system (colors, fonts, a signature completion animation)

**Discussed but deliberately not built (and why):**
- **Reward shop / spendable points** — decided against it. The fairness score exists to decide *whose turn is next*, not to be a currency — turning it into something you "spend" doesn't fit adult flatmates the way it fits a kid's allowance app, and it wasn't asked for.
- **Mandatory photo-proof + approval before credit** — decided against it. That's Chorly's model (a parent has to approve every single chore), and it directly contradicts this app's whole point: nobody should have to be the manager nagging/approving every week.
- **Manual/freeform chore creation** — deliberately removed. Every house always has exactly the same 3 standing duties; nobody configures chores by hand.

**Still to build:**
- **Bill splitting** — logging shared bills, splitting them equally or by a custom weighting, tracking who owes whom, settling up. This was in the original brief and hasn't been started yet.
- **Dispute / complaint feature** — if someone thinks a chore wasn't actually done properly, they should be able to flag it with photo evidence, and the *owner* (not a random housemate) reviews it and can reduce the point credit if the complaint holds up. Needs a new database table and a file-upload setup (Supabase Storage) that hasn't been wired up yet.
- **"I'm away" toggle** — a way to mark yourself temporarily unavailable so the fairness engine skips you without you having to do anything else. Discussed in detail (including a "don't pile multiple chores on someone the moment they're back" softening rule) but not implemented yet.
- **Push notifications / reminders** — no notification system exists at all yet; would need real infrastructure (push permissions, a way to trigger them) that hasn't been started.

---

## 6. Good interview talking points, if you want a shortlist

- **The atomic-update race-condition fix** — shows you understand that "check something, then act on it" isn't safe just because it happens in two nearby lines of code; the database's own guarantees are what actually make it safe.
- **The two-layer anti-cheat fix** — shows you can tell the difference between a UX nicety (don't show a confusing state) and an actual security boundary (don't trust the client, always re-check on the server).
- **Row-Level Security** — shows you understand defense happening *in the data layer itself*, not just in application code, and why that matters (a code bug can't leak data the database itself refuses to hand over).
- **The owner/tenant pivot** — shows you can take a real-world correction mid-build (the initial assumption was wrong) and reshape the data model and permissions cleanly instead of bolting a workaround on top.
- **Researching Chorly on purpose, then rejecting parts of it** — shows deliberate, reasoned design decisions instead of copying a competitor wholesale.
- **The DMARC/email saga** — shows you've dealt with real production infrastructure concerns (deliverability, sender reputation) that go beyond "the code runs on my machine."
