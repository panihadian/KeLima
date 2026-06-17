/* =========================================================
   LaundryKu — vanilla JS
   ========================================================= */
(function () {
  "use strict";

  // ---------- CONFIG ----------
  const WA_NUMBER = "6289604665197"; // +62 896-0466-5197

  const SERVICES = [
    { id: "kering",   name: "Cuci Kering",     price: 5000 },
    { id: "setrika",  name: "Cuci + Setrika",  price: 7000 },
    { id: "iron",     name: "Setrika Saja",    price: 4000 },
    { id: "express",  name: "Express 6 Jam",   price: 12000 },
    { id: "dryclean", name: "Dry Clean",       price: 15000 },
  ];

  const ITEM_TYPES = [
    "Baju", "Celana", "Sprei", "Selimut", "Handuk", "Jaket", "Gaun", "Sepatu",
  ];

  const DISCOUNT_TIERS = [
    { min: 10, percent: 15, label: "Diskon 15% (≥ 10 kg)" },
    { min: 5,  percent: 10, label: "Diskon 10% (≥ 5 kg)" },
  ];

  const DEFAULT_TESTIS = [
    { name: "Rara", city: "Jakarta", stars: 5, text: "Wangiii bangettt, dijemput jam 9 sore besoknya udah balik rapi. Auto langganan!", builtIn: true },
    { name: "Dimas", city: "Bandung", stars: 5, text: "Express 6 jam beneran kelar tepat waktu pas mau ke acara. Saved my day fr.", builtIn: true },
    { name: "Nadia", city: "Surabaya", stars: 4, text: "Harganya transparan, kalkulatornya enak banget dipake. Sat-set sat-set.", builtIn: true },
    { name: "Bagas", city: "Depok", stars: 5, text: "Mas kurirnya ramah, cucian gak ada yg ketuker. Diskon di atas 5 kg lumayan banget.", builtIn: true },
  ];

  // ---------- STATE ----------
  let items = []; // {id, itemType, serviceId, weight}

  // ---------- UTILS ----------
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));
  const formatRp = (n) =>
    "Rp " + Math.round(n).toLocaleString("id-ID");
  const uid = () => Math.random().toString(36).slice(2, 9);

  function showToast(msg, type = "") {
    const t = $("#toast");
    t.className = "toast show " + type;
    t.innerHTML = msg;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      t.className = "toast " + type;
    }, 2800);
  }

  // ---------- CALCULATOR ----------
  function addItem(prefill) {
    items.push({
      id: uid(),
      itemType: prefill?.itemType || ITEM_TYPES[0],
      serviceId: prefill?.serviceId || SERVICES[1].id,
      weight: prefill?.weight ?? 1,
    });
    renderItems();
    updateSummary();
  }

  function removeItem(id) {
    items = items.filter((it) => it.id !== id);
    renderItems();
    updateSummary();
  }

  function updateItem(id, key, value) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    if (key === "weight") {
      const n = parseFloat(value);
      it.weight = isNaN(n) || n < 0 ? 0 : n;
    } else {
      it[key] = value;
    }
    updateSummary();
    // update item subtotal text only
    const subEl = $(`#sub-${id}`);
    if (subEl) subEl.textContent = formatRp(itemSubtotal(it));
  }

  function itemSubtotal(it) {
    const svc = SERVICES.find((s) => s.id === it.serviceId);
    return (svc?.price || 0) * (parseFloat(it.weight) || 0);
  }

  function renderItems() {
    const wrap = $("#calcItems");
    if (items.length === 0) {
      wrap.innerHTML = `
        <div style="text-align:center; padding: 28px 14px; color: var(--muted); border:1.5px dashed var(--line); border-radius: 18px; background: var(--surface-2);">
          <i class="fa-solid fa-basket-shopping" style="font-size:28px; color: var(--blue-400); margin-bottom: 8px; display:block;"></i>
          Belum ada item. Klik <b>Tambah Item</b> untuk mulai menghitung.
        </div>`;
      return;
    }
    wrap.innerHTML = items.map((it) => `
      <div class="calc-item" data-id="${it.id}" data-testid="calc-item-${it.id}">
        <div>
          <label>Jenis Item</label>
          <select data-key="itemType" data-testid="select-item-${it.id}">
            ${ITEM_TYPES.map((t) => `<option value="${t}" ${t === it.itemType ? "selected" : ""}>${t}</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Layanan</label>
          <select data-key="serviceId" data-testid="select-service-${it.id}">
            ${SERVICES.map((s) => `<option value="${s.id}" ${s.id === it.serviceId ? "selected" : ""}>${s.name} — ${formatRp(s.price)}/kg</option>`).join("")}
          </select>
        </div>
        <div>
          <label>Berat (kg)</label>
          <input type="number" min="0" step="0.1" value="${it.weight}" data-key="weight" data-testid="input-weight-${it.id}" />
        </div>
        <button class="calc-item-remove" data-action="remove" data-testid="remove-item-${it.id}" aria-label="Hapus">
          <i class="fa-solid fa-trash"></i>
        </button>
        <div class="calc-item-subtotal">Subtotal item: <b id="sub-${it.id}">${formatRp(itemSubtotal(it))}</b></div>
      </div>
    `).join("");
  }

  function computeTotals() {
    const totalWeight = items.reduce((a, it) => a + (parseFloat(it.weight) || 0), 0);
    const subtotal = items.reduce((a, it) => a + itemSubtotal(it), 0);
    let discount = 0;
    let discountLabel = "";
    for (const tier of DISCOUNT_TIERS) {
      if (totalWeight >= tier.min) {
        discount = subtotal * (tier.percent / 100);
        discountLabel = tier.label;
        break;
      }
    }
    const total = Math.max(0, subtotal - discount);
    return { totalWeight, subtotal, discount, discountLabel, total };
  }

  function updateSummary() {
    const { totalWeight, subtotal, discount, discountLabel, total } = computeTotals();

    // list
    const listEl = $("#summaryList");
    listEl.innerHTML = items.map((it) => {
      const svc = SERVICES.find((s) => s.id === it.serviceId);
      return `
        <li class="summary-item">
          <div>
            ${it.itemType} · ${it.weight} kg
            <small>${svc?.name}</small>
          </div>
          <b>${formatRp(itemSubtotal(it))}</b>
        </li>`;
    }).join("");

    $("#sumWeight").textContent = totalWeight.toFixed(2).replace(/\.00$/, "") + " kg";
    $("#sumSubtotal").textContent = formatRp(subtotal);
    $("#sumDiscount").textContent = "- " + formatRp(discount);
    $("#discountLabel").textContent = discountLabel ? `(${discountLabel})` : "";
    $("#discountRow").style.display = discount > 0 ? "flex" : "none";
    $("#sumTotal").textContent = formatRp(total);

    // discount tier hint
    const tierEl = $("#discountTier");
    if (totalWeight === 0) {
      tierEl.className = "discount-tier";
      tierEl.innerHTML = "";
    } else if (totalWeight < 5) {
      tierEl.className = "discount-tier show";
      tierEl.innerHTML = `<i class="fa-solid fa-piggy-bank"></i> Tinggal <b>${(5 - totalWeight).toFixed(2).replace(/\.00$/,"")} kg lagi</b> untuk dapat diskon 10%!`;
    } else if (totalWeight < 10) {
      tierEl.className = "discount-tier show";
      tierEl.innerHTML = `<i class="fa-solid fa-fire"></i> Tambah <b>${(10 - totalWeight).toFixed(2).replace(/\.00$/,"")} kg lagi</b> untuk naik ke diskon 15%!`;
    } else {
      tierEl.className = "discount-tier show";
      tierEl.innerHTML = `<i class="fa-solid fa-crown"></i> Mantap! Kamu dapat <b>diskon maksimal 15%</b>. 🎉`;
    }
  }

  // ---------- WHATSAPP ----------
  function buildWaMessage() {
    const name = $("#custName").value.trim();
    const phone = $("#custPhone").value.trim();
    const delivery = $("#deliveryMethod").value;
    const address = $("#custAddress").value.trim();
    const note = $("#custNote").value.trim();
    const { totalWeight, subtotal, discount, discountLabel, total } = computeTotals();

    let lines = [];
    lines.push("*🧺 ORDER LAUNDRYKU*");
    lines.push("———————————————");
    lines.push(`*Nama:* ${name || "-"}`);
    lines.push(`*No. WhatsApp:* ${phone || "-"}`);
    lines.push(`*Metode Layanan:* ${delivery}`);
    
    // Hanya masukkan alamat jika pengguna memilih Jemput & Antar
    if (!delivery.includes("Sendiri")) {
      lines.push(`*Alamat:* ${address || "-"}`);
    }
    
    if (note) lines.push(`*Catatan:* ${note}`);
    lines.push("");
    lines.push("*Rincian Pesanan:*");
    items.forEach((it, idx) => {
      const svc = SERVICES.find((s) => s.id === it.serviceId);
      lines.push(`${idx + 1}. ${it.itemType} — ${it.weight} kg`);
      lines.push(`   • Layanan: ${svc?.name} (${formatRp(svc?.price || 0)}/kg)`);
      lines.push(`   • Subtotal: ${formatRp(itemSubtotal(it))}`);
    });
    lines.push("");
    lines.push(`*Total Berat:* ${totalWeight.toFixed(2).replace(/\.00$/,"")} kg`);
    lines.push(`*Subtotal:* ${formatRp(subtotal)}`);
    if (discount > 0) lines.push(`*${discountLabel}:* - ${formatRp(discount)}`);
    lines.push(`*TOTAL BAYAR:* ${formatRp(total)}`);
    lines.push("");
    
    if (delivery.includes("Sendiri")) {
      lines.push("Saya akan antar cucian ke outlet ya kak 🙏");
    } else {
      lines.push("Mohon dijemput ya kak 🙏 terima kasih LaundryKu!");
    }

    return lines.join("\n");
  }

  function validateOrder() {
    if (items.length === 0) { showToast("Tambahkan minimal 1 item dulu ya 🧺", "warn"); return false; }
    if (items.some((it) => !it.weight || it.weight <= 0)) { showToast("Berat setiap item harus lebih dari 0 kg.", "warn"); return false; }
    
    const name = $("#custName").value.trim();
    const phone = $("#custPhone").value.trim();
    const delivery = $("#deliveryMethod").value;
    const address = $("#custAddress").value.trim();
    
    if (!name) { showToast("Isi nama kamu dulu yaa.", "warn"); $("#custName").focus(); return false; }
    if (!phone) { showToast("Nomor WhatsApp wajib diisi.", "warn"); $("#custPhone").focus(); return false; }
    if (!/^[0-9+\s\-]{8,16}$/.test(phone)) { showToast("Format nomor WhatsApp kurang valid.", "warn"); $("#custPhone").focus(); return false; }
    
    // Validasi alamat hanya jika pengguna tidak memilih antar sendiri
    if (!delivery.includes("Sendiri") && !address) { 
      showToast("Alamat wajib diisi untuk layanan Jemput & Antar.", "warn"); 
      $("#custAddress").focus(); 
      return false; 
    }
    
    return true;
  }

  function openWhatsApp(e) {
    e.preventDefault();
    if (!validateOrder()) return;
    const msg = encodeURIComponent(buildWaMessage());
    const url = `https://wa.me/${WA_NUMBER}?text=${msg}`;
    window.open(url, "_blank", "noopener");
    showToast("Mengarahkan ke WhatsApp... 🚀", "success");
  }

  // ---------- TESTI / RATING ----------
  function loadReviews() {
    try {
      const raw = localStorage.getItem("laundryku_reviews");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }
  function saveReviews(arr) {
    localStorage.setItem("laundryku_reviews", JSON.stringify(arr));
  }
  function getAllTestis() {
    return [...loadReviews(), ...DEFAULT_TESTIS];
  }
  function starsToText(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
  }
  function initials(name) {
    return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  }
  function renderTestis() {
    const all = getAllTestis();
    const grid = $("#testiGrid");
    grid.innerHTML = all.map((t) => `
      <article class="testi">
        <div class="testi-stars">${starsToText(t.stars)}</div>
        <p class="testi-text">"${escapeHtml(t.text)}"</p>
        <div class="testi-user">
          <div class="testi-avatar">${initials(t.name)}</div>
          <div>
            <div class="testi-name">${escapeHtml(t.name)}</div>
            <div class="testi-city">${escapeHtml(t.city || "Pelanggan setia")}</div>
          </div>
        </div>
      </article>
    `).join("");

    const avgNum = all.length
      ? (all.reduce((a, t) => a + t.stars, 0) / all.length)
      : 5;
    $("#ratingAvgNum").textContent = avgNum.toFixed(1);
    $("#ratingAvgStars").textContent = starsToText(Math.round(avgNum));
    $("#ratingCount").textContent = all.length;
  }
  function escapeHtml(s = "") {
    return s.replace(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function setupRatingForm() {
    let selected = 0;
    const stars = $$("#ratingInput button");
    stars.forEach((btn) => {
      btn.addEventListener("click", () => {
        selected = parseInt(btn.dataset.star, 10);
        stars.forEach((b, idx) => {
          const filled = idx < selected;
          b.classList.toggle("active", filled);
          b.querySelector("i").className = filled ? "fa-solid fa-star" : "fa-regular fa-star";
        });
      });
    });
    $("#submitReview").addEventListener("click", () => {
      const name = $("#reviewerName").value.trim();
      const city = $("#reviewerCity").value.trim();
      const text = $("#reviewerText").value.trim();
      if (!selected) { showToast("Pilih dulu jumlah bintangnya ⭐", "warn"); return; }
      if (!name) { showToast("Nama kamu belum diisi.", "warn"); $("#reviewerName").focus(); return; }
      if (!text || text.length < 8) { showToast("Tulis ulasan minimal 8 karakter ya.", "warn"); $("#reviewerText").focus(); return; }

      const reviews = loadReviews();
      reviews.unshift({ name, city, stars: selected, text, ts: Date.now() });
      saveReviews(reviews);
      renderTestis();
      $("#reviewerName").value = "";
      $("#reviewerCity").value = "";
      $("#reviewerText").value = "";
      selected = 0;
      stars.forEach((b) => {
        b.classList.remove("active");
        b.querySelector("i").className = "fa-regular fa-star";
      });
      showToast("Makasih ulasannya! 🫶", "success");
    });
  }

  // ---------- NAV ----------
  function setupNav() {
    const burger = $("#navBurger");
    const nav = $(".nav");
    burger?.addEventListener("click", () => nav.classList.toggle("open"));
    $$(".nav-links a").forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("open"))
    );
  }

  // ---------- EVENT DELEGATION on calc items ----------
  function setupCalcDelegation() {
    const wrap = $("#calcItems");
    wrap.addEventListener("change", (e) => {
      const t = e.target;
      const itemEl = t.closest(".calc-item");
      if (!itemEl) return;
      const id = itemEl.dataset.id;
      const key = t.dataset.key;
      if (!key) return;
      updateItem(id, key, t.value);
    });
    wrap.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.key !== "weight") return;
      const itemEl = t.closest(".calc-item");
      if (!itemEl) return;
      updateItem(itemEl.dataset.id, "weight", t.value);
    });
    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-action="remove"]');
      if (!btn) return;
      const itemEl = btn.closest(".calc-item");
      if (itemEl) removeItem(itemEl.dataset.id);
    });
  }

  // ---------- BOOT ----------
  document.addEventListener("DOMContentLoaded", () => {
    // year
    $("#year").textContent = new Date().getFullYear();

    setupNav();
    setupCalcDelegation();
    setupRatingForm();
    renderTestis();

    // Toggle (sembunyikan) form alamat jika pengguna memilih Antar Sendiri
    const deliverySelect = $("#deliveryMethod");
    const addressRow = $("#addressRow");
    if (deliverySelect && addressRow) {
      deliverySelect.addEventListener("change", (e) => {
        if (e.target.value.includes("Sendiri")) {
          addressRow.style.display = "none";
        } else {
          addressRow.style.display = "block";
        }
      });
    }

    // seed first item
    addItem({ itemType: "Baju", serviceId: "setrika", weight: 3 });

    // buttons
    $("#addItemBtn").addEventListener("click", () => addItem());
    $("#orderBtn").addEventListener("click", openWhatsApp);

    // reveal animation
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.style.opacity = "1";
          en.target.style.transform = "translateY(0)";
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    $$(".svc-card, .step, .testi").forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity .6s ease, transform .6s ease";
      io.observe(el);
    });
  });
})();