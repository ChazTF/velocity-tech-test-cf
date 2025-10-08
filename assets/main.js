// assets/main.js
(function () {
  const root = (window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/');

  // set the quantity for a variant via AJAX cart
  async function setVariantQty(variantId, qty) {
    const formData = new FormData();
    formData.append(`updates[${variantId}]`, String(qty));

    const res = await fetch(`${root}cart/update.js`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
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
    return cart;
  }

  // show quantity x item added to cart when quantity field is updated.
  function showQtyMessage(wrap, qty) {
    const msgElement = wrap.querySelector('.product-card_qty__msg');
    if (!msgElement) return;

    if (Number(qty) === 0) {
      msgElement.textContent = 'Item removed from cart';
    } else if (Number(qty) === 1){ 
      msgElement.textContent = `${qty} × Item added to cart`;
    } else {
      msgElement.textContent = `${qty} × Items added to cart`;
    }

    msgElement.classList.add('is-visible');
    clearTimeout(msgElement._t);
    msgElement._t = setTimeout(() => msgElement.classList.remove('is-visible'), 1800);
  }

  async function fetchCartAndUpdateUI() {
    try {
      const res = await fetch(`${root}cart.js`, { headers: { 'Accept': 'application/json' } });
      const cart = await res.json();
      const byVariant = new Map(cart.items.map(i => [String(i.variant_id), i.quantity]));
      document.querySelectorAll('.product-card_qty').forEach(wrap => {
        const vid = wrap.getAttribute('data-variant-id');
        const input = wrap.querySelector('.product-card_qty__input');
        if (!vid || !input) return;
        const q = byVariant.get(vid);
        input.value = typeof q === 'number' ? q : 0;
      });
      const countElement = document.querySelector('.site-header__cart-count');
      if (countElement) countElement.textContent = cart.item_count;
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', fetchCartAndUpdateUI);

  // plus / minus
  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.product-card_qty__button');
    if (!btn) return;

    const wrap = btn.closest('.product-card_qty');
    const input = wrap && wrap.querySelector('.product-card_qty__input');
    const vid = wrap && wrap.getAttribute('data-variant-id');
    if (!wrap || !input || !vid) return;

    const step = Number(btn.dataset.step || 1);
    const min = Number(input.min || 0);
    const prev = Number(input.value || 0);
    const next = Math.max(min, prev + step);
    if (next === prev) return;

    input.value = next;
    wrap.classList.add('product-card_qty--loading');
    try {
      await setVariantQty(vid, next);
      showQtyMessage(wrap, next);
      wrap.classList.add('product-card_qty--ok');
      setTimeout(() => wrap.classList.remove('product-card_qty--ok'), 600);
    } catch (err) {
      alert(err.message || 'Could not update cart.');
      input.value = prev; // revert
    } finally {
      wrap.classList.remove('product-card_qty--loading');
    }
  });

  // Handle when user types rather than using plus or minus
  let typeTimer;
  document.addEventListener('input', function (e) {
    const input = e.target.closest('.product-card_qty__input');
    if (!input) return;

    const wrap = input.closest('.product-card_qty');
    const vid = wrap && wrap.getAttribute('data-variant-id');
    if (!wrap || !vid) return;

    const min = Number(input.min || 0);
    const prev = Number(input.getAttribute('data-prev') || input.value || 0);
    const val = Math.max(min, Math.floor(Number(input.value || 0)));
    input.value = val;

    clearTimeout(typeTimer);
    typeTimer = setTimeout(async () => {
      wrap.classList.add('product-card_qty--loading');
      try {
        await setVariantQty(vid, val);
        showQtyMessage(wrap, val);
        wrap.classList.add('product-card_qty--ok');
        setTimeout(() => wrap.classList.remove('product-card_qty--ok'), 600);
        input.setAttribute('data-prev', String(val));
      } catch (err) {
        alert(err.message || 'Could not update cart.');
      } finally {
        wrap.classList.remove('product-card_qty--loading');
      }
    }, 350);
  });
})();
