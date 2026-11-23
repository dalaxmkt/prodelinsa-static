(() => {
  "use strict";

  const CART_KEY = "prodelinsa_wholesale_cart_v1";
  const CUSTOMER_KEY = "prodelinsa_customer_data";
  const WHATSAPP_NUMBER = "50373195993";

  const PRODUCTS = [
    {
      id: "chilao-botellas-salsas",
      name: "Chilao Salsa Picante & Chamoy Líquido",
      brand: "De Picao / Chilao",
      category: "Salsas y Chamoy",
      presentation: "Presentación en botella dosificadora (Salsa Chilao & Salsa Chamoy)",
      description: "Línea de salsas líquidas botaneras para acompañar frutas, snacks y preparaciones comerciales. Envase ergonómico con tapa dosificadora, ideal para mostrador o venta directa.",
      image: "./Productos/1794425048648.jpg",
      unitLabel: "Botella / Pack",
      highlight: "Línea Líquida Botanera",
      confirmedDetails: [
        "Envases con tapa dosificadora (verde para chile sauce y amarilla para chamoy)",
        "Etiquetado comercial frontal visible con tabla nutrimental",
        "Producto para frutas, botanas y snacks"
      ]
    },
    {
      id: "chilao-exhibidor-sal-limon",
      name: "Chilao Polvo de Sal y Limón — Exhibidor",
      brand: "De Picao / Chilao",
      category: "Exhibidores en Sobres",
      presentation: "Tira exhibidora vertical con 80 sobres (Cont. Net. 160g)",
      description: "Exhibidor colgante con 80 sobres individuales de polvo de sal y limón. Diseñado para colocación rápida en puntos de venta de tiendas, abarroterías y súper mercados.",
      image: "./Productos/1794425087373.jpg",
      unitLabel: "Tira (80 piezas)",
      highlight: "80 Piezas por Tira",
      confirmedDetails: [
        "Exhibidor listo para colgar con ranura superior",
        "80 sobres individuales de polvo sabor sal y limón",
        "Contenido neto total marcado en exhibidor: 160g"
      ]
    },
    {
      id: "chilao-exhibidor-sal-limon-chile",
      name: "Chilao Polvo de Sal, Limón y Chile — Exhibidor",
      brand: "De Picao / Chilao",
      category: "Exhibidores en Sobres",
      presentation: "Tira exhibidora vertical con 80 sobres (Cont. Net. 150g)",
      description: "Exhibidor colgante con 80 sobres individuales de polvo de sal, limón y chile. Formato práctico de alta rotación para comercios mayoristas y minoristas en todo el país.",
      image: "./Productos/1794425103534.jpg",
      unitLabel: "Tira (80 piezas)",
      highlight: "80 Piezas por Tira",
      confirmedDetails: [
        "Exhibidor colgante en tono amarillo de alta visibilidad",
        "80 sobres individuales con sabor chile, limón y sal",
        "Contenido neto total marcado en exhibidor: 150g"
      ]
    },
    {
      id: "chilao-bolsa-chile-limon-500g",
      name: "Chilao Chile & Limón Natural — Bolsa 500g",
      brand: "De Picao / Chilao",
      category: "Bolsas y Granel",
      presentation: "Bolsa sellada de 500g (Cont. Net. 500g)",
      description: "Bolsa sellada de medio kilo de chilito en polvo chile y limón natural. Formato pensado para preparación en negocios de alimentos, puestos de fruta, snacks y reventa comercial.",
      image: "./Productos/1794425072490.jpg",
      unitLabel: "Bolsa (500g)",
      highlight: "Cont. Net. 500g",
      confirmedDetails: [
        "Bolsa sellada hermética con ventana en forma de chile",
        "Contenido neto: 500g",
        "Fórmula con chile y limón natural para frutas y botanas"
      ]
    }
  ];

  const DEPARTMENTS = [
    "San Salvador", "La Libertad", "Santa Ana", "San Miguel", "Sonsonate",
    "Usulután", "Ahuachapán", "La Paz", "Cuscatlán", "Chalatenango",
    "Morazán", "San Vicente", "Cabañas", "La Unión"
  ];

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const productGrid = $("#product-grid");
  const cartShell = $("#cart-shell");
  const productModal = $("#product-modal");

  let selectedCategory = "Todos";
  let searchQuery = "";
  let modalProduct = null;
  let modalQuantity = 1;
  let toastTimer = 0;
  let cartItems = loadCart();
  let customerData = loadCustomerData();
  const cardQuantities = Object.create(null);

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function loadCart() {
    const saved = readStorage(CART_KEY, []);
    if (!Array.isArray(saved)) return [];
    return saved.reduce((items, row) => {
      const productId = row && row.product && row.product.id;
      const product = PRODUCTS.find((entry) => entry.id === productId);
      const quantity = Math.floor(Number(row && row.quantity));
      if (product && Number.isFinite(quantity) && quantity > 0) {
        items.push({ product: product, quantity: quantity });
      }
      return items;
    }, []);
  }

  function loadCustomerData() {
    const stored = readStorage(CUSTOMER_KEY, {});
    const saved = stored && typeof stored === "object" ? stored : {};
    return {
      customerName: typeof saved.customerName === "string" ? saved.customerName : "",
      businessName: typeof saved.businessName === "string" ? saved.businessName : "",
      department: DEPARTMENTS.includes(saved.department) ? saved.department : "San Salvador",
      municipality: typeof saved.municipality === "string" ? saved.municipality : "",
      notes: typeof saved.notes === "string" ? saved.notes : ""
    };
  }

  function persistCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    } catch (_error) {
      showToast("No se pudo guardar el pedido en este dispositivo.");
    }
  }

  function persistCustomerData() {
    try {
      localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customerData));
    } catch (_error) {
      // El formulario sigue funcionando aunque el navegador bloquee el almacenamiento local.
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function normalizeText(value) {
    return String(value).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function renderProductCard(product) {
    const id = escapeHTML(product.id);
    const image = escapeHTML(product.image);
    const name = escapeHTML(product.name);
    const quantity = cardQuantities[product.id] || 1;
    return '<article class="group bg-white rounded-xl border border-blue-100/90 hover:border-blue-300/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden">' +
      '<button type="button" data-open-product="' + id + '" class="relative aspect-square w-full bg-gradient-to-b from-blue-50/50 via-sky-50/30 to-white p-2.5 sm:p-4 flex items-center justify-center cursor-pointer overflow-hidden border-b border-blue-100/70" aria-label="Ver detalles de ' + name + '">' +
        '<img src="' + image + '" alt="' + name + '" class="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" loading="lazy" />' +
        '<span class="absolute inset-0 bg-blue-950/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/95 text-[11px] sm:text-xs font-bold text-blue-950 shadow-sm border border-blue-200/80"><span aria-hidden="true">⌕</span><span class="hidden xs:inline">Ver detalles</span></span></span>' +
        (product.highlight ? '<span class="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/95 border border-blue-200/80 text-blue-950 text-[9px] sm:text-[11px] font-bold px-1.5 py-0.5 sm:px-2 rounded shadow-2xs">' + escapeHTML(product.highlight) + '</span>' : "") +
      '</button>' +
      '<div class="p-2.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4"><div>' +
        '<div class="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1"><span class="font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 truncate max-w-[110px] sm:max-w-none">' + escapeHTML(product.category) + '</span><span class="font-medium text-slate-500 hidden sm:inline">' + escapeHTML(product.brand) + '</span></div>' +
        '<button type="button" data-open-product="' + id + '" class="block text-left text-xs sm:text-base font-bold text-slate-900 hover:text-blue-900 line-clamp-2 transition-colors leading-snug">' + name + '</button>' +
        '<p class="mt-1 text-[10px] sm:text-xs text-slate-600 line-clamp-2 leading-relaxed"><span class="font-bold text-slate-700">Presentación: </span>' + escapeHTML(product.presentation) + '</p>' +
      '</div><div class="pt-2 border-t border-slate-100"><div class="flex items-center justify-between mb-2 sm:mb-3"><span class="text-[10px] sm:text-xs text-slate-500">Precio:</span><span class="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 sm:px-2 rounded border border-emerald-200/60"><span class="text-emerald-600">◉</span><span class="hidden xs:inline">Cotizar por WhatsApp</span><span class="xs:hidden">Cotizar</span></span></div>' +
        '<div class="flex flex-col xs:flex-row items-stretch xs:items-center gap-1.5 sm:gap-2"><div class="quantity-selector flex items-center justify-between xs:justify-start border border-slate-200 rounded-lg bg-slate-50 p-0.5 shrink-0">' +
          '<button type="button" data-card-action="decrease" data-product-id="' + id + '" class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors disabled:opacity-40" aria-label="Disminuir cantidad de ' + name + '" ' + (quantity <= 1 ? "disabled" : "") + '>−</button>' +
          '<span data-card-quantity class="w-6 sm:w-8 text-center text-xs font-bold text-slate-800 tabular-nums">' + quantity + '</span>' +
          '<button type="button" data-card-action="increase" data-product-id="' + id + '" class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors" aria-label="Aumentar cantidad de ' + name + '">+</button>' +
        '</div><button type="button" data-card-action="add" data-product-id="' + id + '" class="flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-bold rounded-lg transition-all duration-150 active:scale-[0.98] bg-blue-950 text-white hover:bg-blue-900" aria-label="Agregar ' + name + ' al pedido"><span class="text-lime-400">▣</span><span class="truncate">Agregar</span></button></div>' +
      '</div></div></article>';
  }

  function updateCategoryButtons() {
    $$(".category-filter").forEach((button) => {
      const active = button.dataset.category === selectedCategory;
      button.className = "category-filter px-3.5 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all " +
        (active
          ? "bg-blue-950 text-white shadow-xs border border-blue-900"
          : "bg-white/90 text-blue-950 hover:bg-blue-50/90 border border-blue-200/80 shadow-2xs");
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function syncSearchFields() {
    ["#desktop-search", "#catalog-search", "#mobile-search"].forEach((selector) => {
      const input = $(selector);
      if (input && input.value !== searchQuery) input.value = searchQuery;
    });
    $$("[data-clear-search]").forEach((button) => button.classList.toggle("is-hidden", !searchQuery));
  }

  function renderProducts() {
    const query = normalizeText(searchQuery);
    const filtered = PRODUCTS.filter((product) => {
      const categoryMatches = selectedCategory === "Todos" || product.category === selectedCategory;
      const searchable = normalizeText([
        product.name, product.brand, product.presentation, product.category, product.description
      ].join(" "));
      return categoryMatches && (!query || searchable.includes(query));
    });
    productGrid.innerHTML = filtered.map(renderProductCard).join("");
    $("#product-counter").innerHTML = "Mostrando <strong class=\"font-extrabold text-blue-900 tabular-nums\">" +
      filtered.length + "</strong> de <strong class=\"font-extrabold text-blue-900 tabular-nums\">" +
      PRODUCTS.length + "</strong> productos activos";
    $("#empty-results").classList.toggle("is-hidden", filtered.length > 0);
    productGrid.classList.toggle("is-hidden", filtered.length === 0);
    syncSearchFields();
    updateCategoryButtons();
  }

  function cartTotals() {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  function renderCartItems() {
    const container = $("#cart-items");
    container.innerHTML = cartItems.map((item) => {
      const product = item.product;
      const id = escapeHTML(product.id);
      const name = escapeHTML(product.name);
      return '<article class="flex gap-2.5 sm:gap-3 p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 items-start mr-0.5 sm:mr-0">' +
        '<div class="w-16 h-16 bg-white rounded-lg p-1.5 border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden"><img src="' + escapeHTML(product.image) + '" alt="' + name + '" class="w-full h-full object-contain" loading="lazy" /></div>' +
        '<div class="flex-1 min-w-0"><h4 class="text-xs sm:text-sm font-bold text-slate-900 truncate">' + name + '</h4><p class="text-[11px] text-slate-500 truncate mt-0.5">' + escapeHTML(product.presentation) + '</p><div class="mt-1 text-[11px] font-semibold text-emerald-800">Cotización mayorista</div>' +
        '<div class="mt-2.5 flex items-center justify-between"><div class="flex items-center border border-slate-200 rounded-md bg-white p-0.5"><button type="button" data-cart-action="decrease" data-product-id="' + id + '" class="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900" aria-label="Disminuir cantidad de ' + name + '">−</button><span class="w-7 text-center text-xs font-bold text-slate-800 tabular-nums">' + item.quantity + '</span><button type="button" data-cart-action="increase" data-product-id="' + id + '" class="w-6 h-6 flex items-center justify-center text-slate-600 hover:text-slate-900" aria-label="Aumentar cantidad de ' + name + '">+</button></div><button type="button" data-cart-action="remove" data-product-id="' + id + '" class="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Eliminar artículo" aria-label="Eliminar ' + name + '">×</button></div></div></article>';
    }).join("");
  }

  function renderCart() {
    const total = cartTotals();
    const distinct = cartItems.length;
    const badge = $("#cart-badge");
    badge.textContent = String(total);
    badge.classList.toggle("is-hidden", total === 0);
    $$("[data-open-cart]").forEach((button) => {
      button.setAttribute("aria-label", "Ver pedido (" + total + " artículos)");
    });
    $("#mobile-cart-count").textContent = total + " unid.";
    $("#mobile-cart-bar").classList.toggle("is-hidden", total === 0);
    $("#cart-total-badge").textContent = total + " unid.";
    $("#cart-total-badge").classList.toggle("is-hidden", total === 0);
    $("#cart-product-count").textContent = String(distinct);
    $("#cart-empty").classList.toggle("is-hidden", distinct > 0);
    $("#cart-content").classList.toggle("is-hidden", distinct === 0);
    $("#cart-footer").classList.toggle("is-hidden", distinct === 0);
    renderCartItems();
  }

  function addToCart(product, quantity) {
    if (!product || quantity < 1) return;
    const existing = cartItems.find((item) => item.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cartItems.push({ product: product, quantity: quantity });
    }
    persistCart();
    renderCart();
    showToast("Se agregaron " + quantity + " unid. de " + product.name + " al pedido");
  }

  function showToast(message) {
    const toast = $("#toast");
    $("#toast-message").textContent = message;
    toast.classList.remove("is-hidden");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.add("is-hidden"), 2800);
  }

  function setBodyLock() {
    document.body.style.overflow =
      (!cartShell.classList.contains("is-hidden") || !productModal.classList.contains("is-hidden"))
        ? "hidden"
        : "";
  }

  function openCart() {
    renderCart();
    cartShell.classList.remove("is-hidden");
    cartShell.setAttribute("aria-hidden", "false");
    setBodyLock();
    $("#close-cart").focus();
  }

  function closeCart() {
    cartShell.classList.add("is-hidden");
    cartShell.setAttribute("aria-hidden", "true");
    setBodyLock();
  }

  function openProductModal(productId) {
    modalProduct = PRODUCTS.find((product) => product.id === productId);
    if (!modalProduct) return;
    modalQuantity = 1;
    $("#modal-category").textContent = modalProduct.category;
    $("#modal-brand").textContent = modalProduct.brand;
    $("#modal-product-title").textContent = modalProduct.name;
    $("#modal-presentation").textContent = modalProduct.presentation;
    $("#modal-description").textContent = modalProduct.description;
    $("#modal-image").src = modalProduct.image;
    $("#modal-image").alt = modalProduct.name;
    $("#modal-unit").textContent = modalProduct.unitLabel;
    $("#modal-quantity").textContent = "1";
    $("#modal-quantity-down").disabled = true;
    $("#modal-add").innerHTML = '<span class="text-lime-400">▣</span><span>Agregar al pedido</span>';
    const highlight = $("#modal-highlight");
    highlight.textContent = modalProduct.highlight || "";
    highlight.classList.toggle("is-hidden", !modalProduct.highlight);
    $("#modal-details").innerHTML = modalProduct.confirmedDetails.map((detail) =>
      '<li class="flex items-start gap-2"><span class="text-lime-600 font-bold">✓</span><span>' + escapeHTML(detail) + '</span></li>'
    ).join("");
    productModal.classList.remove("is-hidden");
    productModal.setAttribute("aria-hidden", "false");
    setBodyLock();
    $("#close-product-modal").focus();
  }

  function closeProductModal() {
    productModal.classList.add("is-hidden");
    productModal.setAttribute("aria-hidden", "true");
    modalProduct = null;
    setBodyLock();
  }

  function openWhatsApp(message) {
    const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function saveOrderField(event) {
    const input = event.target;
    if (!input.name || !Object.prototype.hasOwnProperty.call(customerData, input.name)) return;
    customerData[input.name] = input.value;
    persistCustomerData();
    $("#validation-error").classList.add("is-hidden");
  }

  function showValidationError(message) {
    const error = $("#validation-error");
    error.textContent = message;
    error.classList.remove("is-hidden");
  }

  function submitOrder(event) {
    event.preventDefault();
    if (cartItems.length === 0) {
      showValidationError("Tu carrito está vacío. Agrega productos antes de enviar.");
      return;
    }
    customerData.customerName = $("#customer-name").value.trim();
    customerData.businessName = $("#business-name").value.trim();
    customerData.department = $("#department").value;
    customerData.municipality = $("#municipality").value.trim();
    customerData.notes = $("#order-notes").value.trim();
    persistCustomerData();
    if (!customerData.customerName) {
      showValidationError("Por favor ingresa tu nombre de contacto.");
      $("#customer-name").focus();
      return;
    }
    if (!customerData.businessName) {
      showValidationError("Por favor ingresa el nombre de tu tienda o negocio.");
      $("#business-name").focus();
      return;
    }
    if (!customerData.municipality) {
      showValidationError("Por favor ingresa tu municipio o ciudad en El Salvador.");
      $("#municipality").focus();
      return;
    }

    const lines = cartItems.map((item, index) =>
      (index + 1) + ". *" + item.quantity + "x* " + item.product.name +
      String.fromCharCode(10) + "   └ " + item.product.presentation
    ).join(String.fromCharCode(10));
    const message = [
      "¡Hola equipo de *PRODELINSA*! 👋",
      "Deseo solicitar cotización y consultar existencias para el siguiente pedido mayorista:",
      "",
      "📋 *DATOS DEL COMERCIO:*",
      "• *Contacto:* " + customerData.customerName,
      "• *Negocio:* " + customerData.businessName,
      "• *Ubicación:* " + customerData.municipality + ", " + customerData.department + " (El Salvador)",
      "",
      "📦 *PRODUCTOS SOLICITADOS:*",
      lines,
      customerData.notes ? "" : null,
      customerData.notes ? "📝 *NOTA ADICIONAL:*" : null,
      customerData.notes || null,
      "",
      "ℹ️ *Nota:* Comprendo que precios por mayor, existencias y entrega quedan sujetos a confirmación con su asesor de ventas.",
      "Quedo a la espera de su respuesta. ¡Muchas gracias!"
    ].filter((line) => line !== null).join(String.fromCharCode(10));
    openWhatsApp(message);
  }

  function setSearch(value) {
    searchQuery = value;
    renderProducts();
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    $("#catalogo").scrollIntoView({ behavior: "smooth" });
    $("#mobile-search-row").classList.add("is-hidden");
    $("#mobile-search-toggle").setAttribute("aria-expanded", "false");
  }

  function setMobileMenu(isOpen) {
    $("#mobile-menu").classList.toggle("is-hidden", !isOpen);
    $("#mobile-menu-toggle").setAttribute("aria-expanded", isOpen ? "true" : "false");
    $("#mobile-menu-toggle").setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    $("#menu-icon").classList.toggle("is-hidden", isOpen);
    $("#close-menu-icon").classList.toggle("is-hidden", !isOpen);
  }

  function updateCardQuantity(button, direction) {
    const productId = button.dataset.productId;
    const card = button.closest("article");
    if (!productId || !card) return;
    const current = cardQuantities[productId] || 1;
    cardQuantities[productId] = direction === "increase" ? current + 1 : Math.max(1, current - 1);
    const value = $("[data-card-quantity]", card);
    const decrement = $('[data-card-action="decrease"]', card);
    value.textContent = String(cardQuantities[productId]);
    decrement.disabled = cardQuantities[productId] <= 1;
  }

  function updateCartQuantity(productId, amount) {
    const item = cartItems.find((entry) => entry.product.id === productId);
    if (!item) return;
    item.quantity += amount;
    if (item.quantity <= 0) cartItems = cartItems.filter((entry) => entry.product.id !== productId);
    persistCart();
    renderCart();
  }

  function handleDocumentClick(event) {
    const target = event.target;
    if (!target || typeof target.closest !== "function") return;

    const cardAction = target.closest("[data-card-action]");
    if (cardAction) {
      const product = PRODUCTS.find((entry) => entry.id === cardAction.dataset.productId);
      const action = cardAction.dataset.cardAction;
      if (action === "increase" || action === "decrease") updateCardQuantity(cardAction, action);
      if (action === "add" && product) {
        const quantity = cardQuantities[product.id] || 1;
        addToCart(product, quantity);
        cardAction.innerHTML = '<span class="text-lime-300">✓</span><span class="truncate">¡Listo!</span>';
        cardAction.classList.remove("bg-blue-950", "hover:bg-blue-900");
        cardAction.classList.add("bg-emerald-600");
        window.setTimeout(() => {
          if (!cardAction.isConnected) return;
          cardAction.innerHTML = '<span class="text-lime-400">▣</span><span class="truncate">Agregar</span>';
          cardAction.classList.remove("bg-emerald-600");
          cardAction.classList.add("bg-blue-950", "hover:bg-blue-900");
        }, 1600);
      }
      return;
    }

    const cartAction = target.closest("[data-cart-action]");
    if (cartAction) {
      const id = cartAction.dataset.productId;
      const action = cartAction.dataset.cartAction;
      if (action === "decrease") updateCartQuantity(id, -1);
      if (action === "increase") updateCartQuantity(id, 1);
      if (action === "remove") {
        cartItems = cartItems.filter((item) => item.product.id !== id);
        persistCart();
        renderCart();
      }
      return;
    }

    const productTrigger = target.closest("[data-open-product]");
    if (productTrigger) {
      openProductModal(productTrigger.dataset.openProduct);
      return;
    }
    if (target.closest("[data-open-cart]")) {
      openCart();
      return;
    }
    if (target.id === "cart-backdrop") closeCart();
    if (target.id === "close-cart") closeCart();
    if (target.id === "product-modal-backdrop" || target.id === "close-product-modal") closeProductModal();
    if (target.id === "explore-catalog") {
      closeCart();
      $("#catalogo").scrollIntoView({ behavior: "smooth" });
    }
    if (target.id === "clear-cart") {
      cartItems = [];
      persistCart();
      renderCart();
    }
    if (target.id === "reset-filters") {
      selectedCategory = "Todos";
      setSearch("");
    }
    if (target.id === "dismiss-whatsapp-tip") $("#whatsapp-tip").classList.add("is-hidden");
  }

  function init() {
    $("#current-year").textContent = String(new Date().getFullYear());
    $("#customer-name").value = customerData.customerName;
    $("#business-name").value = customerData.businessName;
    $("#department").value = customerData.department;
    $("#municipality").value = customerData.municipality;
    $("#order-notes").value = customerData.notes;
    renderProducts();
    renderCart();

    document.addEventListener("click", handleDocumentClick);
    $("#category-filters").addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      selectedCategory = button.dataset.category;
      renderProducts();
    });

    ["#desktop-search", "#catalog-search", "#mobile-search"].forEach((selector) => {
      $(selector).addEventListener("input", (event) => setSearch(event.target.value));
    });
    $$("[data-clear-search]").forEach((button) => button.addEventListener("click", () => setSearch("")));
    ["#desktop-search-form", "#mobile-search-form"].forEach((selector) => $(selector).addEventListener("submit", handleSearchSubmit));

    $("#mobile-search-toggle").addEventListener("click", () => {
      const row = $("#mobile-search-row");
      const opening = row.classList.contains("is-hidden");
      row.classList.toggle("is-hidden", !opening);
      $("#mobile-search-toggle").setAttribute("aria-expanded", opening ? "true" : "false");
      if (opening) $("#mobile-search").focus();
    });
    $("#mobile-menu-toggle").addEventListener("click", () => {
      setMobileMenu($("#mobile-menu").classList.contains("is-hidden"));
    });
    $$("#mobile-menu a").forEach((link) => link.addEventListener("click", () => setMobileMenu(false)));

    $("#wholesale-order-form").addEventListener("input", saveOrderField);
    $("#wholesale-order-form").addEventListener("change", saveOrderField);
    $("#wholesale-order-form").addEventListener("submit", submitOrder);
    $("#modal-quantity-down").addEventListener("click", () => {
      modalQuantity = Math.max(1, modalQuantity - 1);
      $("#modal-quantity").textContent = String(modalQuantity);
      $("#modal-quantity-down").disabled = modalQuantity <= 1;
    });
    $("#modal-quantity-up").addEventListener("click", () => {
      modalQuantity += 1;
      $("#modal-quantity").textContent = String(modalQuantity);
      $("#modal-quantity-down").disabled = false;
    });
    $("#modal-add").addEventListener("click", () => {
      if (!modalProduct) return;
      addToCart(modalProduct, modalQuantity);
      $("#modal-add").innerHTML = '<span class="text-lime-300">✓</span><span>¡Agregado al pedido!</span>';
      window.setTimeout(closeProductModal, 1200);
    });
    $("#modal-whatsapp").addEventListener("click", () => {
      if (!modalProduct) return;
      openWhatsApp(
        "¡Hola PRODELINSA! Me interesa cotizar al por mayor el producto:" +
        String.fromCharCode(10) + "- *" + modalProduct.name + "*" +
        String.fromCharCode(10) + "- Presentación: " + modalProduct.presentation +
        String.fromCharCode(10) + "- Cantidad sugerida: " + modalQuantity + " " + modalProduct.unitLabel +
        String.fromCharCode(10) + "¿Tienen disponibilidad y cuál es su precio por mayor?"
      );
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCart();
        closeProductModal();
        setMobileMenu(false);
      }
    });
    window.addEventListener("scroll", () => {
      const header = $("#site-header");
      if (window.scrollY > 20) {
        header.classList.add("bg-white/95", "shadow-sm", "border-blue-100/90", "py-2.5");
        header.classList.remove("bg-white/90", "py-3.5");
      } else {
        header.classList.remove("bg-white/95", "shadow-sm", "py-2.5");
        header.classList.add("bg-white/90", "py-3.5");
      }
    }, { passive: true });
  }

  init();
})();
