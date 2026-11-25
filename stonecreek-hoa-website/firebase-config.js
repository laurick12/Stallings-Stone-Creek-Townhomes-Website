/* Stone Creek — one Firebase config for the whole site.
   Paste the web app config here once the Firebase project exists, e.g.
   window.STONE_CREEK_FIREBASE_CONFIG = {
     apiKey: "...", authDomain: "...firebaseapp.com", projectId: "...",
     storageBucket: "...appspot.com", messagingSenderId: "...", appId: "..."
   };
   Until this is set, the site works exactly as before: vendors come from
   vendors.json, reviews fall back to the Google Form, and the admin page
   shows "Firebase not configured". */

/* Board members allowed into the admin page (Google sign-in).
   From Amani's 2026-10-09 roles doc. Jessica's address still uses her old
   last name (jessinsims) — change it here and in firestore.rules if her
   email changes. */
window.STONE_CREEK_BOARD_EMAILS = [
  "laurickamadi@gmail.com",
  "jessinsims@gmail.com",
  "keianna07@gmail.com"
];

window.STONE_CREEK_FIREBASE_CONFIG = null;
