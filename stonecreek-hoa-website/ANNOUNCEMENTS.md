# Announcements — how to add, change, or remove the top banner

The top banner is the only place for urgent and important community notices.
It is **not** for routine news. If everything is urgent, residents stop reading it.

**Source of truth:** `announcements.json` in this folder — nothing else.
There is no hardcoded copy in `app.js` anymore. If the file is empty (`[]`),
no banner shows. If an entry's `expiresAt` date has passed, it hides itself.

**Live site:** the banner is on the preview branch first, then on main after
the pull request is merged. Test on the preview link before merging.

## Add a banner — GitHub on the web, no code on your computer

1. Go to the repo on GitHub, branch `preview/gemini-v6-baseline`
   (or `main` if you are updating the live site directly — prefer preview first).
2. Open `stonecreek-hoa-website/announcements.json`.
3. Click the pencil icon (Edit this file).
4. Paste a new entry inside the `[ ... ]`, after the last entry, with a comma
   between entries. Use the template below. Keep the `id` unique and short.
5. Click **Commit changes**. Azure redeploys in about 60 seconds.
6. Open the preview link and check: the banner shows, Details opens the full
   text, the link works, and on mobile it is one line.

## Remove a banner

Do **one** of these, then commit:

- Delete the whole entry from `announcements.json`, **or**
- Set its `expiresAt` to a date in the past — it will hide automatically.

Do **not** rely on the X button on the site. That only hides the banner
on one person's phone or computer. Deleting the entry removes it for everyone.

## Template — copy, paste, fill in

```json
[
  {
    "id": "2026-12-snow-parking",
    "severity": "important",
    "title": "Snow parking reminder — use garages and driveways overnight.",
    "details": "When snow is forecast, please keep guest spaces clear so plows can get through. Cars left in guest spaces overnight during a snow event may be towed.",
    "actionLabel": "View Parking Map",
    "actionHref": "#guide",
    "expiresAt": "2026-12-31T23:59:59-05:00"
  }
]
```

Field guide:

- `id` — unique, lowercase, dashes only. Example: `2026-12-snow-parking`.
  Never reuse an old id — a resident who dismissed the old one would
  also miss the new one.
- `severity` — one of `urgent`, `important`, `info`.
  - `urgent` — water shutoff, towing, safety, pavilion closed today.
    Residents cannot fully dismiss it. The X collapses it to a small
    "1 Urgent Alert" pill in the header until it is removed or expires.
  - `important` — annual meeting, dues change, election, major project.
    Residents can dismiss it on their own device.
  - `info` — maintenance next week, new vendor, holiday trash delay.
    Residents can dismiss it on their own device.
- `title` — the one line on the banner. Keep it under 80 characters.
- `details` — the full text shown when someone taps Details. Plain language,
  one or two sentences, plus what to do.
- `actionLabel` / `actionHref` — optional. A button, e.g. "Open Resident Portal"
  with `https://resident.ciranet.com/user/login?returnUrl=%2Fhome`,
  or "View Parking Map" with `#guide`. Leave both out if there is nowhere to go.
  Use `""` for both if you leave them out — do not leave a broken link.
- `expiresAt` — when it disappears automatically. Format:
  `2026-12-31T23:59:59-05:00` (Eastern time). Always set one.

## Examples

Urgent — water shutoff:

```json
{
  "id": "2026-12-water-shutoff",
  "severity": "urgent",
  "title": "Water shutoff Tue Dec 9, 9 AM–1 PM for emergency repair.",
  "details": "The water will be off for all townhomes on Tuesday, December 9, from 9 AM to 1 PM while the main line is repaired. Fill bottles the night before.",
  "actionLabel": "",
  "actionHref": "",
  "expiresAt": "2026-12-09T13:00:00-05:00"
}
```

Important — annual meeting (example only — use the real date, do not copy this one):

```json
{
  "id": "2027-01-annual-meeting",
  "severity": "important",
  "title": "Annual HOA Meeting — Jan 14 at 6:30 PM (Quorum Needed)",
  "details": "Quorum is required for our Annual Budget & Board Election meeting. Log in to CiraNet to submit your electronic proxy before 5:00 PM on January 13 if you cannot attend in person.",
  "actionLabel": "Open Resident Portal",
  "actionHref": "https://resident.ciranet.com/user/login?returnUrl=%2Fhome",
  "expiresAt": "2027-01-15T00:00:00-05:00"
}
```

## Before you commit — 30-second check

- [ ] Only one banner at a time is shown, highest severity first. If you add
      a second one, the lower one will wait until the first expires or is removed.
- [ ] Title is under 80 characters and makes sense on a phone.
- [ ] `expiresAt` is set, in Eastern time, and is in the future.
- [ ] `id` is new and unique.
- [ ] The action link, if any, opens the right page.
- [ ] You checked the preview link after Azure redeployed.

## If the banner does not show

1. Check `announcements.json` is valid JSON — a missing comma or bracket
   breaks the whole file. GitHub shows a red error if it is invalid.
2. Check `expiresAt` is not in the past.
3. Check you did not dismiss it earlier on that same browser — Important and
   Info banners stay dismissed on that device. Try a private/incognito window.
4. Hard-refresh the preview link (Ctrl+Shift+R / Cmd+Shift+R).
