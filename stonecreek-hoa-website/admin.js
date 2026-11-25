(function () {
  var statusEl = document.getElementById("admin-status");
  var signinEl = document.getElementById("admin-signin");
  var appEl = document.getElementById("admin-app");
  var boardEmails = (window.STONE_CREEK_BOARD_EMAILS || []).map(function (e) { return String(e).toLowerCase(); });
  var cfg = window.STONE_CREEK_FIREBASE_CONFIG;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function slug(name) {
    return String(name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "vendor";
  }
  function fmtDate(ts) {
    try {
      var d = ts && ts.toDate ? ts.toDate() : new Date(ts || Date.now());
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) { return ""; }
  }

  /* The 8 vendors already on the site, for the one-time load into Firestore. */
  var SEED_VENDORS = [
    { id: "yuri-handyman", name: "Yuri Handyman", category: "Handyman", tested: true, rating: 5.0, vouches: 1, phone: "(732) 268-9521", website: "", summary: "Community member recommended handyman services.", verifiedNotes: "Recommended List" },
    { id: "white-electric", name: "White Electric Company", category: "Electrical", tested: true, rating: 5.0, vouches: 1, phone: "(704) 594-4612", website: "https://whiteelectriccompany.com", summary: "EV Charger Installation.", verifiedNotes: "Recommended List" },
    { id: "brewer-mechanical", name: "Brewer Mechanical", category: "HVAC", tested: true, rating: 5.0, vouches: 1, phone: "(704) 792-5588", website: "", summary: "Heat and AC Repair.", verifiedNotes: "Recommended List · Contact: Andy Brewer (Breuermec.hvac@gmail.com)" },
    { id: "tactical-pest", name: "Tactical Pest & Termite Solutions", category: "Pest Control", tested: true, rating: 5.0, vouches: 1, phone: "(704) 954-8455", website: "https://tactical-pest.com", summary: "Pest Control Services – Mint Hill, NC.", verifiedNotes: "Recommended List · Contact: Gary Wojciechowicz (info@tactical-pest.com)" },
    { id: "blue-cedar-residential", name: "Blue Cedar Residential", category: "Handyman", tested: false, rating: 0, vouches: 0, phone: "(980) 833-5454", website: "", summary: "Handyman / Locksmith services.", verifiedNotes: "Local Support List (Unvetted) · Contact: Jon Cannup (Bluecedarresidential@gmail.com)" },
    { id: "cottagecare-charlotte", name: "CottageCare of Charlotte", category: "Cleaning", tested: false, rating: 0, vouches: 0, phone: "(704) 847-8660", website: "", summary: "House Cleaning in Charlotte, NC.", verifiedNotes: "Local Support List (Unvetted) · Contact: Adam Strader" },
    { id: "queenbees-pest", name: "QueenBee's Pest Solutions", category: "Pest Control", tested: false, rating: 0, vouches: 0, phone: "(980) 414-2819", website: "", summary: "Pest control solutions.", verifiedNotes: "Local Support List (Unvetted) · Contact: Keenan (queenbeespest@gmail.com)" },
    { id: "sparkle-squad", name: "Sparkle Squad", category: "Cleaning", tested: false, rating: 0, vouches: 0, phone: "(704) 593-9559", website: "", summary: "Professional Window Cleaning and Pressure Washing Services.", verifiedNotes: "Local Support List (Unvetted)" }
  ];

  if (!cfg || !window.firebase) {
    statusEl.textContent = "Firebase is not configured yet. Paste the web app config into firebase-config.js first (see firebase/FIREBASE_SETUP.md in the repo).";
    return;
  }
  if (!firebase.apps.length) firebase.initializeApp(cfg);
  var db = firebase.firestore();
  var auth = firebase.auth();

  document.getElementById("signin-btn").addEventListener("click", function () {
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  });
  document.getElementById("signout-btn").addEventListener("click", function () {
    auth.signOut();
  });

  /* The live access list lives in Firestore (config/access, field emails).
     Until it exists, the bootstrap list in firebase-config.js applies, and
     the first board member to sign in seeds it. */
  var accessDoc = db.collection("config").doc("access");
  function resolveAccessList() {
    return accessDoc.get().then(function (snap) {
      if (snap.exists && Array.isArray(snap.data().emails)) {
        return snap.data().emails.map(function (e) { return String(e).toLowerCase(); });
      }
      return accessDoc.set({ emails: boardEmails }).then(function () { return boardEmails.slice(); });
    });
  }

  auth.onAuthStateChanged(function (user) {
    if (!user) {
      statusEl.textContent = "Sign in with your board Google account to continue.";
      signinEl.style.display = "";
      appEl.style.display = "none";
      return;
    }
    resolveAccessList().then(function (allowed) {
      var email = String(user.email || "").toLowerCase();
      if (allowed.indexOf(email) === -1) {
        statusEl.innerHTML = "<span class='warn'>This page is for board members only. Signed in as " + esc(user.email) + ", which is not on the access list.</span>";
        signinEl.style.display = "none";
        appEl.style.display = "none";
        auth.signOut();
        return;
      }
      statusEl.textContent = "";
      signinEl.style.display = "none";
      appEl.style.display = "";
      document.getElementById("admin-who").textContent = "Signed in as " + user.email;
      loadAll();
      loadAccess(allowed);
    }).catch(function () {
      statusEl.textContent = "Could not check access. Try signing in again.";
    });
  });

  function loadAccess(allowed) {
    var list = document.getElementById("access-list");
    accessDoc.onSnapshot(function (snap) {
      var emails = (snap.exists && Array.isArray(snap.data().emails)) ? snap.data().emails : allowed;
      list.innerHTML = "";
      emails.forEach(function (e) {
        var div = document.createElement("div");
        div.className = "item";
        div.innerHTML = "<strong>" + esc(e) + "</strong>";
        var rm = document.createElement("button");
        rm.className = "danger"; rm.textContent = "Remove access";
        rm.addEventListener("click", function () {
          if (emails.length <= 1) { alert("Keep at least one person with access."); return; }
          if (!confirm("Remove access for " + e + "?")) return;
          accessDoc.update({ emails: emails.filter(function (x) { return String(x).toLowerCase() !== String(e).toLowerCase(); }) });
        });
        div.appendChild(rm);
        list.appendChild(div);
      });
    });
    document.getElementById("access-add-btn").addEventListener("click", function () {
      var input = document.getElementById("access-add-input");
      var email = String(input.value || "").trim().toLowerCase();
      if (!email || email.indexOf("@") === -1) { alert("Enter a full email address."); return; }
      accessDoc.get().then(function (snap) {
        var emails = (snap.exists && Array.isArray(snap.data().emails)) ? snap.data().emails : [];
        if (emails.map(function (x) { return String(x).toLowerCase(); }).indexOf(email) !== -1) { alert("That email already has access."); return; }
        emails.push(email);
        return accessDoc.set({ emails: emails });
      }).then(function () { input.value = ""; });
    });
  }

  function loadAll() {
    db.collection("vendorSuggestions").where("status", "==", "pending").orderBy("submittedAt", "desc").onSnapshot(function (snap) {
      var list = document.getElementById("pending-list");
      document.getElementById("pending-count").textContent = snap.size;
      if (snap.empty) { list.innerHTML = "<p class='empty'>No pending suggestions.</p>"; return; }
      list.innerHTML = "";
      snap.forEach(function (doc) {
        var s = doc.data() || {};
        var div = document.createElement("div");
        div.className = "item";
        div.innerHTML = "<strong>" + esc(s.vendorName) + "</strong> · " + esc(s.vendorCategory || "") +
          "<div class='meta'>" + esc(s.vendorPhone || "") + (s.vendorWebsite ? " · <a href='" + esc(s.vendorWebsite) + "' target='_blank' rel='noopener'>" + esc(s.vendorWebsite) + "</a>" : "") +
          " · Recommended by a resident on " + esc(s.residentStreet || "") + " · " + fmtDate(s.submittedAt) + "</div>" +
          "<p>“" + esc(s.reviewText || "") + "” — " + Number(s.rating || 0) + "/5</p>";
        var row = document.createElement("div");
        row.className = "row";
        var ok = document.createElement("button");
        ok.className = "primary"; ok.textContent = "Approve — add to directory";
        ok.addEventListener("click", function () { approveSuggestion(doc.id, s, ok); });
        var no = document.createElement("button");
        no.textContent = "Reject";
        no.addEventListener("click", function () { rejectSuggestion(doc.id, no); });
        row.appendChild(ok); row.appendChild(no);
        div.appendChild(row);
        list.appendChild(div);
      });
    });
    db.collection("vendorReviews").orderBy("submittedAt", "desc").limit(100).onSnapshot(function (snap) {
      var list = document.getElementById("reviews-list");
      if (snap.empty) { list.innerHTML = "<p class='empty'>No reviews yet.</p>"; return; }
      list.innerHTML = "";
      snap.forEach(function (doc) {
        var r = doc.data() || {};
        var div = document.createElement("div");
        div.className = "item";
        div.innerHTML = "<strong>" + esc(r.vendorName || r.vendorId || "") + "</strong> · ★ " + Number(r.rating || 0) + "/5 · " + fmtDate(r.submittedAt) +
          "<div class='meta'>" + esc(r.residentStreet || "") + "</div><p>“" + esc(r.reviewText || "") + "”</p>";
        var del = document.createElement("button");
        del.className = "danger"; del.textContent = "Delete review";
        del.addEventListener("click", function () {
          if (!confirm("Delete this review from the site?")) return;
          del.disabled = true;
          db.collection("vendorReviews").doc(doc.id).delete().catch(function () { del.disabled = false; alert("Could not delete. Try again."); });
        });
        div.appendChild(del);
        list.appendChild(div);
      });
    });
    db.collection("vendors").orderBy("name").onSnapshot(function (snap) {
      var list = document.getElementById("vendors-list");
      var seedCard = document.getElementById("seed-card");
      if (snap.empty) {
        seedCard.style.display = "";
        list.innerHTML = "<p class='empty'>Directory still comes from the site file until you load the vendors above.</p>";
        return;
      }
      seedCard.style.display = "none";
      list.innerHTML = "";
      snap.forEach(function (doc) {
        var v = doc.data() || {};
        var div = document.createElement("div");
        div.className = "item";
        div.innerHTML = "<strong>" + esc(v.name) + "</strong> · " + esc(v.category || "") +
          "<div class='meta'>" + esc(v.phone || "") + " · " + (v.tested ? "Community Tested" : "Neighbor Lead") + "</div>";
        var del = document.createElement("button");
        del.className = "danger"; del.textContent = "Remove vendor";
        del.addEventListener("click", function () {
          if (!confirm("Remove " + v.name + " from the directory?")) return;
          del.disabled = true;
          db.collection("vendors").doc(doc.id).delete().catch(function () { del.disabled = false; alert("Could not remove. Try again."); });
        });
        div.appendChild(del);
        list.appendChild(div);
      });
    });
  }

  function approveSuggestion(id, s, btn) {
    btn.disabled = true;
    var vendorId = slug(s.vendorName);
    var vendor = {
      id: vendorId, name: s.vendorName || "", category: s.vendorCategory || "Other",
      tested: true, rating: Number(s.rating || 0), vouches: 1,
      phone: s.vendorPhone || "", website: s.vendorWebsite || "",
      summary: s.reviewText || "", verifiedNotes: "Recommended List"
    };
    db.collection("vendors").doc(vendorId).set(vendor).then(function () {
      return db.collection("vendorReviews").add({
        vendorId: vendorId, vendorName: vendor.name, vendorCategory: vendor.category,
        vendorPhone: vendor.phone, vendorWebsite: vendor.website,
        residentStreet: s.residentStreet || "", rating: Number(s.rating || 0),
        reviewText: s.reviewText || "", submittedAt: s.submittedAt || firebase.firestore.FieldValue.serverTimestamp(),
        source: "stone-creek-site"
      });
    }).then(function () {
      return db.collection("vendorSuggestions").doc(id).update({ status: "approved" });
    }).catch(function () {
      btn.disabled = false;
      alert("Could not approve. Try again.");
    });
  }

  function rejectSuggestion(id, btn) {
    btn.disabled = true;
    db.collection("vendorSuggestions").doc(id).update({ status: "rejected" }).catch(function () {
      btn.disabled = false;
      alert("Could not reject. Try again.");
    });
  }

  document.getElementById("seed-btn").addEventListener("click", function () {
    var btn = document.getElementById("seed-btn");
    btn.disabled = true;
    var batch = db.batch();
    SEED_VENDORS.forEach(function (v) {
      batch.set(db.collection("vendors").doc(v.id), v);
    });
    batch.commit().catch(function () {
      btn.disabled = false;
      alert("Could not load the vendors. Try again.");
    });
  });
})();
