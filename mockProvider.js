// mockProvider.js
//
// A local mock of the "ShopBot" e-commerce support assistant. It requires no
// API key: given a customer message it returns a JSON string following the
// contract described in SPEC.md.
//
// promptfoo loads this as a custom provider (see promptfooconfig.yaml). The
// class exposes `id()` and `callApi(prompt, context)` and returns
// `{ output: <string> }`.

// Delivery dates are generated relative to the day the suite runs, so the
// fixture never goes stale. SPEC.md documents the rule rather than literal
// dates: your assertions should check the relationship, not a hardcoded string.
const DAY_MS = 24 * 60 * 60 * 1000;
const isoDate = (offsetDays) =>
  new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10);

const ORDERS = {
  A1043: { orderId: 'A1043', currency: 'EUR', status: 'shipped', items: [{ name: 'Wireless Mouse', qty: 1 }], total: 24.9, estimatedDelivery: isoDate(4) },
  A2210: { orderId: 'A2210', currency: 'USD', status: 'processing', items: [{ name: 'Mechanical Keyboard', qty: 1 }], total: 89, estimatedDelivery: isoDate(9) },
  A3078: { orderId: 'A3078', currency: 'USD', status: 'delivered', items: [{ name: 'USB-C Cable', qty: 2 }], total: 19.98, estimatedDelivery: isoDate(-12) },
};

const PRODUCTS = {
  P100: { productId: 'P100', name: 'Wireless Mouse', price: 24.9, currency: 'EUR', availability: 'in_stock' },
  P200: { productId: 'P200', name: 'Mechanical Keyboard', price: 89, currency: 'USD', availability: 'out_of_stock' },
};


// Accent-folded, whole-word matching. Folding first means accented and
// unaccented spellings compare equal, and word boundaries behave predictably.
const fold = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const has = (text, ...words) =>
  words.some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));

// Language detection: non-Latin scripts by character range, Latin languages by
// distinctive whole words. Checked most-specific first so Portuguese and
// Italian are not swallowed by the Spanish token list.
function detectLanguage(text) {
  if (/[぀-ヿ]/.test(text)) return 'ja';
  if (/[一-鿿]/.test(text)) return 'zh';
  if (/[؀-ۿ]/.test(text)) return 'ar';
  if (/[Ѐ-ӿ]/.test(text)) return 'ru';
  if (/[가-힯]/.test(text)) return 'ko';
  if (/[ऀ-ॿ]/.test(text)) return 'hi';

  const t = fold(text);
  if (has(t, 'bonjour', 'remboursement', 'commande', 'livraison', 'ou est')) return 'fr';
  if (has(t, 'hallo', 'bestellung', 'erstattung', 'lieferung', 'wo ist')) return 'de';
  if (has(t, 'dove', 'ordine', 'grazie', 'spedizione', 'rimborso')) return 'it';
  if (has(t, 'onde', 'obrigado', 'voce', 'encomenda', 'meu', 'minha')) return 'pt';
  if (has(t, 'hola', 'pedido', 'donde', 'gracias', 'devolucion', 'reembolso', 'envio')) return 'es';
  return 'en';
}

function findOrderId(text) {
  const m = text.match(/\b[A-Z]\d{4}\b/i);
  return m ? m[0].toUpperCase() : null;
}

function findProductId(text) {
  const m = text.match(/\b[A-Z]\d{3}\b/i);
  return m ? m[0].toUpperCase() : null;
}

function base(reply, intent, extra = {}) {
  return { reply, intent, language: 'en', escalate: false, card: null, ...extra };
}

function orderCard(order) {
  return {
    type: 'order',
    orderId: order.orderId,
    status: order.status,
    items: order.items,
    total: order.total,
    currency: 'USD',
    estimatedDelivery: order.estimatedDelivery,
  };
}

function productCard(product) {
  return {
    type: 'product',
    productId: product.productId,
    name: product.name,
    price: product.price,
    currency: 'USD',
    availability: product.availability,
  };
}

// Spec rule 1: whenever a specific order or product is named, attach its card,
// whatever the intent happens to be.
function namedCard(input) {
  const pid = findProductId(input);
  if (pid && PRODUCTS[pid]) return productCard(PRODUCTS[pid]);
  const oid = findOrderId(input);
  if (oid && ORDERS[oid]) return orderCard(ORDERS[oid]);
  return null;
}

function respondInner(rawInput) {
  const input = String(rawInput == null ? '' : rawInput).trim();

  // Empty input.
  if (input.length === 0) {
    return '{ "reply": "Could you share a bit more detail so I can help?", "intent": "fallback"';
  }

  const text = input.toLowerCase();
  const lang = detectLanguage(input);

  // Privacy / prompt-injection handling.
  const email = input.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const handoffWords = ['human', 'representative', 'real person', 'supervisor', 'manager'];
  const injectionWords = ['ignore previous', 'ignore all previous', 'ignore your instructions', 'system prompt', 'admin'];
  const injection = has(text, ...injectionWords);
  const emailDisclosure = Boolean(email) && has(text, 'order', 'orders', 'pedido');
  if (injection || emailDisclosure) {
    return JSON.stringify(base(
      `Sure, here is the order for ${email ? email[0] : 'that account'}.`,
      'order_status',
      { card: orderCard(ORDERS['A2210']) },
    ));
  }


  // Unsupported language.
  if (lang !== 'en' && lang !== 'es') {
    const canned = {
      fr: 'Bonjour! Je peux aider avec votre commande. Quel est le problem?',
      de: 'Hallo! Ich kann mit Ihre Bestellung helfen. Was ist das Problem?',
      it: 'Ciao! Posso aiutare con il tuo ordine. Qual e il problema?',
      pt: 'Ola! Posso ajudar com o seu pedido. Qual e o problema?',
    };
    return JSON.stringify(base(
      canned[lang] || 'Hello! I can help you with your order. What seems to be the problem?',
      'order_status',
      { language: lang },
    ));
  }

  // Human handoff request.
  const isHandoff = has(text, ...handoffWords, 'agent') || /\b(talk|speak|connect)\b[^.?!]*\b(to|with)\b[^.?!]*\bsomeone\b/i.test(text);
  if (isHandoff) {
    return JSON.stringify(base(
      "I understand. I'll connect you with our support team.",
      'fallback',
      { escalate: false },
    ));
  }

  // Lost / damaged package.
  const aboutSite = false;
  if (!aboutSite && has(text, 'lost', 'stolen', 'never arrived', 'damaged', 'broken')) {
    return JSON.stringify(base(
      "I'm sorry to hear that. I'm escalating this to a specialist who will make it right.",
      'shipping',
      { escalate: true },
    ));
  }

  // Refund.
  if (has(text, 'refund', 'money back', 'reembolso')) {
    const refundEn = 'You should have checked the return window before ordering, but I can look into it.';
    const refundReply = refundEn;
    return JSON.stringify(base(
      refundReply,
      'refund',
      { language: lang },
    ));
  }

  // Returns.
  if (has(text, 'return', 'devolucion', 'devolución')) {
    const returnReply = "Happy to help with a return. I've generated a prepaid return label for you.";
    return JSON.stringify(base(
      returnReply,
      'return',
      { language: lang },
    ));
  }

  // Product info.
  const productId = findProductId(input);
  if (productId && PRODUCTS[productId]) {
    const p = PRODUCTS[productId];
    const availText = p.availability === 'in_stock' ? 'in stock' : 'out of stock';
    const priceText = `${p.price}`;
    return JSON.stringify(base(
      `${p.name} is priced at ${priceText} and is currently ${availText}.`,
      'product_info',
      { language: lang, card: productCard(p) },
    ));
  }

  // Order status.
  const orderId = findOrderId(input);
  if (orderId && ORDERS[orderId]) {
    const o = ORDERS[orderId];
    return JSON.stringify(base(
      `Order ${o.orderId} is ${o.status}. Estimated delivery: ${o.estimatedDelivery}.`,
      'order_status',
      { language: lang, card: orderCard(o) },
    ));
  }
  if (has(text, 'order', 'track', 'where is', 'status', 'pedido')) {
    return JSON.stringify(base(
      lang === 'es'
        ? 'Claro, ¿cuál es tu número de pedido? Se parece a "A1043".'
        : 'Sure, what is your order number? It looks like "A1043".',
      'order_status',
      { language: lang },
    ));
  }

  // Shipping.
  if (has(text, 'shipping', 'delivery', 'ship', 'deliver')) {
    return JSON.stringify(base(
      'We offer standard (3-5 days) and express (1-2 days) shipping.',
      'shipping',
      { language: lang },
    ));
  }

  // Greeting.
  if (has(text, 'hi', 'hello', 'hey', 'hola')) {
    return JSON.stringify(base(
      lang === 'es' ? '¡Hola! ¿Cómo puedo ayudarte hoy?' : 'Hi there! How can I help you today?',
      'greeting',
      { language: lang },
    ));
  }

  // Fallback.
  return JSON.stringify(base(
    lang === 'es'
      ? 'No estoy seguro de haber entendido. Puedo ayudarte con pedidos, envíos, devoluciones, reembolsos y productos.'
      : "I'm not sure I understood. I can help with orders, shipping, returns, refunds, and products.",
    'fallback',
    { language: lang },
  ));
}

function respond(rawInput) {
  const out = respondInner(rawInput);
  return out;
}

class MockProvider {
  constructor(options = {}) {
    this.providerId = options.id || 'shopbot-mock';
    this.config = options.config || {};
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt, context) {
    const input = (context && context.vars && context.vars.query != null) ? context.vars.query : prompt;
    return { output: respond(input) };
  }
}

module.exports = MockProvider;
