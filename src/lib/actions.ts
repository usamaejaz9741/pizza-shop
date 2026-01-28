"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v)
    throw new Error(`[env] Missing ${name}. Add it to .env.local (root).`);
  return v;
}

// IMPORTANT:
// - NEXT_PUBLIC_SUPABASE_ANON_KEY can be a publishable key (sb_publishable_...)
// - SUPABASE_SERVICE_ROLE_KEY MUST be a secret/service-role key (sb_secret_... or legacy JWT)
const SUPABASE_URL = mustEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

const looksLikeServiceRole =
  SERVICE_KEY.startsWith("sb_secret_") || SERVICE_KEY.startsWith("eyJ");

if (!looksLikeServiceRole) {
  throw new Error(
    `[env] SUPABASE_SERVICE_ROLE_KEY does not look like a service-role key. ` +
      `Expected sb_secret_... (or legacy JWT eyJ...). ` +
      `If you put a publishable/anon key here, all admin mutations will silently fail under RLS.`,
  );
}

// Initialize Admin Client (bypasses RLS)
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// --- AUTH ---
export async function loginAction(formData: FormData) {
  const password = formData.get("password");

  if (password === process.env.ADMIN_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    return { success: true };
  }
  return { success: false, error: "Invalid password" };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/admin/login");
}

// --- DATA FETCHING ---
export async function getStoreData() {
  return fetchStoreData(false);
}

export async function getAdminData() {
  return fetchStoreData(true);
}

async function fetchStoreData(isAdmin: boolean) {
  const settingsRes = await supabaseAdmin.from("settings").select("*");
  if (settingsRes.error)
    throw new Error(`settings.select: ${settingsRes.error.message}`);

  const categoriesRes = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("sort_order");
  if (categoriesRes.error)
    throw new Error(`categories.select: ${categoriesRes.error.message}`);

  // Order by 'name' for stability
  const addonGroupsRes = await supabaseAdmin
    .from("addon_groups")
    .select("*, addons(*)")
    .order("name");
  if (addonGroupsRes.error)
    throw new Error(`addon_groups.select: ${addonGroupsRes.error.message}`);

  let productQuery = supabaseAdmin.from("products").select(`
      *,
      variants (*),
      product_addon_groups (
        group_id,
        addon_groups (
          *,
          addons (*)
        )
      )
    `);

  if (!isAdmin) {
    productQuery = productQuery.eq("is_active", true);
  }

  const productsRes = await productQuery;
  if (productsRes.error)
    throw new Error(`products.select: ${productsRes.error.message}`);

  const settings = settingsRes.data ?? [];
  const categories = categoriesRes.data ?? [];
  const products = productsRes.data ?? [];
  const addonGroups = addonGroupsRes.data ?? [];

  const rawSettings =
    settings.reduce(
      (acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }),
      {},
    ) || {};
  const dbInfo = rawSettings.restaurant_info;
  const safeInfo = typeof dbInfo === "object" && dbInfo !== null ? dbInfo : {};

  const settingsObj = {
    name: safeInfo.name || "Pizza Shop",
    currency: safeInfo.currency || "$",
    phone: safeInfo.phone || "923152967579",
    delivery_fee_cents: safeInfo.delivery_fee_cents ?? 299,
    theme_color: safeInfo.theme_color || "red",
  };

  return {
    settings: settingsObj,
    categories,
    products,
    addonGroups,
  };
}

// --- ADMIN MUTATIONS ---

// 1. Settings
export async function updateSettings(formData: FormData) {
  const settings = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    currency: formData.get("currency"),
    delivery_fee_cents: parseInt(
      (formData.get("delivery_fee_cents") as string) || "0",
      10,
    ),
    theme_color: "red",
  };

  const res = await supabaseAdmin.from("settings").upsert({
    key: "restaurant_info",
    value: settings,
  });

  if (res.error) throw new Error(`updateSettings: ${res.error.message}`);

  revalidatePath("/");
  revalidatePath("/admin");
}

// 2. Categories
export async function createCategory(name: string) {
  const maxRes = await supabaseAdmin
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  if (maxRes.error && maxRes.error.code !== "PGRST116") {
    // PGRST116 = "Results contain 0 rows" (no categories yet)
    throw new Error(`createCategory: ${maxRes.error.message}`);
  }

  const nextOrder = ((maxRes.data as any)?.sort_order || 0) + 1;
  const res = await supabaseAdmin
    .from("categories")
    .insert({ name, sort_order: nextOrder });

  if (res.error) throw new Error(`createCategory: ${res.error.message}`);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateCategoryOrderBulk(
  items: { id: string; sort_order: number }[],
) {
  const results = await Promise.all(
    items.map((item) =>
      supabaseAdmin
        .from("categories")
        .update({ sort_order: item.sort_order })
        .eq("id", item.id),
    ),
  );
  const firstErr = results.find((r) => r.error)?.error;
  if (firstErr) throw new Error(`updateCategoryOrderBulk: ${firstErr.message}`);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteCategory(id: string) {
  const res = await supabaseAdmin.from("categories").delete().eq("id", id);
  if (res.error) throw new Error(`deleteCategory: ${res.error.message}`);

  revalidatePath("/");
  revalidatePath("/admin");
}

// 3. Products
export async function updateProductStatus(id: string, isActive: boolean) {
  const res = await supabaseAdmin
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id);
  if (res.error) throw new Error(`updateProductStatus: ${res.error.message}`);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function createProduct(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const categoryId = formData.get("category_id") as string;
  const price = parseInt((formData.get("price") as string) || "0", 10);

  const encodedName = encodeURIComponent(name);
  const imageUrl =
    (formData.get("image_url") as string) ||
    `https://placehold.co/400x300/orange/white?text=${encodedName}`;

  const createRes = await supabaseAdmin
    .from("products")
    .insert({
      name,
      description,
      category_id: categoryId,
      image_url: imageUrl,
      is_active: true,
    })
    .select()
    .single();

  if (createRes.error || !createRes.data) {
    console.error("Error creating product:", createRes.error);
    return { error: createRes.error?.message || "Failed to create product" };
  }

  const product = createRes.data as any;

  const variantRes = await supabaseAdmin.from("variants").insert({
    product_id: product.id,
    size: "Standard",
    crust: "Original",
    price,
    is_active: true,
  });

  if (variantRes.error)
    throw new Error(
      `createProduct (default variant): ${variantRes.error.message}`,
    );

  revalidatePath("/admin");
  revalidatePath("/");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const res = await supabaseAdmin.from("products").delete().eq("id", id);
  if (res.error) throw new Error(`deleteProduct: ${res.error.message}`);

  revalidatePath("/admin");
  revalidatePath("/");
}

// 4. Variants
export async function createVariant(formData: FormData) {
  const product_id = formData.get("product_id") as string;
  const size = formData.get("size") as string;
  const crust = (formData.get("crust") as string) || "";
  const price = parseInt(formData.get("price") as string, 10);

  const res = await supabaseAdmin.from("variants").insert({
    product_id,
    size,
    crust,
    price,
    is_active: true,
  });

  if (res.error) throw new Error(`createVariant: ${res.error.message}`);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updateVariant(formData: FormData) {
  const id = formData.get("id") as string;
  const size = formData.get("size") as string;
  const crust = (formData.get("crust") as string) || "";
  const price = parseInt(formData.get("price") as string, 10);

  const res = await supabaseAdmin
    .from("variants")
    .update({ size, crust, price })
    .eq("id", id);
  if (res.error) throw new Error(`updateVariant: ${res.error.message}`);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteVariant(id: string) {
  const res = await supabaseAdmin.from("variants").delete().eq("id", id);
  if (res.error) throw new Error(`deleteVariant: ${res.error.message}`);

  revalidatePath("/admin");
  revalidatePath("/");
}

// 5. Add-on Groups & Add-ons
export async function createAddonGroup(formData: FormData) {
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const min_select = parseInt(
    (formData.get("min_select") as string) || "0",
    10,
  );
  const max_select = parseInt(
    (formData.get("max_select") as string) || "1",
    10,
  );
  const is_required = formData.get("is_required") === "on";

  const res = await supabaseAdmin.from("addon_groups").insert({
    name,
    type,
    min_select,
    max_select,
    is_required,
    is_active: true,
  });

  if (res.error) throw new Error(`createAddonGroup: ${res.error.message}`);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteAddonGroup(id: string) {
  const res = await supabaseAdmin.from("addon_groups").delete().eq("id", id);
  if (res.error) throw new Error(`deleteAddonGroup: ${res.error.message}`);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createAddon(formData: FormData) {
  const group_id = formData.get("group_id") as string;
  const name = formData.get("name") as string;
  const price = parseInt((formData.get("price") as string) || "0", 10);

  const res = await supabaseAdmin
    .from("addons")
    .insert({ group_id, name, price, is_active: true });
  if (res.error) throw new Error(`createAddon: ${res.error.message}`);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteAddon(id: string) {
  const res = await supabaseAdmin.from("addons").delete().eq("id", id);
  if (res.error) throw new Error(`deleteAddon: ${res.error.message}`);

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleProductAddonGroup(
  product_id: string,
  group_id: string,
  is_linked: boolean,
) {
  if (is_linked) {
    // Use upsert so double-clicks / races don't fail with duplicate key errors.
    const res = await supabaseAdmin
      .from("product_addon_groups")
      .upsert({ product_id, group_id }, { onConflict: "product_id,group_id" });
    if (res.error)
      throw new Error(`toggleProductAddonGroup (link): ${res.error.message}`);
  } else {
    const res = await supabaseAdmin
      .from("product_addon_groups")
      .delete()
      .match({ product_id, group_id });
    if (res.error)
      throw new Error(`toggleProductAddonGroup (unlink): ${res.error.message}`);
  }

  revalidatePath("/admin");
  revalidatePath("/");
}
