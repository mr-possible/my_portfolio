---
title: "One CSV Import, and Every Testing Methodology That Matters"
description: "Test levels, design techniques, risk-based selection, shift-right — the whole testing vocabulary, walked through one real feature in the order you'd actually reach for it."
pubDate: 2026-08-03
tags: ["testing", "methodology", "strategy", "sdet"]
draft: false
---

The ticket said: *"Users can bulk-import contacts from a CSV."* Below it, two acceptance criteria, both beginning with "user should be able to." Nine words of actual specification.

I've come to quite like tickets like this, because almost everything I know how to do gets applied to that one sentence — and it gets applied in a particular order. That order is the thing nobody taught me. I picked up the vocabulary of testing methodologies as a pile of flashcards: equivalence partitioning, the pyramid, shift-left, ATDD. What took years longer was working out *when* each one comes off the shelf.

So here's the sequence, on one feature.

## Before anyone writes code, argue about "done"

The first useful testing I do on this ticket involves no tests at all. It's a conversation, and it happens in refinement.

"What happens if row 300 is malformed — do we reject the whole file, or import 299 and report one failure?" Nobody knows. That's the point. Two engineers were about to build opposite behaviours, and the product owner had a third in mind.

Fifteen minutes of that produces a rewritten ticket. Somewhere in the industry's vocabulary this is **ATDD** — you agree acceptance criteria, in testable form, before implementation. If you write those criteria in shared business language so all three of you can read them, that's **BDD**, which is a *communication* discipline. Its output is a shared understanding; Gherkin is just one notation for recording it. (If your `.feature` files are written by one automation engineer and read by nobody, you've paid the entire syntax tax and received nothing back. I've maintained that suite. Don't build it.)

**TDD** is the odd one out here — it's a *design* discipline that belongs to whoever writes the implementation. Its real output is code shaped by the difficulty of testing it; the tests are a byproduct. I don't own that loop, but I care a great deal whether the developers around me are running it, because I'm going to live in whatever seams it leaves behind.

This half-hour is the cheapest defect removal available to me all sprint. It's also the first thing dropped when we're busy.

## Then work out which cases exist

Now the ticket is honest, and I have a problem: the set of possible CSV files is infinite, and I have an afternoon.

This is where the formal techniques earn their keep. They're the least fashionable part of testing and the part I'd least want to lose:

| Technique | What it does | On this feature |
| --- | --- | --- |
| Equivalence partitioning | Split inputs into classes that should behave alike, test one of each | Empty file · one row · many rows · over the row limit |
| Boundary value analysis | Attack the edges of each class, where off-by-one lives | If the cap is 10,000 rows: 9,999 / 10,000 / 10,001 |
| Decision table | Enumerate condition combinations and their required outcomes | `duplicate email? × missing name? × invalid phone?` → 8 defined rows |
| State transition | Model legal states, then try the illegal moves | `uploading → parsing → committed`; assert you can't cancel after commit |
| Pairwise | Cover every *pair* of parameter values, not every combination | encoding × delimiter × line ending × header row: 81 combos, ~9 tests |
| Error guessing | Aim at what experience says breaks | UTF-8 BOM, CRLF, a 200 MB file, `=cmd()` in a cell, 29 February |

If you take one row from that table, take boundary value analysis — it has the highest defect yield per test case of anything I've ever used. And pairwise deserves its reputation: exhaustive combination testing isn't just expensive, it's unnecessary, because most combinatorial defects turn out to be two-parameter interactions.

Notice these techniques don't care what tool you use. They're about *which* cases deserve to exist, which is a completely different question from where you put them.

## Then decide what level each case lives at

Here's the decision I see people get wrong most often, and it's the one that determines whether your suite is fast and trustworthy or slow and ignored.

"Row 300 is malformed and we report one failure" can be verified in at least three places: a unit test on the parser, a service test that posts a file to the API, or a browser test that uploads a real file and reads the result banner. All three would pass. Only one of them belongs.

The malformed-row matrix — all eight rows of that decision table — goes into unit tests against the parser, because that's where the logic lives, and eight cases there cost milliseconds. The service test covers one happy path plus authorisation and the row-limit rejection, because that's where routing, validation, and error mapping live. And exactly one browser test exists: upload a real file, see the success state. Its job isn't to check parsing logic. Its job is to prove the button is wired to the thing.

That distribution has names — pyramid, testing trophy, honeycomb — and they're often argued about as if one were correct. They're really competing claims about **where your confidence-per-second is highest**, and the answer is a property of your architecture, not of testing. This feature has meaty parsing logic behind a thin interface, so it wants a pyramid. A screen that's mostly other people's components has almost no logic of its own, and unit tests there mainly assert that you wired a library up correctly — that's the trophy's argument, and it's right in its context.

One caveat worth more than it sounds: **the level is defined by what's real, not by which framework ran it.** A Playwright test with the API mocked out is an integration test in E2E clothing. If you classify by tool rather than by what you actually substituted, your suite shape is a story you tell yourself.

## Then remember the failures that don't look like bugs

Everything so far has been functional — does it do the thing. Every serious incident I've been part of came from somewhere else.

Ten thousand rows is a **performance** question, and "does the request time out at 10,000" is worth more than another parsing assertion. A file upload is a **security** question: what stops a 200 MB zip bomb, and what happens when a cell contains `=cmd()` and someone opens the export in Excel. The import screen is an **accessibility** question — the progress state needs to be announced, not just animated. And when the downstream deduplication service is down mid-import, that's **resilience**: does the job fail cleanly and resumably, or leave half the contacts in?

Almost all our automation effort goes into the functional column. Almost all our outages come from the others. I don't have a clean answer to that, but I've stopped being surprised by it.

## Then decide, out loud, what you're not testing

I'm not testing every encoding. I'm not testing the 200 MB file on every commit. I'm not testing Excel's own CSV quirks beyond BOM handling.

Those are risk decisions — impact × likelihood — and all testing is already risk-based, because the input space was always infinite. The only real question is whether the model is explicit or accidental. The accidental version is "I test what I have tests for, plus whatever broke last month."

So write the exclusions down, in the ticket or the test plan. An undocumented exclusion is indistinguishable from an oversight, and the difference matters enormously at 2 a.m. when the thing you deliberately deprioritised is on fire. Written down, it's a decision the team owns with you.

While we're here: coverage numbers tell you where code *wasn't* executed. They don't tell you anything was verified — a suite with no assertions can reach 100%. Use it as a detector, never as evidence.

## Then ship it and keep looking

Two things happen after release that no suite can do for you.

**Exploratory testing.** I take a charter — "explore bulk import with deliberately broken files, find out how partial failures are communicated" — a timebox, and notes. That's a technique with a deliverable, not "having a click around." My regression suite is a fossil record of what I already understood; it is structurally incapable of surprising me, because I wrote every assertion in it. And the incidents are always surprises.

**Shift-right.** Roll the import out behind a flag, to a fraction of users, with monitoring on failure rate and job duration. This isn't finding bugs earlier; it's making late discovery survivable — which is the other half of shift-left, and the half testers talk about less. One condition, though: it only counts if you can detect the problem and roll back quickly. Without that, "testing in production" isn't a strategy, it's a description of what's happening to you.

## What the sequence is actually for

None of this was me adopting a methodology. It was one ticket, and a series of ordinary decisions: what does done mean, which cases exist, what level each belongs at, which non-functional risks are real, what I'm consciously skipping, and what I'll only learn after release.

The vocabulary — partitioning, the pyramid, ATDD, shift-right — is worth learning precisely because it makes those decisions faster to have and easier to argue about with other engineers. It isn't worth learning as a set of positions to hold. Nobody has ever been promoted for being a pyramid purist, and no user has ever cared which ceremony produced their software.

Pick up the flashcards. Then go and use them on one small, badly-specified ticket, which is where they were always meant to be used.

If you'd argue with any of this — especially about levels, or about Gherkin — I'd genuinely like to hear it. [Twitter](https://twitter.com/DaveSambhav) or [LinkedIn](https://www.linkedin.com/in/sambhav6197/).
