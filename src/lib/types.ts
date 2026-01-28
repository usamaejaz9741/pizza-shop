export interface Category {
    id: string;
    name: string;
    sort_order: number;
    is_active: boolean;
}

export interface Product {
    id: string;
    category_id: string;
    name: string;
    description: string;
    image_url: string;
    is_active: boolean;
    variants?: Variant[];
    // Matches Supabase select: product_addon_groups(addon_groups(*))
    product_addon_groups?: {
        addon_groups: AddonGroup;
    }[];
}

export interface Variant {
    id: string;
    product_id: string;
    size: string;
    crust: string;
    price: number; // Cents
    is_active: boolean;
}

export interface AddonGroup {
    id: string;
    name: string;
    type: 'topping' | 'side' | 'drink';
    min_select: number;
    max_select: number;
    is_required: boolean;
    addons?: Addon[];
}

export interface Addon {
    id: string;
    group_id: string;
    name: string;
    price: number; // Cents
    is_active: boolean;
}

export interface CartItem {
    uid: string;
    product: Product;
    variant: Variant;
    selectedAddons: Addon[];
    quantity: number;
}

export interface StoreSettings {
    name: string;
    currency: string;
    phone: string;
    delivery_fee_cents: number;
    theme_color: string;
}