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
   This is only the BOOTSTRAP list, used until the live list exists.
   The live list lives in Firestore, document config/access, field emails,
   and the board manages it from the Access section of the admin page —
   that is the one place to add or remove access, no code change needed.
   Amani's latest rules edit (2026-11-25 16:22) added Jessica and Keianna
   back, so all five are on the bootstrap list. Manage access from the
   admin page (Access section) once the live list exists. */
window.STONE_CREEK_BOARD_EMAILS = [
  "laurickamadi@gmail.com",
  "stonecreekhoa.stallings@gmail.com",
  "jessinsims@gmail.com",
  "keianna07@gmail.com",
  "laurickamadi@zenithprotech.com"
];

window.STONE_CREEK_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAZpBDXhxf5MBjrwhXRKs2oIe6u4yDYlVA",
  authDomain: "stone-creek-townhomes.firebaseapp.com",
  projectId: "stone-creek-townhomes",
  storageBucket: "stone-creek-townhomes.firebasestorage.app",
  messagingSenderId: "785133103704",
  appId: "1:785133103704:web:45b1fc47be08af41c9f82d",
  measurementId: "G-BL4VCXY7JH"
};
