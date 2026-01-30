import { CartItem, StoreSettings } from "./types";

// export const formatCurrency = (cents: number, symbol: string = "$") => {
//   return `${symbol}${(cents / 100).toFixed(2)}`;
// };

// export const generateWhatsAppLink = (
//     items: CartItem[],
//     subtotal: number,
//     deliveryFee: number,
//     settings: StoreSettings,
//     customer: any
// ) => {
//     const isDelivery = customer.type === 'delivery';
//     const total = subtotal + (isDelivery ? deliveryFee : 0);

//     let msg = `*NEW ORDER - ${settings.name}*\n`;
//     msg += `--------------------------------\n`;
//     msg += `*Customer:* ${customer.name}\n`;
//     msg += `*Phone:* ${customer.phone}\n`;
//     msg += `*Type:* ${isDelivery ? 'Delivery' : 'Pickup'}\n`;
//     if (isDelivery) msg += `*Address:* ${customer.address}\n`;
//     if (customer.notes) msg += `*Notes:* ${customer.notes}\n`;

//     msg += `\n*ORDER DETAILS:*\n`;
//     items.forEach((item, idx) => {
//         msg += `${idx + 1}. ${item.product.name} (${item.variant.size}, ${item.variant.crust}) x${item.quantity}\n`;
//         if (item.selectedAddons.length > 0) {
//             msg += `   + ${item.selectedAddons.map(a => `${a.name}`).join(', ')}\n`;
//         }
//         const itemTotal = (item.variant.price + item.selectedAddons.reduce((s, a) => s + a.price, 0)) * item.quantity;
//         msg += `   Item Total: ${formatCurrency(itemTotal, settings.currency)}\n\n`;
//     });

//     msg += `--------------------------------\n`;
//     msg += `Subtotal: ${formatCurrency(subtotal, settings.currency)}\n`;
//     if (isDelivery) msg += `Delivery Fee: ${formatCurrency(deliveryFee, settings.currency)}\n`;
//     msg += `*GRAND TOTAL: ${formatCurrency(total, settings.currency)}*\n`;

//     const encoded = encodeURIComponent(msg);
//     return `https://wa.me/${settings.phone}?text=${encoded}`;
// };

const n = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const formatCurrency = (cents: number, symbol: string = "$") => {
  const safe = Number.isFinite(cents) ? cents : 0;
  return `${symbol}${(safe / 100).toFixed(2)}`;
};

export const buildWhatsAppOrderMessage = (
  items: CartItem[],
  subtotal: any,
  deliveryFee: any,
  settings: StoreSettings,
  customer: any,
) => {
  const isDelivery = customer.type === "delivery";

  const safeSubtotal = n(subtotal);
  const safeDeliveryFee = n(deliveryFee);

  const total = safeSubtotal + (isDelivery ? safeDeliveryFee : 0);

  let msg = `*NEW ORDER - ${settings.name}*\n`;
  msg += `--------------------------------\n`;
  msg += `*Customer:* ${customer.name}\n`;
  msg += `*Phone:* ${customer.phone}\n`;
  msg += `*Type:* ${isDelivery ? "Delivery" : "Pickup"}\n`;
  if (isDelivery) msg += `*Address:* ${customer.address}\n`;
  if (customer.notes) msg += `*Notes:* ${customer.notes}\n`;

  msg += `\n*ORDER DETAILS:*\n`;
  items.forEach((item, idx) => {
    msg += `${idx + 1}. ${item.product.name} (${item.variant.size}, ${
      item.variant.crust
    }) x${item.quantity}\n`;

    const addons = item.selectedAddons ?? [];
    if (addons.length > 0) {
      msg += `   + ${addons.map((a: any) => a.name).join(", ")}\n`;
    }

    const basePrice = n(item?.variant?.price);
    const addonsTotal = addons.reduce(
      (s: number, a: any) => s + n(a?.price),
      0,
    );
    const qty = n(item?.quantity);

    const itemTotal = (basePrice + addonsTotal) * qty;

    msg += `   Item Total: ${formatCurrency(itemTotal, settings.currency)}\n\n`;
  });

  msg += `--------------------------------\n`;
  msg += `Subtotal: ${formatCurrency(safeSubtotal, settings.currency)}\n`;
  if (isDelivery)
    msg += `Delivery Fee: ${formatCurrency(
      safeDeliveryFee,
      settings.currency,
    )}\n`;
  msg += `*GRAND TOTAL: ${formatCurrency(total, settings.currency)}*\n`;

  return msg;
};
