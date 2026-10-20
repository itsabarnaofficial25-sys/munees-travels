/* ============================================================
   MUNEES TRAVELS — ADMIN.JS (ALL-IN-ONE)
   Login + Dashboard + Bookings + Enquiries + Services
   + Gallery + Testimonials + Mobile Nav + Logout
   ============================================================ */

const auth = firebase.auth();

/* ============================================================
   1. MOBILE SIDEBAR TOGGLE (All admin pages)
   ============================================================ */
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
const adminSidebar = document.getElementById("adminSidebar");

function openSidebar() {
  adminSidebar?.classList.add("open");
  sidebarBackdrop?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  adminSidebar?.classList.remove("open");
  sidebarBackdrop?.classList.remove("open");
  document.body.style.overflow = "";
}

mobileMenuBtn?.addEventListener("click", openSidebar);
sidebarCloseBtn?.addEventListener("click", closeSidebar);
sidebarBackdrop?.addEventListener("click", closeSidebar);

// Close sidebar on link click (mobile)
document.querySelectorAll(".admin-sidebar a").forEach(link => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 900) closeSidebar();
  });
});

// ESC key closes sidebar
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSidebar();
});

// Auto-close on desktop
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) closeSidebar();
});

/* ============================================================
   2. AUTH GUARD + USER EMAIL (All admin pages)
   ============================================================ */
auth.onAuthStateChanged((user) => {
  if (!user) {
    // Not logged in → redirect to login (except on login.html)
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = "login.html";
    }
    return;
  }
  // Show user email in sidebar
  const emailEl = document.getElementById("userEmail");
  if (emailEl) emailEl.textContent = user.email;
});

/* ============================================================
   3. LOGOUT (All admin pages)
   ============================================================ */
function logout() {
  if (confirm("Logout from admin panel?")) {
    auth.signOut()
      .then(() => window.location.href = "login.html")
      .catch((err) => {
        console.error("Logout error:", err);
        window.location.href = "login.html";
      });
  }
}
window.logout = logout;

/* ============================================================
   4. LOGIN PAGE
   ============================================================ */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("errorMsg");

  // If already logged in → go to dashboard
  auth.onAuthStateChanged((user) => {
    if (user) window.location.href = "dashboard.html";
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginError.style.color = "#0EA5E9";
    loginError.textContent = "Logging in...";
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    try {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      console.log("✅ Login success:", cred.user.email);
      loginError.style.color = "#16A34A";
      loginError.textContent = "✅ Success! Redirecting...";
      setTimeout(() => window.location.href = "dashboard.html", 400);
    } catch (err) {
      console.error("❌ Login error:", err.code, err.message);

      let msg = "Invalid email or password";
      if (err.code === "auth/user-not-found") msg = "❌ User not found";
      else if (err.code === "auth/wrong-password") msg = "❌ Wrong password";
      else if (err.code === "auth/invalid-credential") msg = "❌ Email/Password mismatch";
      else if (err.code === "auth/invalid-email") msg = "❌ Invalid email format";
      else if (err.code === "auth/too-many-requests") msg = "⏸ Too many attempts. Wait a bit.";
      else if (err.code === "auth/network-request-failed") msg = "🌐 Network error";

      loginError.style.color = "#DC2626";
      loginError.textContent = msg;
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';
    }
  });
}

/* ============================================================
   5. DASHBOARD PAGE
   ============================================================ */
async function loadDashboardCounts() {
  const cols = [
    { col: "enquiries", id: "enqCount" },
    { col: "bookings", id: "bkgCount" },
    { col: "gallery", id: "galCount" },
    { col: "packages", id: "pkgCount" }
  ];

  for (const c of cols) {
    const el = document.getElementById(c.id);
    if (!el) continue;
    try {
      const snap = await db.collection(c.col).get();
      el.textContent = snap.size;
    } catch (err) {
      console.warn(`Count failed for ${c.col}:`, err.message);
      el.textContent = "0";
    }
  }
}

if (document.getElementById("enqCount")) {
  auth.onAuthStateChanged((user) => {
    if (user) loadDashboardCounts();
  });
}

/* ============================================================
   6. MANAGE SERVICES PAGE
   ============================================================ */
const serviceForm = document.getElementById("serviceForm");
if (serviceForm) {
  const statusMsg = document.getElementById("statusMsg");
  const submitBtn = document.getElementById("submitBtn");
  const serviceList = document.getElementById("serviceList");
  const countEl = document.getElementById("count");

  serviceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    statusMsg.textContent = "";

    try {
      await db.collection("services").add({
        title: document.getElementById("title").value.trim(),
        icon: document.getElementById("icon").value.trim(),
        desc: document.getElementById("desc").value.trim(),
        img: document.getElementById("img").value.trim(),
        createdAt: new Date().toISOString()
      });

      statusMsg.style.color = "#16A34A";
      statusMsg.textContent = "✅ Service added successfully!";
      serviceForm.reset();
      loadServices();
    } catch (err) {
      statusMsg.style.color = "#DC2626";
      statusMsg.textContent = "❌ " + err.message;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Service';
    }
  });

  async function loadServices() {
    if (!serviceList) return;
    try {
      const snap = await db.collection("services").orderBy("createdAt", "desc").get();
      if (countEl) countEl.textContent = snap.size;

      if (snap.empty) {
        serviceList.innerHTML = `<div class="admin-empty" style="grid-column:1/-1;"><i class="fas fa-inbox"></i>No services yet</div>`;
        return;
      }

      serviceList.innerHTML = "";
      snap.forEach((doc) => {
        const d = doc.data();
        serviceList.innerHTML += `
          <div class="admin-item">
            <div class="admin-item-img">
              <img src="${d.img}" alt="${d.title}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            </div>
            <div class="admin-item-body">
              <h4><i class="${d.icon || 'fas fa-star'}"></i> ${d.title}</h4>
              <p>${d.desc}</p>
              <div class="admin-item-actions">
                <button class="admin-btn-icon delete" onclick="deleteService('${doc.id}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>`;
      });
    } catch (err) {
      serviceList.innerHTML = `<div class="admin-empty" style="grid-column:1/-1;color:#DC2626;"><i class="fas fa-exclamation-triangle"></i>Error: ${err.message}</div>`;
    }
  }

  window.deleteService = async function (id) {
    if (!confirm("Delete this service?")) return;
    await db.collection("services").doc(id).delete();
    loadServices();
  };

  auth.onAuthStateChanged((user) => {
    if (user) loadServices();
  });
}

/* ============================================================
   7. MANAGE GALLERY PAGE
   ============================================================ */
const galleryForm = document.getElementById("galleryForm");
if (galleryForm) {
  const galleryStatus = document.getElementById("statusMsg");
  const galleryBtn = document.getElementById("submitBtn");
  const galleryList = document.getElementById("galleryList");
  const galleryCount = document.getElementById("count");

  galleryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    galleryBtn.disabled = true;
    galleryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    try {
      await db.collection("gallery").add({
        title: document.getElementById("title").value.trim(),
        category: document.getElementById("category").value,
        img: document.getElementById("img").value.trim(),
        createdAt: new Date().toISOString()
      });

      galleryStatus.style.color = "#16A34A";
      galleryStatus.textContent = "✅ Image added!";
      galleryForm.reset();
      loadGallery();
    } catch (err) {
      galleryStatus.style.color = "#DC2626";
      galleryStatus.textContent = "❌ " + err.message;
    } finally {
      galleryBtn.disabled = false;
      galleryBtn.innerHTML = '<i class="fas fa-plus"></i> Add Image';
    }
  });

  async function loadGallery() {
    if (!galleryList) return;
    const snap = await db.collection("gallery").orderBy("createdAt", "desc").get();
    if (galleryCount) galleryCount.textContent = snap.size;

    if (snap.empty) {
      galleryList.innerHTML = `<div class="admin-empty" style="grid-column:1/-1;"><i class="fas fa-inbox"></i>No images yet</div>`;
      return;
    }

    galleryList.innerHTML = "";
    snap.forEach((doc) => {
      const d = doc.data();
      galleryList.innerHTML += `
        <div class="admin-image-item">
          <button class="del-btn" onclick="deleteGallery('${doc.id}')"><i class="fas fa-trash"></i></button>
          <img src="${d.img}" alt="${d.title}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
          <div class="info">
            <h4>${d.title}</h4>
            <span>${d.category}</span>
          </div>
        </div>`;
    });
  }

  window.deleteGallery = async function (id) {
    if (!confirm("Delete this image?")) return;
    await db.collection("gallery").doc(id).delete();
    loadGallery();
  };

  auth.onAuthStateChanged((user) => {
    if (user) loadGallery();
  });
}

/* ============================================================
   8. MANAGE BOOKINGS PAGE
   ============================================================ */
let allBookings = [];
let currentFilter = "all";

if (document.getElementById("bookingList")) {
  async function loadBookings() {
    const list = document.getElementById("bookingList");
    try {
      const snap = await db.collection("bookings").orderBy("createdAt", "desc").get();
      allBookings = [];
      snap.forEach((doc) => allBookings.push({ id: doc.id, ...doc.data() }));
      updateStats();
      renderBookings();
    } catch (err) {
      console.error(err);
      list.innerHTML = `<div class="admin-empty" style="color:#DC2626;"><i class="fas fa-exclamation-triangle"></i>Error: ${err.message}</div>`;
    }
  }

  function updateStats() {
    const el = (id) => document.getElementById(id);
    if (el("countTotal")) el("countTotal").textContent = allBookings.length;
    if (el("countPending")) el("countPending").textContent = allBookings.filter(b => (b.status || "pending") === "pending").length;
    if (el("countConfirmed")) el("countConfirmed").textContent = allBookings.filter(b => b.status === "confirmed").length;
    if (el("countCompleted")) el("countCompleted").textContent = allBookings.filter(b => b.status === "completed").length;
  }

  function renderBookings() {
    const list = document.getElementById("bookingList");
    const filtered = currentFilter === "all"
      ? allBookings
      : allBookings.filter(b => (b.status || "pending") === currentFilter);

    if (!filtered.length) {
      list.innerHTML = `<div class="admin-empty"><i class="fas fa-inbox"></i>No bookings found</div>`;
      return;
    }

    list.innerHTML = "";
    filtered.forEach((b) => {
      const status = b.status || "pending";
      list.innerHTML += `
        <div class="admin-booking-card">
          <div class="admin-booking-head">
            <span class="admin-booking-id">${b.bookingId || 'BK-000000'}</span>
            <select class="admin-booking-status status-${status}" onchange="changeStatus('${b.id}', this.value)">
              <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="completed" ${status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
          <h4>${b.fullName || 'N/A'}</h4>
          <div class="admin-booking-row"><i class="fas fa-map-pin"></i> ${b.destination || 'N/A'}</div>
          <div class="admin-booking-row"><i class="fas fa-phone"></i> ${b.mobile || 'N/A'}</div>
          <div class="admin-booking-row"><i class="fas fa-calendar"></i> ${b.travelDate || 'N/A'}</div>
          <div class="admin-booking-row"><i class="fas fa-users"></i> ${b.adults || 0} Adults${b.children ? `, ${b.children} Children` : ''}</div>
          <div class="admin-booking-total">${b.estimatedTotal || '₹0'}</div>
          <div class="admin-booking-actions">
            <button class="admin-btn-icon view" onclick="viewBooking('${b.id}')" style="flex:1;width:auto;height:auto;padding:9px;gap:6px;font-size:12px;">
              <i class="fas fa-eye"></i> View
            </button>
            <a class="admin-btn-icon whatsapp" href="https://wa.me/91${b.mobile}" target="_blank" style="flex:1;width:auto;height:auto;padding:9px;gap:6px;font-size:12px;">
              <i class="fab fa-whatsapp"></i>
            </a>
            <button class="admin-btn-icon delete" onclick="deleteBooking('${b.id}')" style="flex:1;width:auto;height:auto;padding:9px;gap:6px;font-size:12px;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>`;
    });
  }

  window.changeStatus = async function (id, status) {
    try {
      await db.collection("bookings").doc(id).update({ status });
      const idx = allBookings.findIndex(b => b.id === id);
      if (idx > -1) allBookings[idx].status = status;
      updateStats();
      renderBookings();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  window.viewBooking = function (id) {
    const b = allBookings.find(x => x.id === id);
    if (!b) return;
    const rows = [
      ["Booking ID", b.bookingId],
      ["Name", b.fullName],
      ["Mobile", b.mobile],
      ["Email", b.email],
      ["City", b.city],
      ["Destination", b.destination],
      ["Package Type", b.packageType],
      ["Travel Date", b.travelDate],
      ["Return Date", b.returnDate || "—"],
      ["Adults", b.adults],
      ["Children", b.children || 0],
      ["Hotel", b.hotel],
      ["Add-ons", (b.addons && b.addons.length) ? b.addons.join(", ") : "None"],
      ["Estimated Total", b.estimatedTotal],
      ["Status", b.status || "pending"],
      ["Notes", b.notes || "—"],
      ["Submitted", b.createdAt ? new Date(b.createdAt).toLocaleString('en-IN') : "—"]
    ];
    document.getElementById("modalTitle").textContent = "Booking: " + (b.bookingId || "");
    document.getElementById("modalContent").innerHTML = rows.map(([k, v]) =>
      `<div class="admin-modal-row"><span>${k}</span><span>${v || '—'}</span></div>`
    ).join("");
    document.getElementById("bookingModal").classList.add("open");
  };

  window.closeModal = function () {
    document.getElementById("bookingModal").classList.remove("open");
  };

  window.deleteBooking = async function (id) {
    if (!confirm("Delete this booking permanently?")) return;
    await db.collection("bookings").doc(id).delete();
    loadBookings();
  };

  // Filters
  document.querySelectorAll(".admin-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderBookings();
    });
  });

  // Modal close
  document.getElementById("bookingModal")?.addEventListener("click", (e) => {
    if (e.target.id === "bookingModal") closeModal();
  });

  auth.onAuthStateChanged((user) => {
    if (user) loadBookings();
  });
}

/* ============================================================
   9. MANAGE ENQUIRIES PAGE
   ============================================================ */
if (document.getElementById("enqList")) {
  const enqList = document.getElementById("enqList");
  const enqCount = document.getElementById("count");

  async function loadEnquiries() {
    try {
      const snap = await db.collection("enquiries").orderBy("createdAt", "desc").get();
      if (enqCount) enqCount.textContent = snap.size;

      if (snap.empty) {
        enqList.innerHTML = `<div class="admin-empty"><i class="fas fa-inbox"></i>No enquiries yet</div>`;
        return;
      }

      enqList.innerHTML = "";
      snap.forEach((doc) => {
        const e = doc.data();
        const date = e.createdAt ? new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        const initial = (e.name || 'U').charAt(0).toUpperCase();

        enqList.innerHTML += `
          <div class="enq-card">
            <div class="enq-head">
              <div class="enq-avatar">${initial}</div>
              <div class="enq-date">${date}</div>
            </div>
            <h4>${e.name || 'Unknown'}</h4>
            <div class="enq-row"><i class="fas fa-envelope"></i> ${e.email || 'N/A'}</div>
            <div class="enq-row"><i class="fas fa-phone"></i> ${e.phone || 'N/A'}</div>
            ${e.city ? `<div class="enq-row"><i class="fas fa-map-pin"></i> ${e.city}</div>` : ''}
            ${e.destination ? `<div class="enq-row"><i class="fas fa-plane"></i> ${e.destination}</div>` : ''}
            ${e.vacationType ? `<div class="enq-row"><i class="fas fa-tag"></i> ${e.vacationType}</div>` : ''}
            <div class="enq-actions">
              <a class="admin-btn-icon view" href="mailto:${e.email}" style="flex:1;width:auto;height:auto;padding:9px;text-decoration:none;font-size:12px;font-weight:600;gap:6px;">
                <i class="fas fa-reply"></i> Reply
              </a>
              <a class="admin-btn-icon whatsapp" href="https://wa.me/91${e.phone}" target="_blank" style="flex:1;width:auto;height:auto;padding:9px;text-decoration:none;font-size:12px;font-weight:600;gap:6px;">
                <i class="fab fa-whatsapp"></i>
              </a>
              <button class="admin-btn-icon delete" onclick="deleteEnquiry('${doc.id}')" style="flex:1;width:auto;height:auto;padding:9px;gap:6px;font-size:12px;font-weight:600;">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>`;
      });
    } catch (err) {
      enqList.innerHTML = `<div class="admin-empty" style="color:#DC2626;"><i class="fas fa-exclamation-triangle"></i>Error: ${err.message}</div>`;
    }
  }

  window.deleteEnquiry = async function (id) {
    if (!confirm("Delete this enquiry?")) return;
    await db.collection("enquiries").doc(id).delete();
    loadEnquiries();
  };

  auth.onAuthStateChanged((user) => {
    if (user) loadEnquiries();
  });
}

/* ============================================================
   10. MANAGE TESTIMONIALS PAGE
   ============================================================ */
if (document.getElementById("testiForm")) {
  const testiForm = document.getElementById("testiForm");
  const testiStatus = document.getElementById("statusMsg");
  const testiBtn = document.getElementById("submitBtn");
  const testiList = document.getElementById("testiList");
  const testiCount = document.getElementById("count");

  testiForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    testiBtn.disabled = true;
    testiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    try {
      const name = document.getElementById("name").value.trim();
      await db.collection("testimonials").add({
        name: name,
        role: document.getElementById("role").value.trim(),
        text: document.getElementById("text").value.trim(),
        avatar: name.charAt(0).toUpperCase(),
        createdAt: new Date().toISOString()
      });

      testiStatus.style.color = "#16A34A";
      testiStatus.textContent = "✅ Testimonial added!";
      testiForm.reset();
      loadTestimonials();
    } catch (err) {
      testiStatus.style.color = "#DC2626";
      testiStatus.textContent = "❌ " + err.message;
    } finally {
      testiBtn.disabled = false;
      testiBtn.innerHTML = '<i class="fas fa-plus"></i> Add Testimonial';
    }
  });

  async function loadTestimonials() {
    if (!testiList) return;
    const snap = await db.collection("testimonials").orderBy("createdAt", "desc").get();
    if (testiCount) testiCount.textContent = snap.size;

    if (snap.empty) {
      testiList.innerHTML = `<div class="admin-empty" style="grid-column:1/-1;"><i class="fas fa-inbox"></i>No testimonials yet</div>`;
      return;
    }

    testiList.innerHTML = "";
    snap.forEach((doc) => {
      const d = doc.data();
      testiList.innerHTML += `
        <div class="admin-testi-card">
          <i class="fas fa-quote-right" style="font-size:22px;color:#0EA5E9;margin-bottom:14px;opacity:0.4;"></i>
          <p style="font-size:14px;color:#0B0F14;line-height:1.7;margin-bottom:18px;font-style:italic;">"${d.text}"</p>
          <div style="display:flex;align-items:center;gap:12px;padding-top:16px;border-top:1px solid #E7EBEF;">
            <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(160deg,#0369A1,#0EA5E9);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${d.avatar || d.name.charAt(0)}</div>
            <div>
              <h4 style="font-size:14.5px;color:#0B0F14;margin-bottom:2px;">${d.name}</h4>
              <span style="font-size:12.5px;color:#5B6472;">${d.role}</span>
            </div>
          </div>
          <button class="admin-btn-icon delete" onclick="deleteTestimonial('${doc.id}')" style="margin-top:14px;width:100%;height:auto;padding:9px;">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>`;
    });
  }

  window.deleteTestimonial = async function (id) {
    if (!confirm("Delete this testimonial?")) return;
    await db.collection("testimonials").doc(id).delete();
    loadTestimonials();
  };

  auth.onAuthStateChanged((user) => {
    if (user) loadTestimonials();
  });
}

console.log("✅ Munees Travels Admin JS loaded");