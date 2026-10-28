# GLOBAL BLOG PROJECT RULES — v1.0
Updated: 2026-10-29
Status: Agreed operating principles; not a claim of deployment or AdSense approval.

## Business priority
1. Prioritize the first domain group (1ho, 2ho, 3ho, 4ho): site quality, indexing, stable publishing, and AdSense readiness.
2. Build the second domain group starting with 2-1ho (lifeweblab-1ho), restoring and improving legacy Gemini content where useful.
3. Scale only after validating quality, economics, and search performance; long-term ambition is 100 blog units.
4. Planned domain architecture: one parent domain with five subdomains per group (confirm counting and exact names before provisioning). Different domains diversify site-level operational risks, not AdSense account-level enforcement.
5. Aspirational traffic target: 5,000 daily visitors **per country/language**, 12 countries = 60,000 daily visitors per group if achieved. Not guaranteed.

## Editorial principles — mandatory
- Entire article should read as natural first-person storytelling, not just the introduction. Maintain reader interest while answering the query early and completely.
- NEVER fabricate firsthand tests, ownership, measured results, or personal anecdotes. When no real firsthand experience exists, use a conversational first-person explanation without false claims.
- Share only the topic across 12 languages. Generate each country's article independently from a locally adapted brief; do NOT translate or paraphrase another country's finished article.
- Localize natural terminology, search intent, product/OS menu names, examples, narrative arc, heading choices and FAQ. Common technical facts may remain the same.
- Avoid templated openings, repeated AI filler, unnatural translation style, irrelevant images, and unsupported claims.
- Accuracy and practical step-by-step troubleshooting come before word count or engagement tricks. Avoid deliberately withholding solutions to extend time-on-page.

## Publishing and QA
- Verify language purity, Markdown/HTML/frontmatter integrity, valid code fences, title structure, internal links, and meaningful FAQ.
- Validate each language independently; failed articles must not silently publish as successful.
- Preserve existing site theme, category taxonomy, images, schedules and published posts unless separately authorized.
- Check real generated output and CI/build results before deploying; a dry run alone is not proof of editorial quality.
- Do not merge review branches into main, enable paid recurring generation, or deploy production changes without explicit approval.

## AdSense and search
- Prioritize original, useful content and policy compliance. Approval, ranking, traffic, and revenue are not guaranteed.
- Maintain honest authorship/experience claims; do not use domains or accounts to evade enforcement.
- Monitor indexing, technical SEO, language canonical/hreflang where applicable, engagement and traffic by country.

## Collaboration and continuity
- This file is the persistent operating reference, not a substitute for the actual generation prompt.
- Changes to rules require clear user agreement; log important decisions in version history.
- The assistant must inspect GitHub and workflow logs before claiming work completed. State clearly what is tested, pending, or deployed.
- This document is intentionally added to review branches first; production main is unchanged until approval.

## Truthfulness and uncertain memory — mandatory
- If the assistant cannot reliably recall a prior decision, requirement, instruction, or work status, explicitly say it is uncertain or not remembered and ASK THE USER to confirm. Never invent memories, agreements, test outcomes, or completed work.
- First check available conversation history and this document or other authoritative repository records when practical. If evidence is still insufficient, ask rather than guess.
- Clearly distinguish verified facts, assumptions, plans, and actions actually completed. Do not pretend to remember something that cannot be verified.

## Immediate business priority — AdSense application window (agreed 2026-10-29)
- User is preparing for retirement; treat this as a critical long-term income project.
- Highest immediate priority: AdSense readiness for storydailyview.com (1ho) and lifeweblab.com (2-1ho).
- Target application around 2026-11-12, not guaranteed approval.
- Audit actual published pages, original useful content, site navigation, policies, indexing eligibility, links, language quality and duplication before applying.
- Fix quality and reliability before expanding site count; distinguish plans from verified results.

## Clarified rollout and domain migration (2026-10-29)
- 100 blog units is a long-term goal, NOT an instruction to build them immediately. First stabilize and validate Group 1; then focus on Group 2.
- User recently moved Group 1's original subdomain site to the root domain after two AdSense rejections. Google Search Console/indexing signals may need time to settle. Do not assume a fixed one-month recovery or a guaranteed application date.
- Treat the previously discussed ~2026-11-12 application date as provisional: reassess readiness and Search Console migration/indexing health before applying.
- Cloudflare Pages and GitHub are intended to minimize hosting overhead; verify actual platform limits rather than assuming 100 sites per domain is guaranteed.

## Verified unit-to-domain mapping (user-confirmed 2026-10-29)
- Group 1 / 1ho: https://storydailyview.com/ — bada1951a/astrowind-blog
- Group 1 / 2ho: https://m.storydailyview.com/ — bada1951a/astrowind-blog-2ho
- Group 1 / 3ho: https://work.storydailyview.com/ — bada1951a/astrowind-blog-3ho
- Group 1 / 4ho: https://prompt.storydailyview.com/ — bada1951a/astrowind-blog-4ho
- Group 2 / 2-1ho: https://lifeweblab.com/ — bada1951a/lifeweblab-1ho
- Immediate AdSense priorities: 1ho and 2-1ho. Do not confuse 2ho with 2-1ho.

## Explicit priority order and image policy (user-confirmed 2026-10-29)
- Strict priority: 1ho (storydailyview.com) FIRST, 2-1ho (lifeweblab.com) SECOND. Do not describe them as equal priority.
- 1ho and 2-1ho: images are manually uploaded and managed by the user; preserve this workflow and existing assets.
- 2ho, 3ho, 4ho: use external Pexels image links for lower-maintenance publishing; verify links and image rights when auditing.
- Do not change image sources, upload strategy, or production workflows without explicit approval.

## Editorial discretion and readability (user-approved 2026-10-29)
- User authorizes substantial editorial improvements to existing posts in review branches, prioritizing readability, mobile-first layout, useful comparison tables, checklists, step-by-step instructions, and concise callouts where relevant. Do not add decorative tables to every article.
- Preserve accurate technical guidance, meaningful bold emphasis, existing image policy, and 12-language localization; fix broken FAQ formatting, spacing, duplicate headings, and language contamination.
- Preserve a relatable FIRST-PERSON storytelling voice, as explicitly requested. Do not invent factual firsthand experiences, clients, measurements, locations, or professional credentials. Frame illustrative first-person scenarios transparently as hypothetical or composite when not verified.
- Perform careful review and build checks before any merge; this editorial discretion does NOT override the rule requiring explicit approval before production main changes or deployment.

## Deferred internal-linking task (user-approved 2026-10-29)
- User approved the principle of adding contextually relevant internal links, but instructed us to prioritize existing work first. DO NOT implement internal linking yet.
- After 1ho content-formatting/readability fixes and QA, ASK the user before beginning the internal-linking phase; do not silently skip or start it.
- Proposed implementation: link only to existing, verified posts in the SAME language; start with roughly 2-3 genuinely relevant links where appropriate (not a mandatory quota); check for broken links and avoid cross-language mismatches. Evaluate usefulness and crawlability; no AdSense approval guarantee.
- Keep this item in the deferred work queue and raise it with the user at the appropriate milestone.

## Low-cost card-news image plan (2026-10-29)
- Prioritize high-volume, low-cost image creation. Use deterministic SVG-to-PNG card templates from verified post titles and key steps, rather than paid AI image generation per post. Validate all 12 language fonts, text wrapping, mobile legibility, relevance, and duplicates.
- Preserve existing user-managed images; inventory before replacing. Keep all experiments on review branches; do not alter main, scheduled publishing, or run paid APIs. The image QA lead reports findings to 지이사 for consolidated owner reporting.
