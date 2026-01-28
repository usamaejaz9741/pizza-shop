import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './types';

interface CartState {
    items: CartItem[];
    isCartOpen: boolean;
    deliveryType: 'delivery' | 'pickup';
    toggleCart: () => void;
    addToCart: (item: Omit<CartItem, 'uid'>) => void;
    removeFromCart: (uid: string) => void;
    updateQuantity: (uid: string, delta: number) => void;
    setDeliveryType: (type: 'delivery' | 'pickup') => void;
    clearCart: () => void;
    subtotal: () => number;
}

const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isCartOpen: false,
            deliveryType: 'delivery',

            toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

            addToCart: (item) => set((state) => ({
                items: [...state.items, { ...item, uid: generateId() }],
                isCartOpen: true,
            })),

            removeFromCart: (uid) => set((state) => ({
                items: state.items.filter((i) => i.uid !== uid)
            })),

            updateQuantity: (uid, delta) => set((state) => ({
                items: state.items.map((i) => {
                    if (i.uid === uid) {
                        const newQty = i.quantity + delta;
                        return newQty > 0 ? { ...i, quantity: newQty } : i;
                    }
                    return i;
                })
            })),

            setDeliveryType: (type) => set({ deliveryType: type }),

            clearCart: () => set({ items: [] }),

            subtotal: () => {
                const { items } = get();
                return items.reduce((total, item) => {
                    const itemBase = item.variant.price;
                    const addonsTotal = item.selectedAddons.reduce((sum, a) => sum + a.price, 0);
                    return total + ((itemBase + addonsTotal) * item.quantity);
                }, 0);
            }
        }),
        { name: 'pizza-cart-storage' }
    )
);