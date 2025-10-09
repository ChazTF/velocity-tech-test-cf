// assets/main.js
(function () {

  // Get the store root URL, used so that it can handle locales (en, es etc...)
  const root = (window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/');

  // set the quantity for a variant via AJAX cart
  async function setVariantQty(variantId, qty) {
    const formData = new FormData();
    formData.append(`updates[${variantId}]`, String(qty));

    const res = await fetch(`${root}cart/update.js`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin',
      body: formData
    });

    if (!res.ok) {
      let msg = 'Could not update cart.';
      try {
        const err = await res.json();
        if (err && (err.message || err.description)) msg = err.message || err.description;
      } catch (_) {}
      throw new Error(msg);
    }

    const cart = await res.json();
    const countElement = document.querySelector('.site-header__cart-count');
    if (countElement) countElement.textContent = cart.item_count;
    applyCartToUI(cart); 
    return cart;
  }

  // show quantity x item added to cart when quantity field is updated.
  function showQtyMessage(wrap, qty) {
    const msgElement = wrap.querySelector('.product-card_qty__msg');
    if (!msgElement) return;

    if (Number(qty) === 0) {
      msgElement.textContent = 'Item removed ';
    } else if (Number(qty) === 1){ 
      msgElement.textContent = `${qty} × Item added `;
    } else {
      msgElement.textContent = `${qty} × Items added `;
    }

    const viewCartLink = document.createElement('a');     // or document.createElement('button')
    viewCartLink.href = `${root}cart`;
    viewCartLink.className = 'view-cart-btn btn btn--primary js-open-cart';
    viewCartLink.textContent = 'View Cart';

    msgElement.append(viewCartLink)

    msgElement.classList.add('is-visible');
    clearTimeout(msgElement._t);
    msgElement._t = setTimeout(() => msgElement.classList.remove('is-visible'), 1800);
  }

  // Reset and hide quantity message when products are removed from the cart.

  function resetQtyMessagesForZero(byVariant) {
    document.querySelectorAll('.product-card_qty').forEach(wrap => {
      const vid = wrap.getAttribute('data-variant-id');
      const msg = wrap.querySelector('.product-card_qty__msg');
      if (!vid || !msg) return;

      const qty = byVariant.get(vid) ?? 0;
      if (qty === 0) {
        msg.textContent = '';
        msg.classList.remove('is-visible');
      }
    });
  }

  // Get full cart JSON
  async function fetchCart() {
    const res = await fetch(`${root}cart.js`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error('Failed to fetch cart');
    return res.json();
  }

  // On load, hydrate EVERYTHING (header count, product cards, and drawer)
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      applyCartToUI(await fetchCart());
    } catch (_) {}
  });

// Plus / minus — works for product cards (.product-card_qty__button) AND minicart (.qty__btn)
document.addEventListener('click', async function (e) {
  const btn = e.target.closest('.product-card_qty__button, .qty__btn');
  if (!btn) return;

  // Wrapper can be either product-card or minicart
  const wrap  = btn.closest('.product-card_qty, .card-qty');
  const input = wrap && wrap.querySelector('.product-card_qty__input, .qty__input');
  const vid   = wrap && wrap.getAttribute('data-variant-id');
  if (!wrap || !input || !vid) return;

  const step = Number(btn.dataset.step || 1);
  const min  = Number(input.min || 0);
  const prev = Number(input.value || 0);
  const next = Math.max(min, prev + step);
  if (next === prev) return;

  input.value = next;
  // Add both loading classes; only one will apply
  wrap.classList.add('product-card_qty--loading', 'card-qty--loading');
  try {
    await setVariantQty(vid, next); // should call applyCartToUI(cart) internally
    // Only show the inline toast on product cards, not the minicart
    if (wrap.classList.contains('product-card_qty')) showQtyMessage(wrap, next);
    wrap.classList.add('product-card_qty--ok', 'card-qty--ok');
    setTimeout(() => wrap.classList.remove('product-card_qty--ok', 'card-qty--ok'), 600);
  } catch (err) {
    alert(err.message || 'Could not update cart.');
    input.value = prev; // revert
  } finally {
    wrap.classList.remove('product-card_qty--loading', 'card-qty--loading');
  }
});

// Typing in the number input — works for both (.product-card_qty__input and .qty__input)
const __qtyTimers = new WeakMap(); // per-wrapper debounce
document.addEventListener('input', function (e) {
  const input = e.target.closest('.product-card_qty__input, .qty__input');
  if (!input) return;

  const wrap = input.closest('.product-card_qty, .card-qty');
  const vid  = wrap && wrap.getAttribute('data-variant-id');
  if (!wrap || !vid) return;

  const min = Number(input.min || 0);
  const val = Math.max(min, Math.floor(Number(input.value || 0)));
  input.value = val;

  if (__qtyTimers.has(wrap)) clearTimeout(__qtyTimers.get(wrap));
  const t = setTimeout(async () => {
    wrap.classList.add('product-card_qty--loading', 'card-qty--loading');
    try {
      await setVariantQty(vid, val); // should call applyCartToUI(cart)
      if (wrap.classList.contains('product-card_qty')) showQtyMessage(wrap, val);
      wrap.classList.add('product-card_qty--ok', 'card-qty--ok');
      setTimeout(() => wrap.classList.remove('product-card_qty--ok', 'card-qty--ok'), 600);
    } catch (err) {
      alert(err.message || 'Could not update cart.');
    } finally {
      wrap.classList.remove('product-card_qty--loading', 'card-qty--loading');
    }
  }, 350);
  __qtyTimers.set(wrap, t);
});


  
  // was: const drawer = qs(null, '#minicart-drawer');
  const drawer = document.querySelector('#minicart-drawer');

  // was: const btns = qsa(drawer, '.qty__btn');
  const btns = drawer ? Array.from(drawer.querySelectorAll('.qty__btn')) : [];
  btns.forEach((btn) => { /* ... */ });

  function openCartDrawer() {
    const drawer = document.querySelector('#minicart-drawer');
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    const panel = drawer.querySelector('.minicart-drawer__wrapper');
    if (panel) panel.focus();
  }

  function closeCartDrawer() {
    const drawer = document.querySelector('#minicart-drawer');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  function money(cents) {
    const value = Number(cents || 0) / 100;
    try {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
    } catch {
      return '£' + value.toFixed(2);
    }
  }

  function applyCartToUI(cart) {
    const headerCount = document.querySelector('.site-header__cart-count');

    if (headerCount) headerCount.textContent = cart.item_count;

    // drawer counters
    const drawer = document.querySelector('#minicart-drawer');
    if (drawer) {
      const countEl = drawer.querySelector('.js-cart-count');
      const totalEl = drawer.querySelector('.js-cart-total');
      if (countEl) countEl.textContent = cart.item_count;
      if (totalEl) totalEl.textContent = money(cart.total_price);
      renderMiniCart(cart); // see below
    }

    // update product-card qty inputs across the page
    const byVariant = new Map(cart.items.map(i => [String(i.variant_id), i.quantity]));
    Array.from(document.querySelectorAll('.card-qty, .product-card_qty')).forEach((wrap) => {
      const vid = wrap.getAttribute('data-variant-id');
      const input = wrap.querySelector('.qty__input, .product-card_qty__input');
      if (!vid || !input) return;
      input.value = byVariant.get(vid) ?? 0;
    });

    resetQtyMessagesForZero(byVariant);
  }

  function renderMiniCart(cart) {
    const drawer = document.querySelector('#minicart-drawer');
    if (!drawer) return;
    const itemsWrap = drawer.querySelector('.js-cart-items');
    if (!itemsWrap) return;

    if (!cart.items.length) {
      itemsWrap.innerHTML = '<p style="padding:16px;">Your basket is empty.</p>';
      return;
    }

    const html = cart.items.map((item) => {
      const img = item.image ? `<img src="${item.image}" alt="${item.product_title.replace(/"/g,'&quot;')}">` : '';
      return `
        <div class="minicart-line" data-variant-id="${item.variant_id}">
          <div class="minicart-line__media">${img}</div>
          <div class="minicart-item_title__wrapper">
            <p class="minicart-line__title"><a href="${item.url}">${item.product_title}</a></p>
          </div>
          <div class="minicart-line__actions">
            <button class="minicart-line__remove" type="button" aria-label="Remove" data-remove-variant="${item.variant_id}">
            <svg class="icon icon--trash" width="20" height="20" aria-hidden="true" focusable="false">
              <use href="#icon-trash"></use>
            </svg>
          </button>
          </div>
          <div class="minicart-line__info">
            <div class="minicart-line__price">${money(item.final_line_price)}</div>
            <div class="minicart-line__qty card-qty" data-variant-id="${item.variant_id}" data-product-title="${item.product_title.replace(/"/g,'&quot;')}">
              <button type="button" class="qty__btn" data-step="-1" aria-label="Decrease quantity">−</button>
              <input class="qty__input" type="number" min="0" value="${item.quantity}" inputmode="numeric" pattern="[0-9]*" aria-label="Quantity for ${item.product_title}">
              <button type="button" class="qty__btn" data-step="1" aria-label="Increase quantity">+</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    itemsWrap.innerHTML = html;
  }

  document.addEventListener('click', async (e) => {
    const openBtn = e.target.closest('.js-open-cart');
    if (openBtn) {
      e.preventDefault();
      try { applyCartToUI(await fetchCart()); } catch {}
      openCartDrawer();
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-close]')) {
      e.preventDefault();
      closeCartDrawer();
    }
  });

  /* Clear all link and remove product icon functionality */

  // Clear all
  async function clearCart() {
    const res = await fetch(`${root}cart/clear.js`, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error('Could not clear cart');
    const cart = await res.json();
    applyCartToUI(cart);
    return cart;
  }

  document.addEventListener('click', async (e) => {
    if (!e.target.closest('.js-cart-clear')) return;
    e.preventDefault();
    try { await clearCart(); } catch (err) { alert(err.message || 'Could not clear cart.'); }
  });

  // Trash icon: set that variant to 0
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-remove-variant]');
    if (!btn) return;
    const vid = btn.getAttribute('data-remove-variant');
    btn.disabled = true;
    try { await setVariantQty(vid, 0); } catch (err) { alert(err.message || 'Could not remove item.'); }
    btn.disabled = false;
  });



})();
