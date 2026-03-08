# David Street Station – Site Scrape Findings

**Source:** https://www.davidstreetstation.com/events  
**Scraped:** 2026-03-08  
**Purpose:** Reference for event types/categories when building Casper Events org sub-categories and embed features.

---

## Site Overview

- **Name:** David Street Station
- **Tagline:** "Where Casper Comes Together"
- **Type:** 501(c)(3) nonprofit gathering space in downtown Casper, WY
- **Mission:** Strengthen community and visitors by offering a vibrant gathering place for events and activities
- **Built:** 2017 (community-built)
- **Stats (from site):** 200k+ visitors, 500+ vendors hosted, 50+ concerts, 1k+ community events

---

## Event Types (Inferred from Site Content)

The events page content is largely loaded dynamically; the following types are derived from homepage copy, forms, and navigation.

### Primary Event Categories

| Category | Description | Source |
|----------|-------------|--------|
| **Concerts** | Live music performances | Homepage, "50+ concerts" stat |
| **Movies** | Outdoor/screenings | Homepage |
| **Markets** | Morning Market, Summer Markets, Hallmarket | Forms, homepage |
| **Ice Skating** | Ice rink activities | Ice Rink page, homepage |
| **Festivals** | 5150' Festival, Fall Fest, Monster Mash | Forms |
| **Family / Kids** | Splash pad, family-friendly events | Homepage, testimonials |
| **Vendors** | Vendor markets, food trucks | Forms, testimonials |
| **Holiday** | Christmas Tree Contest, Monster Mash | Forms |
| **Rentals** | Rent David Street Station (private events) | Forms |

### Event-Specific Forms (Implied Types)

- **5150' Festival** – Festival vendor
- **Morning Market** – Market
- **Musician Application** – Concerts / Music
- **Summer Market** – Market
- **Fall Fest** – Festival
- **Food Truck Application** – Food & Drink / Markets
- **Monster Mash** – Holiday / Family
- **Hallmarket** – Market
- **Christmas Tree Contest** – Holiday / Community
- **Rent David Street Station** – Private / Rental

### Facility / Program Areas

- **Ice Rink** – Seasonal ice skating
- **Splash Pad** – Summer water play
- **Main Plaza** – Concerts, markets, gatherings

---

## Mapping to Casper Events Platform Categories

| David Street Station Type | Suggested Platform Parent | Notes |
|--------------------------|---------------------------|-------|
| Concerts, Musician Application | Music & Entertainment | Direct match |
| Movies | Arts & Culture | Or new "Movies & Film" sub |
| Markets (Morning, Summer, Hallmarket) | Food & Drink | Or "Markets" sub under multiple |
| Ice Skating, Ice Rink | Sports & Fitness | Winter sports |
| Festivals (5150', Fall Fest, Monster Mash) | Arts & Culture or Family | Cross-category |
| Splash Pad, Family events | Family | Direct match |
| Food Trucks | Food & Drink | Direct match |
| Christmas Tree, Monster Mash | Family / Holiday | Seasonal |
| Rentals | Government & Civic? | Or "Private Events" |
| Vendors | Multiple | Depends on vendor type |

---

## Site Structure (URLs)

### Main Pages
- `/` – Home
- `/about-us` – About
- `/events` – Upcoming Events
- `/faq` – FAQ
- `/contact` – Contact
- `/ice-rink` – Ice Rink info
- `/sponsors` – Sponsors

### Be Involved
- `/be-involved/donate`
- `/be-involved/volunteer`
- `/be-involved/donate-in-memory-of-cathy-carson`
- `/be-involved/friends-of-the-station`
- `/be-involved/splash-pad`
- `/be-involved/ice-chiller-fundraiser`
- `/be-involved/sponsor-an-event`

### Forms (Vendor/Application)
- `/vendor-forms/5150-festival`
- `/vendor-forms/morning-markets`
- `/vendor-forms/musician-application`
- `/vendor-forms/summer-markets`
- `/vendor-forms/fall-fest`
- `/vendor-forms/community-christmas-tree-contest` (Food Truck Application link – possible mismatch)
- `/vendor-forms/monster-mash`
- `/vendor-forms/hallmarket-vendor`
- `/vendor-forms/community-christmas-tree-contest`
- `/vendor-forms/rent-david-street-station`

### Team
- `/the-team/whitney-asay` (Executive Director)
- `/the-team/sarah-bradley` (Director of Events)
- `/the-team/tori-mizak` (Director of Operations)
- `/the-team/pepper` (Professional Greeter)
- Plus board members

---

## Technical Notes

- Events listing on `/events` appears to be JavaScript-rendered; raw HTML fetch did not include individual event cards.
- For future scrapes: consider headless browser (Puppeteer/Playwright) or checking for a JSON/API endpoint.
- Site powered by JM Web & Design.

---

## Suggested Org Sub-Categories for David Street Station

If David Street Station were to use Casper Events with org sub-categories:

**Under Music & Entertainment:**
- Concerts
- Musician / Live Music

**Under Food & Drink:**
- Markets
- Food Trucks
- Morning Market
- Summer Market

**Under Sports & Fitness:**
- Ice Skating
- Ice Rink

**Under Family:**
- Splash Pad
- Kids Activities
- Monster Mash

**Under Arts & Culture:**
- Movies
- Festivals
- Fall Fest
- 5150' Festival

**Under Government & Civic (or new):**
- Rentals
- Private Events
