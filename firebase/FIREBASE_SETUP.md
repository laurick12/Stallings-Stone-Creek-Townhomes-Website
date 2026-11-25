# Firebase vendor reviews — setup (about 10 minutes, no card)

The site code is ready. It needs a Firebase project to talk to. Do this once,
then paste one config block into the site and test a real review.

## 1. Create the project

1. Go to https://console.firebase.google.com/ and sign in with the Google account the HOA uses.
2. Click **Add project**, name it `stone-creek-townhomes`, click Continue.
3. Google Analytics: turn it **off** (the site does not need it), click Create project, wait, click Continue.

## 2. Turn on Firestore

1. In the left menu, Build, **Firestore Database**, click **Create database**.
2. Location: pick **us-east1 (South Carolina)** — closest to Charlotte.
3. Start in **production mode**, click Create. It takes a minute.

## 3. Set the rules (so anyone can review, nobody can fake-edit)

1. Firestore Database, **Rules** tab, delete what is there, paste in the whole
   file `firestore.rules` from this folder, click **Publish**.
2. What the rules allow: anyone can read reviews, anyone can add one with a
   1–5 rating and 10–1000 characters of text, nobody can edit or delete
   through the site. Abuse is deleted by the board in the Firebase console:
   Firestore Database, Data, `vendorReviews`, open the row, Delete document.

## 4. Turn on Google sign-in (for the board admin page)

1. Left menu, Build, **Authentication**, click **Get started**.
2. **Sign-in method** tab, click **Google**, toggle **Enable**, pick a support
   email (any board member), click **Save**.
3. The board members allowed in are listed in `firebase-config.js`
   (`STONE_CREEK_BOARD_EMAILS`) and in `firestore.rules` (`isBoard()`).
   Keep the two lists in sync. Today: laurickamadi@gmail.com,
   jessinsims@gmail.com, keianna07@gmail.com.

## 5. Get the web app config

1. Project settings (gear, top left), **Your apps**, click the **</>** web icon.
2. App nickname: `stone-creek-site`, leave hosting off, click **Register app**.
3. Copy the `firebaseConfig` block it shows. It looks like:
   `apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId`.
   That block is public on purpose — it is not a password, the rules are the lock.

## 6. Paste it into the site

1. In `stonecreek-hoa-website/firebase-config.js`, replace `window.STONE_CREEK_FIREBASE_CONFIG = null` with the config block you copied. That one file feeds both the site and the admin page.
2. Replace `null` with the config block you copied.
3. Push to the preview branch, wait for Azure, then submit a real review on the
   preview site for a vendor (use your own test review, rating 5, text at least
   10 characters). It should say "Thank you, neighbor! Your review is live",
   and the vendor card should show the new count right away, and in another
   browser too. Delete that test review in the Firebase console after.

## The board admin page

`stonecreek-hoa-website/admin.html` — not linked from the site, open it
directly at `…/admin.html` on the preview or live site. Sign in with a board
Google account. It shows:

- **Pending vendor suggestions** — residents' new-vendor recommendations.
  **Approve** adds the vendor to the directory live, **Reject** drops it.
- **Reviews** — every review, newest first, each with a **Delete** button.
- **Vendors on the site** — each with a **Remove vendor** button.
- **Load the current 8 vendors** — a one-time button, shown until the
  directory is in the database. After that, the database is the directory
  and `vendors.json` is only a fallback if the database is ever empty.

## Data model

Collections:
- `vendors` — one document per vendor on the directory (id, name, category,
  tested, rating, vouches, phone, website, summary, verifiedNotes).
- `vendorSuggestions` — one document per new-vendor recommendation, with
  `status: "pending" | "approved" | "rejected"`.
- `vendorReviews` — one document per review:
`vendorId, vendorName, vendorCategory, vendorPhone, vendorWebsite,
residentStreet, rating (1–5), reviewText, submittedAt (server time),
source: "stone-creek-site"`.
Reviews for a vendor the site does not know yet (`vendorId: "new"`) are still
stored, so the board can see them in the console and add the vendor.

## Cost

Spark plan, $0, no card. Free quota: 1 GiB stored, 50,000 reads a day,
20,000 writes a day. Firestore stops at the quota instead of billing.
A quiet HOA site will not come close.
