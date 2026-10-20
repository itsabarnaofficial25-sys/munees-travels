/* ============================================================
   OCEAN VOYAGE HOLIDAYS — main.js
   Handles: mobile nav, footer year, enquiry form -> Firestore,
   newsletter -> Firestore, dynamic "Trending Tours" from Firestore
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const yr = document.getElementById("year"); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    const setNav = (open) => {
      mainNav.classList.toggle("active", open);
      document.body.classList.toggle("nav-open", open);
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    };
    navToggle.addEventListener("click", () => setNav(!mainNav.classList.contains("active")));
    mainNav.addEventListener("click", (e) => { if (e.target.closest("a")) setNav(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 992) setNav(false); });
  }

  initHeroSlider();

  /* ---------- Hero search: scroll to enquiry, prefill destination ---------- */
  const searchForm = document.getElementById("searchForm");
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const dest = document.getElementById("destination").value;
      const contactDest = document.getElementById("destinationTravel");
      if (contactDest && dest) contactDest.value = dest;
      document.getElementById("contact").scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ---------- Enquiry form -> Firestore "leads" ---------- */
  const enquiryForm = document.getElementById("enquiryForm");
  const formStatus = document.getElementById("formStatus");
  if (enquiryForm) {
    enquiryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = enquiryForm.querySelector("button[type=submit]");
      const lead = {
        name: document.getElementById("name").value.trim(),
        city: document.getElementById("city").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        destination: document.getElementById("destinationTravel").value.trim(),
        travelDate: document.getElementById("travelDate").value.trim(),
        people: document.getElementById("people").value,
        vacationType: document.getElementById("vacationType").value,
        status: "new",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
      try {
        await db.collection("leads").add(lead);
        formStatus.textContent = "Thank you! Our travel expert will contact you shortly.";
        formStatus.className = "ok";
        enquiryForm.reset();
      } catch (err) {
        console.error(err);
        formStatus.textContent = "Couldn't send right now — please call us at +91 99408 82200, or check the Firebase setup in js/firebase-config.js.";
        formStatus.className = "err";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Enquire Now";
      }
    });
  }

  /* ---------- Newsletter -> Firestore "subscribers" ---------- */
  const newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("newsletterEmail").value.trim();
      try {
        await db.collection("subscribers").add({
          email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        newsletterForm.reset();
        alert("Subscribed! Watch your inbox for travel ideas.");
      } catch (err) {
        console.error(err);
        alert("Couldn't subscribe right now — please try again later.");
      }
    });
  }

  /* ---------- Trending tours: load from Firestore "packages" ----------
     If Firebase isn't configured yet, or the collection is empty,
     the static fallback cards already in the HTML stay as they are. */
  loadPackages();
});

/* ---------- Hero image carousel (5 slides, auto + manual) ---------- */
function initHeroSlider() {
  const slides = document.querySelectorAll(".hero-slide");
  const dotsWrap = document.getElementById("heroDots");
  const prevBtn = document.getElementById("heroPrev");
  const nextBtn = document.getElementById("heroNext");
  if (!slides.length || !dotsWrap) return;

  let current = 0;
  const AUTOPLAY_MS = 5500;

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    if (i === 0) dot.classList.add("active");
    dot.setAttribute("aria-label", "Go to slide " + (i + 1));
    dot.addEventListener("click", () => { goTo(i); resetTimer(); });
    dotsWrap.appendChild(dot);
  });
  const dots = dotsWrap.querySelectorAll("button");

  function goTo(index) {
    slides[current].classList.remove("active");
    dots[current].classList.remove("active");
    current = (index + slides.length) % slides.length;
    slides[current].classList.add("active");
    dots[current].classList.add("active");
  }

  let timer = setInterval(() => goTo(current + 1), AUTOPLAY_MS);
  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), AUTOPLAY_MS);
  }

  if (nextBtn) nextBtn.addEventListener("click", () => { goTo(current + 1); resetTimer(); });
  if (prevBtn) prevBtn.addEventListener("click", () => { goTo(current - 1); resetTimer(); });
}

async function loadPackages() {
  const grid = document.getElementById("trendingGrid");
  if (!grid || typeof db === "undefined") return;

  try {
    const snap = await db.collection("packages")
      .orderBy("createdAt", "desc")
      .limit(8)
      .get();

    if (snap.empty) return; // keep fallback cards

    grid.innerHTML = "";
    snap.forEach((doc) => {
      const p = doc.data();
      const card = document.createElement("div");
      card.className = "trend-card";
      card.innerHTML = `
        <div class="img"><img src="${p.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80'}" alt="${p.title || 'Tour package'}"></div>
        <div class="body">
          <div class="loc">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10z"/><circle cx="12" cy="11" r="2.5"/></svg>
            ${p.location || ""}
          </div>
          <h4>${p.title || "Untitled package"}</h4>
          <div class="duration">${p.duration || ""}${p.price ? " · ₹" + p.price : ""}</div>
        </div>`;
      grid.appendChild(card);
    });
  } catch (err) {
    // Firebase not configured yet, or offline — silently keep fallback content
    console.warn("Packages not loaded (this is fine before Firebase is configured):", err.message);
  }
}
