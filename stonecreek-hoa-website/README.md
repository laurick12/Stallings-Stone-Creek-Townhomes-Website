# Stone Creek Townhomes HOA Website

A zero-build, dependency-free community hub for **Stone Creek Townhomes HOA** in Stallings, NC, deployed automatically on **Azure Static Web Apps**.

## What Was Upgraded (Phase 1 & 2)
1. **Reordered for Resident Psychology:** The site flow was re-architected to prioritize frequent utility over static information. It now flows: `Hero` (actions) → `Amenities/Booking` (frequent use) → `Vendors` (frequent use) → `Resources/FAQ` (situational) → `About/Board` (infrequent).
2. **Unified On-Site Vendor Directory:** Replaced external Google Docs with a live, filterable, on-site vendor directory powered by `vendors.json`.
3. **On-Site Modals for Booking & Feedback:** Pavilion reservations, board feedback, and vendor reviews now happen in native `<dialog>` modals on the page without bouncing users to external Google Forms immediately.
4. **Interactive SVG Parking Map:** A custom, mobile-friendly SVG map explicitly detailing the Trout Lily Ln & Autumn Olive Ln parking zones, removing all references to non-existent guest parking.
5. **Top Alert Banner:** A dismissible announcement band for `urgent` (water shutoff) and `important` (landscaping) updates, powered by `announcements.json`.

## How Forms Work (No Backend Required)

This site is a static HTML/JS application. Because there is no Node.js backend or database, HTML forms cannot process themselves natively. We handle forms using **Webhooks** or **Google Forms fallbacks**.

### Option A: The n8n Webhook Method (Recommended)
This method keeps the resident on the website. When they click "Submit" in a modal, the JS sends the form data directly to your n8n workflow.

1. Open your **n8n** instance.
2. Create a new workflow and add a **Webhook Node** (Set it to `POST` and note the "Test URL" or "Production URL").
3. Connect the Webhook node to a **Google Sheets** node (Action: "Append Row"). Map the JSON payload fields (e.g., `{{$json.body.residentName}}`) to your spreadsheet columns.
4. Open `app.js` in this codebase.
5. Find the `CONFIG` block at the top and paste your n8n URLs:
   ```javascript
   var CONFIG = {
     pavilionWebhookUrl: "https://your-n8n-domain.com/webhook/pavilion",
     vendorReviewWebhookUrl: "https://your-n8n-domain.com/webhook/vendor",
     boardFeedbackWebhookUrl: "https://your-n8n-domain.com/webhook/feedback",
     // ...
   ```
6. Push to GitHub. The forms will now seamlessly send data to your sheets without leaving the site.

### Option B: The "No-Code" Google Forms Fallback
If you do not want to use n8n, you don't have to change anything. 
If `app.js` sees that the Webhook URLs are empty (or if the webhook fails/times out), it gracefully falls back by automatically opening the corresponding Google Form in a new tab so the resident can complete their submission. 

### Can we connect directly to Google Sheets without n8n?
**Yes, using Google Apps Script.** 
If you want to eliminate n8n entirely but keep the on-site forms, you can write a short Google Apps Script attached to your Google Sheet that listens for `POST` requests (using `doPost(e)`). You would deploy that script as a "Web App" accessible to "Anyone", and paste that generated `script.google.com/macros/...` URL into the `CONFIG` block in `app.js`. 
*Warning: Exposing a direct Apps Script webhook means anyone who finds the URL can POST junk data to your sheet unless you build custom validation into the script.*
