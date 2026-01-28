'use server'

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Initialize Admin Client (Bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- AUTH ---
export async function loginAction(formData: FormData) {
    const password = formData.get('password');

    if (password === process.env.ADMIN_PASSWORD) {
        const cookieStore = await cookies();
        cookieStore.set('admin_session', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });
        return { success: true };
    }
    return { success: false, error: 'Invalid password' };
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
    redirect('/admin/login');
}

// --- DATA FETCHING ---

export async function getStoreData() {
    return fetchStoreData(false);
}

export async function getAdminData() {
    return fetchStoreData(true);
}

async function fetchStoreData(isAdmin: boolean) {
    const { data: settings } = await supabaseAdmin.from('settings').select('*');
    const { data: categories } = await supabaseAdmin.from('categories').select('*').order('sort_order');

    // Order by 'name' for stability
    const { data: allAddonGroups } = await supabaseAdmin
        .from('addon_groups')
        .select('*, addons(*)')
        .order('name');

    let productQuery = supabaseAdmin
        .from('products')
        .select(`
      *,
      variants (*),
      product_addon_groups (
        addon_groups (
          *,
          addons (*)
        )
      )
    `);

    if (!isAdmin) {
        productQuery = productQuery.eq('is_active', true);
    }

    const { data: products } = await productQuery;

    const rawSettings = settings?.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {}) || {};
    const dbInfo = rawSettings.restaurant_info;
    const safeInfo = (typeof dbInfo === 'object' && dbInfo !== null) ? dbInfo : {};

    const settingsObj = {
        name: safeInfo.name || 'Pizza Shop',
        currency: safeInfo.currency || '$',
        phone: safeInfo.phone || '923152967579',
        delivery_fee_cents: safeInfo.delivery_fee_cents ?? 299,
        theme_color: safeInfo.theme_color || 'red',
    };

    return {
        settings: settingsObj,
        categories: categories || [],
        products: products || [],
        addonGroups: allAddonGroups || []
    };
}

// --- ADMIN MUTATIONS ---

// 1. Settings
export async function updateSettings(formData: FormData) {
    const settings = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        currency: formData.get('currency'),
        delivery_fee_cents: parseInt(formData.get('delivery_fee_cents') as string || '0'),
        theme_color: 'red'
    };

    await supabaseAdmin.from('settings').upsert({
        key: 'restaurant_info',
        value: settings
    });

    revalidatePath('/');
    revalidatePath('/admin');
}

// 2. Categories
export async function createCategory(name: string) {
    const { data: max } = await supabaseAdmin.from('categories').select('sort_order').order('sort_order', { ascending: false }).limit(1).single();
    const nextOrder = (max?.sort_order || 0) + 1;

    await supabaseAdmin.from('categories').insert({ name, sort_order: nextOrder });
    revalidatePath('/');
    revalidatePath('/admin');
}

export async function updateCategoryOrderBulk(items: { id: string, sort_order: number }[]) {
    await Promise.all(items.map(item =>
        supabaseAdmin.from('categories').update({ sort_order: item.sort_order }).eq('id', item.id)
    ));
    revalidatePath('/');
    revalidatePath('/admin');
}

export async function deleteCategory(id: string) {
    await supabaseAdmin.from('categories').delete().eq('id', id);
    revalidatePath('/');
    revalidatePath('/admin');
}

// 3. Products
export async function updateProductStatus(id: string, isActive: boolean) {
    await supabaseAdmin.from('products').update({ is_active: isActive }).eq('id', id);
    revalidatePath('/');
    revalidatePath('/admin');
}

export async function createProduct(formData: FormData) {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('category_id') as string;
    const price = parseInt(formData.get('price') as string || '0');

    const encodedName = encodeURIComponent(name);
    const imageUrl = (formData.get('image_url') as string) || `https://placehold.co/400x300/orange/white?text=${encodedName}`;

    const { data: product, error } = await supabaseAdmin
        .from('products')
        .insert({
            name,
            description,
            category_id: categoryId,
            image_url: imageUrl,
            is_active: true
        })
        .select()
        .single();

    if (error || !product) {
        console.error('Error creating product:', error);
        return { error: 'Failed to create product' };
    }

    await supabaseAdmin.from('variants').insert({
        product_id: product.id,
        size: 'Standard',
        crust: 'Original',
        price: price,
        is_active: true
    });

    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}

export async function deleteProduct(id: string) {
    await supabaseAdmin.from('products').delete().eq('id', id);
    revalidatePath('/admin');
    revalidatePath('/');
}

// 4. Variants
export async function createVariant(formData: FormData) {
    const product_id = formData.get('product_id') as string;
    const size = formData.get('size') as string;
    // Ensure crust is empty string if missing (optional field)
    const crust = (formData.get('crust') as string) || '';
    const price = parseInt(formData.get('price') as string);

    await supabaseAdmin.from('variants').insert({
        product_id,
        size,
        crust,
        price,
        is_active: true
    });
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function updateVariant(formData: FormData) {
    const id = formData.get('id') as string;
    const size = formData.get('size') as string;
    // Ensure crust is empty string if missing
    const crust = (formData.get('crust') as string) || '';
    const price = parseInt(formData.get('price') as string);

    await supabaseAdmin.from('variants').update({ size, crust, price }).eq('id', id);
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function deleteVariant(id: string) {
    await supabaseAdmin.from('variants').delete().eq('id', id);
    revalidatePath('/admin');
    revalidatePath('/');
}

// 5. Add-on Groups & Add-ons
export async function createAddonGroup(formData: FormData) {
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const min_select = parseInt(formData.get('min_select') as string || '0');
    const max_select = parseInt(formData.get('max_select') as string || '1');
    const is_required = formData.get('is_required') === 'on';

    await supabaseAdmin.from('addon_groups').insert({
        name, type, min_select, max_select, is_required
    });
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function deleteAddonGroup(id: string) {
    await supabaseAdmin.from('addon_groups').delete().eq('id', id);
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function createAddon(formData: FormData) {
    const group_id = formData.get('group_id') as string;
    const name = formData.get('name') as string;
    const price = parseInt(formData.get('price') as string || '0');

    await supabaseAdmin.from('addons').insert({ group_id, name, price });
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function deleteAddon(id: string) {
    await supabaseAdmin.from('addons').delete().eq('id', id);
    revalidatePath('/admin');
    revalidatePath('/');
}

export async function toggleProductAddonGroup(product_id: string, group_id: string, is_linked: boolean) {
    if (is_linked) {
        await supabaseAdmin.from('product_addon_groups').insert({ product_id, group_id });
    } else {
        await supabaseAdmin.from('product_addon_groups').delete().match({ product_id, group_id });
    }
    revalidatePath('/admin');
    revalidatePath('/');
}