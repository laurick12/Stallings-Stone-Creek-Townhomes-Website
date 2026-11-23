/* Stone Creek Townhomes — Phase 1 & 2 Interactive Hub (Dependency-Free) */
(function () {
  "use strict";

  /* Optional n8n webhook endpoints (leave empty to use built-in Google Form / optimistic fallback) */
  var CONFIG = {
    pavilionWebhookUrl: "",
    vendorReviewWebhookUrl: "",
    boardFeedbackWebhookUrl: "",
    googleFeedbackFormUrl: "https://forms.gle/znxSsAfgb85LohUy9",
    googleBookingFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdLltBb4FszXzhnI1puQQXvZTVWYF55tm94RujMw_ri-OU7nQ/viewform",
    googleVendorFormUrl: "https://forms.gle/7eLrH49JHgsBZvjb9"
  };

  /* Embedded fallback data so local file:// preview works without CORS issues */
  /* Announcements: announcements.json is the single source of truth.
     No hardcoded fallback — if the JSON cannot be fetched, show no banner
     rather than a stale meeting. See ANNOUNCEMENTS.md to add/remove. */
  var FALLBACK_ANNOUNCEMENTS = [];
  var FALLBACK_VENDORS = [{"id": "yuri-handyman", "name": "Yuri Handyman", "category": "Handyman", "tested": true, "rating": 5.0, "vouches": 1, "phone": "(732) 268-9521", "website": "", "summary": "Community member recommended handyman services.", "verifiedNotes": "Recommended List", "reviews": []}, {"id": "white-electric", "name": "White Electric Company", "category": "Electrical", "tested": true, "rating": 5.0, "vouches": 1, "phone": "(704) 594-4612", "website": "https://whiteelectriccompany.com", "summary": "EV Charger Installation.", "verifiedNotes": "Recommended List", "reviews": []}, {"id": "brewer-mechanical", "name": "Brewer Mechanical", "category": "HVAC", "tested": true, "rating": 5.0, "vouches": 1, "phone": "(704) 792-5588", "website": "", "summary": "Heat and AC Repair.", "verifiedNotes": "Recommended List \u00b7 Contact: Andy Brewer (Breuermec.hvac@gmail.com)", "reviews": []}, {"id": "tactical-pest", "name": "Tactical Pest & Termite Solutions", "category": "Pest Control", "tested": true, "rating": 5.0, "vouches": 1, "phone": "(704) 954-8455", "website": "https://tactical-pest.com", "summary": "Pest Control Services \u2013 Mint Hill, NC.", "verifiedNotes": "Recommended List \u00b7 Contact: Gary Wojciechowicz (info@tactical-pest.com)", "reviews": []}, {"id": "blue-cedar-residential", "name": "Blue Cedar Residential", "category": "Handyman", "tested": false, "rating": 0, "vouches": 0, "phone": "(980) 833-5454", "website": "", "summary": "Handyman / Locksmith services.", "verifiedNotes": "Local Support List (Unvetted) \u00b7 Contact: Jon Cannup (Bluecedarresidential@gmail.com)", "reviews": []}, {"id": "cottagecare-charlotte", "name": "CottageCare of Charlotte", "category": "Cleaning", "tested": false, "rating": 0, "vouches": 0, "phone": "(704) 847-8660", "website": "", "summary": "House Cleaning in Charlotte, NC.", "verifiedNotes": "Local Support List (Unvetted) \u00b7 Contact: Adam Strader", "reviews": []}, {"id": "queenbees-pest", "name": "QueenBee's Pest Solutions", "category": "Pest Control", "tested": false, "rating": 0, "vouches": 0, "phone": "(980) 414-2819", "website": "", "summary": "Pest control solutions.", "verifiedNotes": "Local Support List (Unvetted) \u00b7 Contact: Keenan (queenbeespest@gmail.com)", "reviews": []}, {"id": "sparkle-squad", "name": "Sparkle Squad", "category": "Cleaning", "tested": false, "rating": 0, "vouches": 0, "phone": "(704) 593-9559", "website": "", "summary": "Professional Window Cleaning and Pressure Washing Services.", "verifiedNotes": "Local Support List (Unvetted)", "reviews": []}];

  /* ------------------------------------------------------------
     1. Sticky Header Height Offset (ResizeObserver) + Mobile Nav
     ------------------------------------------------------------ */
  var masthead = document.getElementById("masthead");
  function syncHeaderHeight() {
    if (!masthead) return;
    document.documentElement.style.setProperty("--header-height", masthead.offsetHeight + "px");
  }
  if (masthead && "ResizeObserver" in window) {
    new ResizeObserver(syncHeaderHeight).observe(masthead);
  }
  window.addEventListener("resize", syncHeaderHeight);
  syncHeaderHeight();

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    function setNavOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.setAttribute("data-open", String(open));
    }
    toggle.addEventListener("click", function () {
      setNavOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setNavOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setNavOpen(false);
        toggle.focus();
      }
    });
  }

  /* ------------------------------------------------------------
     2. Universal Modal Helpers (<dialog>)
     ------------------------------------------------------------ */
  document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var dlg = btn.closest("dialog");
      if (dlg && dlg.open) dlg.close();
    });
  });
  document.querySelectorAll("dialog.modal").forEach(function (dlg) {
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg) dlg.close();
    });
  });

  /* ------------------------------------------------------------
     3. Top Announcement Banner (Urgent vs Important + Expiration)
     ------------------------------------------------------------ */
  var DISMISSED_KEY = "sc_dismissed_alerts_v1";
  var COLLAPSED_KEY = "sc_collapsed_urgent_v1";
  function getList(key) {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); }
    catch (e) { return []; }
  }
  function saveToList(key, id) {
    try {
      var list = getList(key);
      if (list.indexOf(id) === -1) list.push(id);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {}
  }
  function removeFromList(key, id) {
    try {
      var list = getList(key).filter(function (x) { return x !== id; });
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {}
  }
  function getDismissed() { return getList(DISMISSED_KEY); }
  function saveDismissed(id) { saveToList(DISMISSED_KEY, id); }

  var SEVERITY_RANK = { urgent: 0, important: 1, info: 2 };
  var SEVERITY_LABEL = { urgent: "Urgent", important: "Important", info: "Info" };

  function initBanner(items) {
    var banner = document.getElementById("site-banner");
    var pill = document.getElementById("urgent-pill");
    if (!banner || !Array.isArray(items)) return;

    var now = Date.now();
    var dismissed = getDismissed();
    var collapsed = getList(COLLAPSED_KEY);
    var active = items.filter(function (a) {
      if (!a || !a.id || !a.title) return false;
      if (a.expiresAt && Date.parse(a.expiresAt) < now) return false;
      if (a.severity !== "urgent" && dismissed.indexOf(a.id) !== -1) return false;
      return true;
    });

    if (!active.length) {
      banner.hidden = true;
      if (pill) pill.hidden = true;
      return;
    }
    /* Highest severity first, then soonest to expire */
    active.sort(function (a, b) {
      var ra = SEVERITY_RANK[a.severity] == null ? 1 : SEVERITY_RANK[a.severity];
      var rb = SEVERITY_RANK[b.severity] == null ? 1 : SEVERITY_RANK[b.severity];
      if (ra !== rb) return ra - rb;
      return (Date.parse(a.expiresAt || "9999") || 0) - (Date.parse(b.expiresAt || "9999") || 0);
    });

    var current = active[0];
    var severity = SEVERITY_RANK[current.severity] == null ? "important" : current.severity;
    var isUrgent = severity === "urgent";
    var label = SEVERITY_LABEL[severity] || "Important";

    /* Urgent collapsed to a pill in the sticky header — not dismissed.
       It returns as a full banner on the next page load until removed or expired. */
    if (isUrgent && collapsed.indexOf(current.id) !== -1) {
      banner.hidden = true;
      if (pill) {
        document.getElementById("urgent-pill-text").textContent = "1 Urgent Alert";
        pill.hidden = false;
        pill.onclick = function () {
          removeFromList(COLLAPSED_KEY, current.id);
          pill.hidden = true;
          banner.hidden = false;
          window.scrollTo({ top: 0, behavior: "smooth" });
        };
      }
      return;
    }
    if (pill) pill.hidden = true;

    banner.dataset.severity = severity;
    document.getElementById("banner-badge").textContent = label;
    document.getElementById("banner-text").textContent =
      current.title + (active.length > 1 ? "  (" + active.length + " notices)" : "");

    var linkEl = document.getElementById("banner-link");
    linkEl.hidden = true;
    linkEl.removeAttribute("target");
    if (current.actionHref && current.actionLabel) {
      linkEl.href = current.actionHref;
      linkEl.textContent = current.actionLabel;
      linkEl.hidden = false;
      if (/^https?:/.test(current.actionHref)) {
        linkEl.target = "_blank";
        linkEl.rel = "noopener";
      }
    }

    var closeBtn = document.getElementById("banner-close-btn");
    closeBtn.hidden = false;
    closeBtn.setAttribute("aria-label", isUrgent ? "Hide urgent alert (shows as a pill)" : "Dismiss announcement");
    closeBtn.onclick = function () {
      if (isUrgent) {
        saveToList(COLLAPSED_KEY, current.id);
        banner.hidden = true;
        if (pill) {
          document.getElementById("urgent-pill-text").textContent = "1 Urgent Alert";
          pill.hidden = false;
          pill.onclick = function () {
            removeFromList(COLLAPSED_KEY, current.id);
            pill.hidden = true;
            banner.hidden = false;
            window.scrollTo({ top: 0, behavior: "smooth" });
          };
        }
      } else {
        saveDismissed(current.id);
        banner.hidden = true;
      }
    };

    var detailsBtn = document.getElementById("banner-details-btn");
    var alertModal = document.getElementById("alert-modal");
    if (detailsBtn && alertModal) {
      detailsBtn.onclick = function () {
        document.getElementById("alert-modal-badge").textContent = label + (isUrgent ? " Alert" : " Notice");
        document.getElementById("alert-modal-title").textContent = current.title;
        document.getElementById("alert-modal-body").textContent = current.details || current.title;
        var modalCta = document.getElementById("alert-modal-cta");
        if (current.actionHref) {
          modalCta.href = current.actionHref;
          modalCta.textContent = current.actionLabel || "View Details";
          modalCta.hidden = false;
        } else {
          modalCta.hidden = true;
        }
        alertModal.showModal();
      };
    }

    banner.hidden = false;
  }


  /* ------------------------------------------------------------
     4. New-Neighbor 30-Day Checklist (Behavioral Gamification)
     ------------------------------------------------------------ */
  var ONBOARD_KEY = "sc_onboarding_v1";
  function initOnboarding() {
    var list = document.getElementById("onboard-list");
    if (!list) return;
    var state = {};
    try { state = JSON.parse(localStorage.getItem(ONBOARD_KEY) || "{}"); } catch (e) {}

    var boxes = list.querySelectorAll("input[type='checkbox']");
    function renderProgress() {
      var done = 0;
      boxes.forEach(function (b) { if (b.checked) done++; });
      var pct = Math.round((done / boxes.length) * 100);
      document.getElementById("onboard-pct").textContent = pct + "%";
      document.getElementById("onboard-fill").style.width = pct + "%";
      document.getElementById("onboard-progressbar").setAttribute("aria-valuenow", String(pct));
      document.getElementById("onboard-done").hidden = pct < 100;
    }

    boxes.forEach(function (box) {
      var key = box.dataset.step;
      if (state[key]) box.checked = true;
      box.addEventListener("change", function () {
        state[key] = box.checked;
        try { localStorage.setItem(ONBOARD_KEY, JSON.stringify(state)); } catch (e) {}
        renderProgress();
      });
    });
    renderProgress();
  }
  initOnboarding();

  /* ------------------------------------------------------------
     5. Copy-to-Clipboard Micro-Interactions
     ------------------------------------------------------------ */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.dataset.copy;
      var orig = btn.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {});
      }
      btn.textContent = "Copied!";
      btn.classList.add("is-copied");
      setTimeout(function () {
        btn.textContent = orig;
        btn.classList.remove("is-copied");
      }, 2000);
    });
  });

  var copyParkingBtn = document.getElementById("copy-parking-link-btn");
  if (copyParkingBtn) {
    copyParkingBtn.addEventListener("click", function () {
      var url = window.location.origin + window.location.pathname + "#parking-guide";
      var orig = copyParkingBtn.textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).catch(function () {});
      }
      copyParkingBtn.textContent = "Copied Guest Parking Link!";
      setTimeout(function () { copyParkingBtn.textContent = orig; }, 2200);
    });
  }

  /* ------------------------------------------------------------
     6. Interactive ARC Approval Pre-Check & Responsibility Matrix
     ------------------------------------------------------------ */
  var ARC_DATA = {
    paint: {
      status: "ARC Approval Required",
      title: "Exterior Paint, Front Doors & Shutters",
      bullets: [
        "Repainting in the exact original builder color scheme still requires a quick confirmation request.",
        "Any color change on front doors or trim requires paint manufacturer swatches/codes.",
        "Attach a photo of your townhome elevation and neighboring units in CiraNet."
      ]
    },
    patio: {
      status: "ARC Approval Required",
      title: "Rear Patio Extensions, Pavers & Privacy Screens",
      bullets: [
        "Extensions beyond the original concrete pad footprint require Board & ARC review.",
        "Include a lot diagram showing dimensions, materials, and drainage runoff direction.",
        "Permanent structures may not encroach onto HOA-maintained common lawn areas."
      ]
    },
    storm: {
      status: "ARC Approval Required",
      title: "Storm Doors & Replacement Windows",
      bullets: [
        "Full-view clear glass storm doors matching trim/door frame color are typically approved.",
        "Replacement windows must match existing grid patterns and exterior frame color.",
        "Include manufacturer spec sheet and product photo with your CiraNet submission."
      ]
    },
    camera: {
      status: "Conditional · Review Guidelines",
      title: "Video Doorbells, Security Cameras & Satellite Dishes",
      bullets: [
        "Standard doorbell cameras mounted on existing door trim generally do not require structural modification.",
        "Roof-mounted satellite dishes or cameras drilled into siding/brick require prior ARC placement approval.",
        "Ensure camera angles respect neighboring townhome privacy."
      ]
    },
    landscape: {
      status: "Approval Needed Outside Rear Patio",
      title: "Potted Planters, Edging & Landscaping",
      bullets: [
        "Movable planters contained strictly on your rear concrete patio do not require ARC approval.",
        "Adding mulch beds, edging, shrubs, or stepping stones in common turf areas requires prior ARC approval.",
        "HOA landscapers maintain all front beds; owner-planted items in common beds risk trimming."
      ]
    }
  };

  function initArcPrecheck() {
    var resultBox = document.getElementById("arc-result");
    var tabs = document.querySelectorAll("[data-arc]");
    if (!resultBox || !tabs.length) return;

    function renderArc(key) {
      var item = ARC_DATA[key] || ARC_DATA.paint;
      resultBox.innerHTML =
        '<span class="arc-result__status">' + item.status + '</span>' +
        '<h4>' + item.title + '</h4>' +
        '<ul>' + item.bullets.map(function (b) { return '<li>' + b + '</li>'; }).join("") + '</ul>' +
        '<a class="btn btn--solid" href="https://resident.ciranet.com/user/login?returnUrl=%2Fhome" target="_blank" rel="noopener">Start ARC Application in CiraNet ↗</a>';
    }

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
        renderArc(tab.dataset.arc);
      });
    });
    renderArc("paint");
  }
  initArcPrecheck();

  var matrixBtns = document.querySelectorAll("[data-matrix]");
  var matrixRows = document.querySelectorAll("#matrix-body tr");
  matrixBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.dataset.matrix;
      matrixBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      matrixRows.forEach(function (row) {
        row.hidden = filter !== "all" && row.dataset.cat !== filter;
      });
    });
  });

  /* ------------------------------------------------------------
     7. Unified On-Site Vendor Directory + Modal Reviews
     ------------------------------------------------------------ */
  var vendorsList = [];
  var activeCategory = "All";
  var activeVendorId = null;
  var showAllVendors = false;
  var VENDOR_LIMIT = 6;

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderVendors() {
    var grid = document.getElementById("vendor-grid");
    var countEl = document.getElementById("vendor-count");
    if (!grid) return;

    var query = (document.getElementById("vendor-search").value || "").trim().toLowerCase();
    var testedOnly = document.getElementById("vendor-tested-only").checked;
    var sortBy = document.getElementById("vendor-sort").value;

    var filtered = vendorsList.filter(function (v) {
      if (testedOnly && !v.tested) return false;
      if (activeCategory !== "All" && v.category !== activeCategory) return false;
      if (!query) return true;
      var hay = [v.name, v.category, v.summary, v.verifiedNotes].join(" ").toLowerCase();
      return hay.indexOf(query) !== -1;
    });

    filtered.sort(function (a, b) {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return (b.vouches || 0) - (a.vouches || 0) || (b.tested ? 1 : 0) - (a.tested ? 1 : 0);
    });

    if (countEl) {
      countEl.textContent = "Showing " + filtered.length + " of " + vendorsList.length + " neighborhood pros";
    }

    if (!filtered.length) {
      grid.innerHTML = '<div class="notice"><strong>No matching vendors found.</strong> Try clearing your search filter or recommend a new local pro below.</div>';
      return;
    }

    var displayed = filtered;
    var hasMore = false;
    if (!showAllVendors && filtered.length > VENDOR_LIMIT) {
      displayed = filtered.slice(0, VENDOR_LIMIT);
      hasMore = true;
    }

    grid.innerHTML = displayed.map(function (v) {

      var badge = v.tested
        ? '<span class="vend__tag vend__tag--tested">★ Community Tested</span>'
        : '<span class="vend__tag vend__tag--new">Neighbor Lead</span>';
      var proof = v.tested
        ? '★ ' + Number(v.rating).toFixed(1) + ' · Vouched for by ' + v.vouches + ' Stone Creek neighbor' + (v.vouches === 1 ? '' : 's')
        : 'Not yet reviewed — be the first neighbor to vouch';
      var telHref = v.phone ? 'tel:' + v.phone.replace(/[^0-9+]/g, "") : "";
      var callBtn = v.phone ? '<a class="vcard__btn vcard__btn--primary" href="' + escapeHtml(telHref) + '">Call ' + escapeHtml(v.phone) + '</a>' : '';
      var webBtn = v.website ? '<a class="vcard__btn" href="' + escapeHtml(v.website) + '" target="_blank" rel="noopener">Website ↗</a>' : '';

      return (
        '<article class="vcard ' + (v.tested ? 'vcard--tested' : '') + '">' +
          '<div>' +
            '<div class="vcard__top">' +
              '<span class="vcard__cat">' + escapeHtml(v.category) + '</span>' +
              badge +
            '</div>' +
            '<h3 class="vcard__name">' + escapeHtml(v.name) + '</h3>' +
            '<p class="vcard__proof">' + escapeHtml(proof) + '</p>' +
            '<p class="vcard__summary">' + escapeHtml(v.summary) + '</p>' +
          '</div>' +
          '<div class="vcard__actions">' +
            callBtn +
            webBtn +
            '<button type="button" class="vcard__btn" data-vendor-id="' + escapeHtml(v.id) + '">Reviews &amp; Vouch (' + (v.reviews ? v.reviews.length : 0) + ')</button>' +
          '</div>' +
        '</article>'
      );
    }).join("");


    if (hasMore) {
      grid.innerHTML += '<div style="grid-column: 1 / -1; text-align: center; margin-top: 1rem;"><button type="button" class="btn btn--ghost" id="show-more-vendors-btn">Show all ' + filtered.length + ' vendors ↓</button></div>';
      document.getElementById("show-more-vendors-btn").addEventListener("click", function() {
        showAllVendors = true;
        renderVendors();
      });
    }

    grid.querySelectorAll("[data-vendor-id]").forEach(function (btn) {

      btn.addEventListener("click", function () {
        openVendorModal(btn.dataset.vendorId);
      });
    });
  }

  function openVendorModal(vendorId) {
    var modal = document.getElementById("vendor-modal");
    if (!modal) return;
    var isNew = vendorId === "__new__";
    activeVendorId = isNew ? null : vendorId;

    var newFields = document.getElementById("new-vendor-fields");
    var tagEl = document.getElementById("vendor-modal-tag");
    var titleEl = document.getElementById("vendor-modal-title");
    var metaEl = document.getElementById("vendor-modal-meta");
    var sumEl = document.getElementById("vendor-modal-summary");
    var linksEl = document.getElementById("vendor-modal-links");
    var reviewsEl = document.getElementById("vendor-modal-reviews");
    var headingEl = document.getElementById("review-form-heading");
    document.getElementById("vendor-review-status").textContent = "";

    if (isNew) {
      newFields.hidden = false;
      tagEl.className = "vend__tag vend__tag--new";
      tagEl.textContent = "New Recommendation";
      titleEl.textContent = "Recommend a Local Service Pro";
      metaEl.textContent = "Submissions are reviewed by the Board before publishing to the live directory.";
      sumEl.textContent = "Share a contractor, plumber, electrician, or home specialist you personally hired at Stone Creek.";
      linksEl.innerHTML = "";
      reviewsEl.innerHTML = "";
      headingEl.textContent = "Vendor & Experience Details";
    } else {
      var v = vendorsList.find(function (item) { return item.id === vendorId; });
      if (!v) return;
      newFields.hidden = true;
      tagEl.className = v.tested ? "vend__tag vend__tag--tested" : "vend__tag vend__tag--new";
      tagEl.textContent = v.tested ? "★ Community Tested" : "Neighbor Lead";
      titleEl.textContent = v.name;
      metaEl.textContent = v.category + (v.verifiedNotes ? " · " + v.verifiedNotes : "");
      sumEl.textContent = v.summary;

      var linksHtml = "";
      if (v.phone) {
        linksHtml += '<a class="btn btn--solid" href="tel:' + escapeHtml(v.phone.replace(/[^0-9+]/g, "")) + '">Call ' + escapeHtml(v.phone) + '</a>';
      }
      if (v.website) {
        linksHtml += '<a class="btn btn--ghost" href="' + escapeHtml(v.website) + '" target="_blank" rel="noopener">Visit Website ↗</a>';
      }
      linksEl.innerHTML = linksHtml;

      if (v.reviews && v.reviews.length) {
        reviewsEl.innerHTML = v.reviews.map(function (r) {
          return (
            '<div class="review-card">' +
              '<div class="review-card__top"><span>' + escapeHtml(r.author) + '</span><span>★ ' + escapeHtml(r.rating) + '/5 · ' + escapeHtml(r.date) + '</span></div>' +
              '<p>' + escapeHtml(r.text) + '</p>' +
            '</div>'
          );
        }).join("");
      } else {
        reviewsEl.innerHTML = '<p class="modal__body">No written reviews yet. Have you hired ' + escapeHtml(v.name) + '? Add your vouch below!</p>';
      }
      headingEl.textContent = "Leave a Verified Resident Review";
    }

    modal.showModal();
  }

  function initVendors(data) {
    vendorsList = Array.isArray(data) ? data : [];
    var vettedCount = vendorsList.filter(function (v) { return v.tested; }).length;
    var vitality = document.getElementById("hero-vitality");
    if (vitality) {
      var monthYear = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
      vitality.textContent = "Stallings, NC · Updated " + monthYear + " · " + vettedCount + " Vetted Vendors";
    }

    var searchInput = document.getElementById("vendor-search");
    var testedCheck = document.getElementById("vendor-tested-only");
    var sortSelect = document.getElementById("vendor-sort");
    if (searchInput) searchInput.addEventListener("input", function() { showAllVendors = false; renderVendors(); });
    if (testedCheck) testedCheck.addEventListener("change", function() { showAllVendors = false; renderVendors(); });
    if (sortSelect) sortSelect.addEventListener("change", function() { showAllVendors = false; renderVendors(); });

    document.querySelectorAll("#vendor-categories [data-cat]").forEach(function (pill) {
      pill.addEventListener("click", function () {
        document.querySelectorAll("#vendor-categories [data-cat]").forEach(function (p) { p.classList.remove("is-active"); });
        pill.classList.add("is-active");
        activeCategory = pill.dataset.cat;
        showAllVendors = false;
        renderVendors();
      });
    });

    var newBtn = document.getElementById("open-new-vendor-btn");
    if (newBtn) newBtn.addEventListener("click", function () { openVendorModal("__new__"); });

    var reviewForm = document.getElementById("vendor-review-form");
    if (reviewForm) {
      reviewForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var fd = new FormData(reviewForm);
        var statusEl = document.getElementById("vendor-review-status");
        var payload = {
          vendorId: activeVendorId || "new",
          vendorName: fd.get("vendorName") || "",
          vendorCategory: fd.get("vendorCategory") || "",
          vendorPhone: fd.get("vendorPhone") || "",
          vendorWebsite: fd.get("vendorWebsite") || "",
          residentStreet: fd.get("residentStreet"),
          rating: Number(fd.get("rating") || 5),
          reviewText: fd.get("reviewText"),
          submittedAt: new Date().toISOString()
        };

        if (CONFIG.vendorReviewWebhookUrl) {
          fetch(CONFIG.vendorReviewWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }).catch(function () {});
        }

        if (activeVendorId) {
          var target = vendorsList.find(function (v) { return v.id === activeVendorId; });
          if (target) {
            target.tested = true;
            target.vouches = (target.vouches || 0) + 1;
            target.rating = target.rating ? Number(((target.rating + payload.rating) / 2).toFixed(1)) : payload.rating;
            target.reviews = target.reviews || [];
            target.reviews.unshift({
              author: "Verified Resident · " + payload.residentStreet,
              date: "Just now",
              rating: payload.rating,
              text: payload.reviewText
            });
            renderVendors();
          }
        }

        statusEl.textContent = "Thank you, neighbor! Your review has been recorded for Stone Creek.";
        reviewForm.reset();
        setTimeout(function () {
          var dlg = document.getElementById("vendor-modal");
          if (dlg && dlg.open) dlg.close();
        }, 1400);
      });
    }

    renderVendors();
  }

  /* ------------------------------------------------------------
     8. Pavilion 4-Hour Slot Picker & On-Site Booking Modal
     ------------------------------------------------------------ */
  function initPavilionBooking() {
    var dateInput = document.getElementById("booking-date");
    var slotBtns = document.querySelectorAll("#slot-grid .slot-btn");
    var openBtn = document.getElementById("open-booking-modal-btn");
    var bookingModal = document.getElementById("booking-modal");
    var bookingForm = document.getElementById("pavilion-booking-form");
    if (!dateInput || !openBtn || !bookingModal || !bookingForm) return;

    /* Default date to upcoming Saturday */
    var d = new Date();
    var daysUntilSat = (6 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSat);
    var isoDate = d.toISOString().split("T")[0];
    dateInput.min = new Date().toISOString().split("T")[0];
    dateInput.value = isoDate;

    var selectedSlot = "9:00 AM – 1:00 PM (Morning)";
    slotBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        slotBtns.forEach(function (b) { b.classList.remove("is-selected"); });
        btn.classList.add("is-selected");
        selectedSlot = btn.dataset.slot;
      });
    });

    openBtn.addEventListener("click", function () {
      var chosenDate = dateInput.value || isoDate;
      document.getElementById("modal-booking-date").value = chosenDate;
      document.getElementById("modal-booking-slot").value = selectedSlot;
      document.getElementById("booking-summary-text").textContent =
        "Selected Date: " + chosenDate + " · Block: " + selectedSlot;
      document.getElementById("booking-status").textContent = "";
      bookingModal.showModal();
    });

    bookingForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(bookingForm);
      var statusEl = document.getElementById("booking-status");
      var payload = {
        date: fd.get("date"),
        slot: fd.get("slot"),
        residentName: fd.get("residentName"),
        unitAddress: fd.get("unitAddress"),
        residentEmail: fd.get("residentEmail"),
        eventDetails: fd.get("eventDetails"),
        rulesAccepted: true
      };

      if (CONFIG.pavilionWebhookUrl) {
        statusEl.textContent = "Sending reservation request…";
        fetch(CONFIG.pavilionWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
          .then(function () {
            statusEl.textContent = "Request received! Check your email shortly for automated confirmation.";
            bookingForm.reset();
          })
          .catch(function () {
            statusEl.textContent = "Opening Google Form backup to complete your booking…";
            window.open(CONFIG.googleBookingFormUrl, "_blank", "noopener");
          });
      } else {
        statusEl.textContent = "Slot details captured! Forwarding to the automated booking form to finalize…";
        setTimeout(function () {
          window.open(CONFIG.googleBookingFormUrl, "_blank", "noopener");
          bookingModal.close();
        }, 900);
      }
    });
  }
  initPavilionBooking();

  /* ------------------------------------------------------------
     9. Live FAQ Keyword Search
     ------------------------------------------------------------ */
  function initFaqSearch() {
    var input = document.getElementById("faq-search");
    var items = document.querySelectorAll("#faq-list .faq__item");
    var countEl = document.getElementById("faq-count");
    if (!input || !items.length) return;

    function filterFaq() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (item) {
        var match = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
        item.hidden = !match;
        if (match) {
          shown++;
          if (q) item.open = true;
        }
      });
      if (countEl) {
        countEl.textContent = q ? ("Showing " + shown + " matching question" + (shown === 1 ? "" : "s")) : "";
      }
    }
    input.addEventListener("input", filterFaq);
  }
  initFaqSearch();

  
  /* ------------------------------------------------------------
     9b. On-Site Board Feedback Form
     ------------------------------------------------------------ */
  function initBoardFeedback() {
    var openBtns = document.querySelectorAll(".open-feedback-modal-btn");
    var modal = document.getElementById("feedback-modal");
    var form = document.getElementById("board-feedback-form");
    if (!modal || !form) return;

    openBtns.forEach(function(btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        document.getElementById("feedback-status").textContent = "";
        modal.showModal();
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var statusEl = document.getElementById("feedback-status");
      var payload = {
        residentName: fd.get("residentName"),
        unitAddress: fd.get("unitAddress"),
        residentEmail: fd.get("residentEmail"),
        topic: fd.get("topic"),
        message: fd.get("feedbackMessage"),
        submittedAt: new Date().toISOString()
      };

      if (CONFIG.boardFeedbackWebhookUrl) {
        statusEl.textContent = "Sending message to the Board...";
        fetch(CONFIG.boardFeedbackWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
        .then(function () {
          statusEl.textContent = "Message sent successfully!";
          form.reset();
          setTimeout(function() { modal.close(); }, 1500);
        })
        .catch(function () {
          statusEl.textContent = "Opening Google Form fallback...";
          window.open(CONFIG.googleFeedbackFormUrl, "_blank", "noopener");
        });
      } else {
        statusEl.textContent = "Forwarding to Google Form...";
        setTimeout(function () {
          window.open(CONFIG.googleFeedbackFormUrl, "_blank", "noopener");
          modal.close();
        }, 900);
      }
    });
  }
  initBoardFeedback();

/* ------------------------------------------------------------
     10. Load JSON Feeds (with local file:// fallback)
     ------------------------------------------------------------ */
  fetch("announcements.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(initBanner)
    .catch(function () { initBanner([]); });

  fetch("vendors.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : FALLBACK_VENDORS; })
    .then(initVendors)
    .catch(function () { initVendors(FALLBACK_VENDORS); });
})();
