"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { getStoreData } from "@/lib/actions";
// import { formatCurrency, generateWhatsAppLink } from "@/lib/utils";
import {
  Product,
  Variant,
  AddonGroup,
  Addon,
  StoreSettings,
} from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  X,
  Check as CheckIcon,
} from "lucide-react";

// --- COMPONENTS ---

const Header = ({ settings }: { settings: StoreSettings }) => (
  <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b shadow-sm transition-all duration-200">
    <div className="max-w-md mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
      <h1 className="text-lg sm:text-xl font-extrabold text-red-600 tracking-tight flex items-center gap-2">
        {/* <span className="text-2xl">🍕</span> */}
        {settings?.name || "Pizza Shop"}
      </h1>
      <CartTrigger />
    </div>
  </header>
);

const CartTrigger = () => {
  const { items, toggleCart } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const count = items.reduce((acc, item) => acc + item.quantity, 0);

  if (count === 0) return null;

  return (
    <button
      onClick={toggleCart}
      className="bg-slate-900 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in zoom-in hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
    >
      <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span>{count}</span>
    </button>
  );
};

const CategoryNav = ({ categories, activeCat, onSelect }: any) => (
  <div className="sticky top-14 sm:top-16 z-30 bg-gray-50/95 backdrop-blur border-b overflow-x-auto no-scrollbar py-2 sm:py-3 px-4 flex gap-2">
    {categories.map((cat: any) => (
      <button
        key={cat.id}
        onClick={() => onSelect(cat.id)}
        className={`whitespace-nowrap px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
          activeCat === cat.id
            ? "bg-red-600 text-white shadow-md transform scale-105"
            : "bg-white text-gray-600 border border-gray-200 active:bg-gray-100"
        }`}
      >
        {cat.name}
      </button>
    ))}
  </div>
);

// --- MAIN PAGE ---

export default function Shop() {
  const [data, setData] = useState<{
    products: Product[];
    categories: any[];
    settings: any;
  } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { isCartOpen, toggleCart } = useCartStore();

  useEffect(() => {
    getStoreData().then((res) => {
      setData(res as any);
      if (res.categories.length) setActiveCategory(res.categories[0].id);
    });
  }, []);

  if (!data)
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4 bg-gray-50 px-4 text-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">
          Firing up the ovens...
        </p>
      </div>
    );

  const filteredProducts = data.products.filter(
    (p) => p.category_id === activeCategory,
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans text-slate-900">
      <Header settings={data.settings} />

      <CategoryNav
        categories={data.categories}
        activeCat={activeCategory}
        onSelect={setActiveCategory}
      />

      <main className="max-w-md mx-auto p-4 space-y-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className="bg-white p-3 rounded-3xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md"
          >
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 bg-gray-100 rounded-2xl overflow-hidden shadow-inner">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 128px, 128px"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between py-1 pr-1">
              <div>
                <h3 className="font-bold text-base sm:text-lg leading-tight text-slate-800">
                  {product.name}
                </h3>
                <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              </div>
              <div className="flex justify-between items-end mt-2">
                <div className="text-slate-900 font-extrabold text-base sm:text-lg">
                  {formatCurrency(
                    Math.min(...(product.variants?.map((v) => v.price) || [0])),
                    data.settings.currency,
                  )}
                </div>
                <button className="bg-red-50 text-red-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold hover:bg-red-100 transition-colors">
                  ADD +
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center">
            <div className="bg-white p-4 rounded-full mb-3 shadow-sm">
              <span className="text-3xl">🍽️</span>
            </div>
            <p>No items in this category yet.</p>
          </div>
        )}
      </main>

      {/* Product Builder Modal */}
      {selectedProduct && (
        <ProductBuilder
          product={selectedProduct}
          settings={data.settings}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Cart Drawer/Overlay */}
      {isCartOpen && (
        <CartDrawer settings={data.settings} onClose={toggleCart} />
      )}

      {/* Sticky Bottom View Cart (Mobile) */}
      <StickyCartSummary settings={data.settings} />
    </div>
  );
}

// --- PRODUCT BUILDER ---

function ProductBuilder({
  product,
  settings,
  onClose,
}: {
  product: Product;
  settings: StoreSettings;
  onClose: () => void;
}) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants?.[0] || null,
  );
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [qty, setQty] = useState(1);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const { addToCart } = useCartStore();

  const { foodGroups, drinkGroups } = useMemo(() => {
    const allGroups =
      product.product_addon_groups?.map((pag) => pag.addon_groups) || [];
    return {
      foodGroups: allGroups.filter(
        (g) => g.type === "topping" || g.type === "side",
      ),
      drinkGroups: allGroups.filter((g) => g.type === "drink"),
    };
  }, [product]);

  const steps = useMemo(() => {
    const s = ["variant"];
    if (foodGroups.length > 0) s.push("food");
    if (drinkGroups.length > 0) s.push("drinks");
    return s;
  }, [foodGroups.length, drinkGroups.length]);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const currentPrice =
    (selectedVariant?.price || 0) +
    selectedAddons.reduce((sum, a) => sum + a.price, 0);

  const handleAddonToggle = (addon: Addon, group: AddonGroup) => {
    const isSelected = selectedAddons.some((a) => a.id === addon.id);
    const siblings = selectedAddons.filter((a) => a.group_id === group.id);

    if (isSelected) {
      if (siblings.length <= group.min_select && group.is_required) return;
      setSelectedAddons((prev) => prev.filter((a) => a.id !== addon.id));
    } else {
      if (siblings.length >= group.max_select) return;
      setSelectedAddons((prev) => [...prev, addon]);
    }
  };

  const validateStep = () => {
    if (currentStep === "variant" && !selectedVariant) return false;
    const visibleGroups =
      currentStep === "food"
        ? foodGroups
        : currentStep === "drinks"
        ? drinkGroups
        : [];
    for (const group of visibleGroups) {
      const count = selectedAddons.filter(
        (a) => a.group_id === group.id,
      ).length;
      if (group.is_required && count < group.min_select) return false;
    }
    return true;
  };

  const handleNext = () => {
    if (isLastStep) {
      if (!selectedVariant) return;
      addToCart({
        product,
        variant: selectedVariant,
        selectedAddons,
        quantity: qty,
      });
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-md h-[95dvh] sm:h-auto sm:max-h-[85vh] rounded-t-4xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
          <div className="flex flex-col">
            <h2 className="font-bold text-lg sm:text-xl text-slate-900 line-clamp-1">
              {currentStep === "variant" && "Select Options"}
              {currentStep === "food" && "Customize It"}
              {currentStep === "drinks" && "Thirsty?"}
            </h2>
            <span className="text-xs text-gray-400 font-medium mt-0.5">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 p-2.5 rounded-full text-gray-500 hover:bg-gray-200 active:scale-90 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 sm:space-y-8 scroll-smooth overscroll-contain">
          {currentStep === "variant" && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div className="flex gap-4 sm:gap-5 items-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100 shrink-0">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl sm:text-2xl leading-tight text-slate-900 truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-400 mb-3 uppercase tracking-wider">
                  Available Options
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {product.variants?.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center justify-between p-3.5 sm:p-4 border-2 rounded-2xl cursor-pointer transition-all active:scale-[0.99] ${
                        selectedVariant?.id === v.id
                          ? "border-red-600 bg-red-50/50"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selectedVariant?.id === v.id
                              ? "border-red-600"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedVariant?.id === v.id && (
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-600" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold block text-gray-900 text-base sm:text-lg">
                            {v.size}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-500 font-medium">
                            {v.crust}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 text-base sm:text-lg">
                        {formatCurrency(v.price, settings.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(currentStep === "food" || currentStep === "drinks") && (
            <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-right-8 duration-300">
              {(currentStep === "food" ? foodGroups : drinkGroups).map(
                (group: AddonGroup) => (
                  <div key={group.id}>
                    <div className="flex justify-between items-center mb-3 sm:mb-4">
                      <h3 className="font-bold text-lg sm:text-xl text-slate-900">
                        {group.name}
                      </h3>
                      <div className="flex gap-2">
                        {group.is_required && (
                          <span className="text-[10px] bg-red-100 text-red-700 font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full tracking-wide">
                            REQUIRED
                          </span>
                        )}
                        <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                          Max {group.max_select}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                      {group.addons?.map((addon: Addon) => {
                        const isSelected = selectedAddons.some(
                          (a) => a.id === addon.id,
                        );
                        return (
                          <button
                            key={addon.id}
                            onClick={() => handleAddonToggle(addon, group)}
                            className={`flex justify-between items-center p-3 sm:p-4 rounded-2xl text-left transition-all active:scale-[0.99] ${
                              isSelected
                                ? "bg-red-50 ring-2 ring-red-600"
                                : "bg-white border border-gray-100 shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                  isSelected
                                    ? "bg-red-600 border-red-600"
                                    : "border-gray-300 bg-white"
                                }`}
                              >
                                {isSelected && (
                                  <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                )}
                              </div>
                              <span
                                className={`font-medium text-sm sm:text-base ${
                                  isSelected ? "text-red-900" : "text-gray-700"
                                }`}
                              >
                                {addon.name}
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-gray-500">
                              +{formatCurrency(addon.price, settings.currency)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t bg-white safe-area-bottom shadow-[0_-5px_15px_rgba(0,0,0,0.05)] shrink-0">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center bg-gray-50 rounded-2xl p-1 sm:p-1.5 border border-gray-200">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-9 sm:w-12 sm:h-10 flex items-center justify-center text-lg sm:text-xl font-bold text-gray-400 hover:text-red-600 hover:bg-white rounded-xl transition-all"
              >
                -
              </button>
              <span className="w-8 sm:w-10 text-center font-bold text-lg sm:text-xl text-slate-900">
                {qty}
              </span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-10 h-9 sm:w-12 sm:h-10 flex items-center justify-center text-lg sm:text-xl font-bold text-gray-400 hover:text-red-600 hover:bg-white rounded-xl transition-all"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                Total Price
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-none">
                {formatCurrency(currentPrice * qty, settings.currency)}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {currentStepIndex > 0 && (
              <button
                onClick={() => setCurrentStepIndex((prev) => prev - 1)}
                className="px-4 sm:px-5 bg-white border-2 border-gray-200 rounded-2xl hover:bg-gray-50 active:scale-95 transition-all text-gray-600"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!validateStep()}
              className="flex-1 bg-slate-900 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3.5 sm:py-4 rounded-2xl font-bold hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg shadow-slate-200"
            >
              <span>{isLastStep ? "Add to Order" : "Next Step"}</span>
              {!isLastStep && (
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- CART & CHECKOUT ---

function CartDrawer({
  settings,
  onClose,
}: {
  settings: StoreSettings;
  onClose: () => void;
}) {
  const {
    items,
    removeFromCart,
    updateQuantity,
    deliveryType,
    setDeliveryType,
    subtotal,
  } = useCartStore();
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const cartSubtotal = subtotal();
  const deliveryFee =
    deliveryType === "delivery" ? settings.delivery_fee_cents : 0;
  const grandTotal = cartSubtotal + deliveryFee;

  // const handleCheckout = () => {
  //   if (!customer.name || !customer.phone) {
  //     alert("Name and Phone are required!");
  //     return;
  //   }
  //   if (deliveryType === 'delivery' && !customer.address) {
  //     alert("Delivery address required!");
  //     return;
  //   }

  //   const link = generateWhatsAppLink(items, cartSubtotal, deliveryFee, settings, { ...customer, type: deliveryType });
  //   window.open(link, '_blank');
  // };

  const handleCheckout = async () => {
    const payload = { items, subtotal, deliveryFee, settings, customer };

    const res = await fetch("/api/whatsapp-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.ok) {
      console.error("Failed:", data);
      alert("Failed to send order.");
      return;
    }

    alert("Order sent ✅");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-md h-dvh shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 sm:p-5 border-b flex justify-between items-center bg-white shrink-0">
          <h2 className="font-bold text-lg sm:text-xl flex items-center gap-2 text-slate-900">
            Your Order{" "}
            <span className="bg-red-100 text-red-600 text-xs px-2.5 py-1 rounded-full font-extrabold">
              {items.length}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="bg-gray-100 p-2 sm:p-2.5 rounded-full text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 overscroll-contain">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-6">
              <div className="bg-gray-50 p-6 rounded-full">
                <ShoppingCart className="w-12 h-12 opacity-30" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-gray-600">
                  Your cart is empty
                </p>
                <p className="text-sm mt-1">
                  Add some delicious items to get started!
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white bg-slate-900 px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-colors"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.uid}
                className="flex gap-4 border-b border-gray-100 pb-6 last:border-0"
              >
                <div className="w-8 flex flex-col items-center gap-2 pt-1">
                  <button
                    onClick={() => updateQuantity(item.uid, 1)}
                    className="bg-gray-100 w-8 h-8 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                  >
                    +
                  </button>
                  <span className="text-sm font-bold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      item.quantity > 1
                        ? updateQuantity(item.uid, -1)
                        : removeFromCart(item.uid)
                    }
                    className="bg-gray-100 w-8 h-8 rounded-xl text-xs font-bold hover:bg-gray-200 text-red-500 transition-colors"
                  >
                    -
                  </button>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 text-base">
                      {item.product.name}
                    </h4>
                    <span className="font-bold text-sm text-slate-900">
                      {formatCurrency(
                        item.variant.price * item.quantity,
                        settings.currency,
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium bg-gray-100 inline-block px-2.5 py-1 rounded-md">
                    {item.variant.size} • {item.variant.crust}
                  </p>
                  {item.selectedAddons.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 space-y-1 border-l-2 border-gray-200 pl-3 py-1">
                      {item.selectedAddons.map((a, i) => (
                        <div key={i} className="flex justify-between">
                          <span>+ {a.name}</span>
                          <span className="font-medium">
                            {formatCurrency(a.price, settings.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {items.length > 0 && (
            <div className="bg-gray-50 p-4 sm:p-5 rounded-3xl space-y-5 border border-gray-100">
              <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">
                Checkout Details
              </h3>

              <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm">
                <button
                  onClick={() => setDeliveryType("delivery")}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    deliveryType === "delivery"
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Delivery
                </button>
                <button
                  onClick={() => setDeliveryType("pickup")}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
                    deliveryType === "pickup"
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Pickup
                </button>
              </div>

              <div className="space-y-4">
                <input
                  placeholder="Your Name"
                  className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-base md:text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                  onChange={(e) =>
                    setCustomer({ ...customer, name: e.target.value })
                  }
                />
                <input
                  placeholder="Phone Number"
                  type="tel"
                  className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-base md:text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                  onChange={(e) =>
                    setCustomer({ ...customer, phone: e.target.value })
                  }
                />

                {deliveryType === "delivery" && (
                  <textarea
                    placeholder="Full Delivery Address"
                    className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-base md:text-sm h-24 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none"
                    onChange={(e) =>
                      setCustomer({ ...customer, address: e.target.value })
                    }
                  />
                )}
                <textarea
                  placeholder="Notes for kitchen... (Optional)"
                  className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-base md:text-sm h-20 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none"
                  onChange={(e) =>
                    setCustomer({ ...customer, notes: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t bg-white safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.05)] shrink-0">
            <div className="space-y-2 mb-5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(cartSubtotal, settings.currency)}
                </span>
              </div>
              {deliveryType === "delivery" && (
                <div className="flex justify-between text-gray-500">
                  <span>Delivery Fee</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(deliveryFee, settings.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-xl pt-3 border-t border-dashed border-gray-200">
                <span>Total</span>
                <span>{formatCurrency(grandTotal, settings.currency)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-green-700 active:scale-[0.98] transition-all shadow-lg shadow-green-200 text-lg"
            >
              <span>WhatsApp Order</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const StickyCartSummary = ({ settings }: any) => {
  const { items, toggleCart, subtotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 sm:hidden animate-in slide-in-from-bottom duration-500">
      <button
        onClick={toggleCart}
        className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center font-bold active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3">
          <span className="bg-white text-slate-900 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-extrabold shadow-sm">
            {items.reduce((a, b) => a + b.quantity, 0)}
          </span>
          <span>View Cart</span>
        </div>
        <span className="text-lg">
          {formatCurrency(subtotal(), settings.currency)}
        </span>
      </button>
    </div>
  );
};
