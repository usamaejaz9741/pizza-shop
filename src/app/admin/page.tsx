'use client';

import { useState, useEffect, Fragment, useRef } from 'react';
import {
    logoutAction,
    createCategory,
    deleteCategory,
    getAdminData,
    updateProductStatus,
    createProduct,
    deleteProduct,
    updateSettings,
    createVariant,
    deleteVariant,
    updateVariant,
    updateCategoryOrderBulk,
    createAddonGroup,
    deleteAddonGroup,
    createAddon,
    deleteAddon,
    toggleProductAddonGroup
} from '@/lib/actions';
import { Product, Category, AddonGroup } from '@/lib/types';
import Image from 'next/image';
import {
    LayoutDashboard,
    Package,
    List,
    Settings,
    Menu,
    X,
    LogOut,
    Trash2,
    Plus,
    Check,
    DollarSign,
    Bike,
    ChevronDown,
    ChevronUp,
    Save,
    Layers,
    Pencil,
    Utensils,
    GripVertical
} from 'lucide-react';

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('Overview');
    const [data, setData] = useState<{ products: Product[], categories: Category[], addonGroups: AddonGroup[], settings: any } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Custom Dropdown State for Products (Category)
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    // Custom Dropdown State for Addons (Type)
    const [isAddonTypeOpen, setIsAddonTypeOpen] = useState(false);
    const [selectedAddonType, setSelectedAddonType] = useState('topping');

    // Expansion State
    const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
    const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

    // Categories DND State
    const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const storeData = await getAdminData();
        setData(storeData as any);
        setIsLoading(false);
    };

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const toggleProductExpand = (id: string) => {
        setExpandedProductId(expandedProductId === id ? null : id);
        setEditingVariantId(null);
    };

    // --- DESKTOP DND HANDLERS ---
    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.stopPropagation();
        setDraggedCategoryIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedCategoryIndex === null || draggedCategoryIndex === index) return;

        if (data && data.categories) {
            const newCategories = [...data.categories];
            const draggedItem = newCategories[draggedCategoryIndex];

            newCategories.splice(draggedCategoryIndex, 1);
            newCategories.splice(index, 0, draggedItem);

            setData({ ...data, categories: newCategories });
            setDraggedCategoryIndex(index);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await saveCategoryOrder();
    };

    const handleDragEnd = async () => {
        setDraggedCategoryIndex(null);
        await saveCategoryOrder();
    };

    // --- MOBILE TOUCH HANDLERS ---
    const handleTouchStart = (index: number) => {
        setDraggedCategoryIndex(index);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.cancelable) e.preventDefault();

        if (draggedCategoryIndex === null || !listRef.current) return;

        const touch = e.touches[0];
        const { clientY } = touch;

        const items = Array.from(listRef.current.children) as HTMLElement[];
        let targetIndex = -1;

        for (let i = 0; i < items.length; i++) {
            const rect = items[i].getBoundingClientRect();
            if (clientY >= rect.top && clientY <= rect.bottom) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex !== -1 && targetIndex !== draggedCategoryIndex) {
            if (data && data.categories) {
                const newCategories = [...data.categories];
                const draggedItem = newCategories[draggedCategoryIndex];
                newCategories.splice(draggedCategoryIndex, 1);
                newCategories.splice(targetIndex, 0, draggedItem);
                setData({ ...data, categories: newCategories });
                setDraggedCategoryIndex(targetIndex);
            }
        }
    };

    const handleTouchEnd = async () => {
        setDraggedCategoryIndex(null);
        await saveCategoryOrder();
    };

    const saveCategoryOrder = async () => {
        if (data?.categories) {
            const updates = data.categories.map((cat, index) => ({
                id: cat.id,
                sort_order: index + 1
            }));
            await updateCategoryOrderBulk(updates);
            await loadData();
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading Dashboard...</div>;

    const NavItem = ({ tab, icon: Icon }: { tab: string, icon: any }) => (
        <button
            onClick={() => { setActiveTab(tab); closeMobileMenu(); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab
                    ? 'bg-red-600 text-white font-medium shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
        >
            <Icon className="w-5 h-5" />
            <span>{tab}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans text-slate-800">

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out shadow-2xl
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
                    <div>
                        <h1 className="font-bold text-xl tracking-tight flex items-center gap-2">
                            <span className="text-2xl">🍕</span> Admin
                        </h1>
                        <p className="text-xs text-slate-400 mt-1 truncate max-w-[150px]">{data?.settings?.name}</p>
                    </div>
                    <button onClick={closeMobileMenu} className="md:hidden text-slate-400 hover:text-white p-2">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavItem tab="Overview" icon={LayoutDashboard} />
                    <NavItem tab="Products" icon={Package} />
                    <NavItem tab="Add-ons" icon={Utensils} />
                    <NavItem tab="Categories" icon={List} />
                    <NavItem tab="Settings" icon={Settings} />
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
                    <form action={logoutAction}>
                        <button className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl text-sm font-bold transition-colors">
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-72 min-w-0 pb-20 md:pb-0 h-screen overflow-y-auto">

                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
                    <h2 className="font-bold text-lg text-slate-800">{activeTab}</h2>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -mr-2 text-slate-600 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {/* Desktop Header */}
                    <header className="hidden md:flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{activeTab}</h2>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">System Online</span>
                        </div>
                    </header>

                    {activeTab === 'Overview' && data && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                <StatCard title="Total Products" value={data.products.length} icon={Package} />
                                <StatCard title="Categories" value={data.categories.length} icon={List} />
                                <StatCard title="Add-on Groups" value={data.addonGroups.length} icon={Utensils} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'Products' && data && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Add Product Form */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                                    <div className="bg-green-100 p-2 rounded-lg text-green-700"><Plus className="w-5 h-5" /></div>
                                    Add New Product
                                </h3>
                                <form action={async (formData) => {
                                    await createProduct(formData);
                                    loadData();
                                    setSelectedCategoryId('');
                                }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input name="name" placeholder="Product Name" className="border border-gray-200 bg-gray-50 p-3 rounded-xl text-base md:text-sm focus:bg-white focus:ring-2 focus:ring-red-600 outline-none transition-all" required />
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-400">$</span>
                                        <input name="price" type="number" placeholder="Base Price (Cents)" className="w-full border border-gray-200 bg-gray-50 p-3 pl-7 rounded-xl text-base md:text-sm focus:bg-white focus:ring-2 focus:ring-red-600 outline-none transition-all" required />
                                    </div>
                                    <div className="relative">
                                        <input type="hidden" name="category_id" value={selectedCategoryId} required />
                                        <button type="button" onClick={() => setIsCategoryOpen(!isCategoryOpen)} className={`w-full flex items-center justify-between border border-gray-200 bg-gray-50 p-3 rounded-xl text-base md:text-sm focus:bg-white focus:ring-2 focus:ring-red-600 outline-none transition-all ${!selectedCategoryId ? 'text-gray-400' : 'text-gray-800'}`}>
                                            <span>{selectedCategoryId ? data.categories.find(c => c.id === selectedCategoryId)?.name : 'Select Category'}</span>
                                            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isCategoryOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsCategoryOpen(false)} />
                                                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                                    {data.categories.map(c => (
                                                        <button key={c.id} type="button" onClick={() => { setSelectedCategoryId(c.id); setIsCategoryOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-between first:rounded-t-xl last:rounded-b-xl">
                                                            <span className="font-medium">{c.name}</span>
                                                            {selectedCategoryId === c.id && <Check className="w-4 h-4 text-red-600" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <input name="image_url" placeholder="Image URL (Optional)" className="border border-gray-200 bg-gray-50 p-3 rounded-xl text-base md:text-sm focus:bg-white focus:ring-2 focus:ring-red-600 outline-none transition-all" />
                                    <input name="description" placeholder="Description" className="border border-gray-200 bg-gray-50 p-3 rounded-xl text-base md:text-sm focus:bg-white focus:ring-2 focus:ring-red-600 outline-none transition-all md:col-span-2" />
                                    <button className="bg-slate-900 text-white py-3 rounded-xl font-bold md:col-span-2 hover:bg-slate-800 hover:shadow-lg transition-all active:scale-[0.99] text-base">Create Product</button>
                                </form>
                            </div>

                            {/* Product List - Responsive Div Layout */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Desktop Header */}
                                <div className="hidden md:grid grid-cols-[50px_2fr_1fr_auto] gap-4 p-4 bg-gray-50 border-b font-semibold text-gray-600 text-sm">
                                    <div className="text-center">#</div>
                                    <div>Product Details</div>
                                    <div>Status</div>
                                    <div className="text-right">Actions</div>
                                </div>

                                <div className="divide-y">
                                    {data.products.map((product) => (
                                        <Fragment key={product.id}>
                                            <div className={`transition-colors ${!product.is_active ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}>
                                                {/* Responsive Row Content */}
                                                <div className="p-4 flex flex-col md:grid md:grid-cols-[50px_2fr_1fr_auto] gap-4 items-center">

                                                    {/* Expand Toggle */}
                                                    <div className="hidden md:flex justify-center">
                                                        <button onClick={() => toggleProductExpand(product.id)} className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors">
                                                            {expandedProductId === product.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                        </button>
                                                    </div>

                                                    {/* Product Info */}
                                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                                        <div className="w-16 h-16 md:w-12 md:h-12 bg-gray-100 rounded-lg overflow-hidden relative shrink-0 shadow-inner">
                                                            <Image src={product.image_url || '/placeholder.png'} alt={product.name} fill className="object-cover" sizes="64px" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-gray-900 text-lg md:text-base">{product.name}</div>
                                                            <div className="text-xs text-gray-500 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded mt-1">
                                                                {data.categories.find(c => c.id === product.category_id)?.name}
                                                            </div>
                                                        </div>
                                                        {/* Mobile Toggle Button */}
                                                        <div className="md:hidden">
                                                            <button onClick={() => toggleProductExpand(product.id)} className="p-2 bg-gray-100 rounded-full text-gray-600">
                                                                {expandedProductId === product.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Status & Details */}
                                                    <div className="w-full md:w-auto flex justify-between md:block items-center">
                                                        <div className="text-sm text-gray-600">
                                                            <span className="md:hidden font-medium text-gray-400 mr-2">Variants:</span>
                                                            {product.variants?.length || 0}
                                                        </div>
                                                        <div className="md:hidden text-sm text-gray-500 max-w-[150px] truncate">{product.description}</div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-dashed">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-gray-400 uppercase md:hidden">Active</span>
                                                            <StatusToggle isActive={product.is_active} onToggle={async () => { await updateProductStatus(product.id, !product.is_active); loadData(); }} />
                                                        </div>
                                                        <button onClick={async () => { if (confirm('Delete?')) { await deleteProduct(product.id); loadData(); } }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
                                                            <Trash2 className="w-4 h-4" />
                                                            <span className="md:hidden text-xs font-bold">Delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* EXPANDED ROW (Responsive Div) */}
                                            {expandedProductId === product.id && (
                                                <div className="bg-gray-50/80 shadow-inner p-4 md:p-6 border-b">
                                                    <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-6">

                                                        {/* LEFT: Variants Management */}
                                                        <div className="flex-1 bg-white border rounded-2xl p-5 shadow-sm">
                                                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
                                                                <Layers className="w-4 h-4 text-blue-600" /> Manage Variants
                                                            </h4>
                                                            <div className="space-y-4">
                                                                {/* Mobile-Friendly List of Variants */}
                                                                <div className="space-y-3">
                                                                    <div className="hidden md:grid grid-cols-[1fr_1fr_100px_auto] gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider pb-2 border-b">
                                                                        <div>Option Name</div>
                                                                        <div>Detail</div>
                                                                        <div>Price</div>
                                                                        <div className="text-right">Action</div>
                                                                    </div>

                                                                    {product.variants?.map(v => (
                                                                        <div key={v.id} className="group md:grid md:grid-cols-[1fr_1fr_100px_auto] gap-2 items-center bg-gray-50 md:bg-white p-3 md:p-0 rounded-xl md:rounded-none border md:border-0 md:border-b md:pb-2 last:border-0">
                                                                            {editingVariantId === v.id ? (
                                                                                <>
                                                                                    <div className="mb-2 md:mb-0">
                                                                                        <label className="text-[10px] uppercase font-bold text-gray-400 md:hidden block mb-1">Option</label>
                                                                                        <input form={`form-${v.id}`} name="size" defaultValue={v.size} className="border border-blue-300 rounded-lg p-2 w-full text-sm bg-blue-50 focus:bg-white" />
                                                                                    </div>
                                                                                    <div className="mb-2 md:mb-0">
                                                                                        <label className="text-[10px] uppercase font-bold text-gray-400 md:hidden block mb-1">Detail</label>
                                                                                        <input form={`form-${v.id}`} name="crust" defaultValue={v.crust} className="border border-blue-300 rounded-lg p-2 w-full text-sm bg-blue-50 focus:bg-white" />
                                                                                    </div>
                                                                                    <div className="mb-2 md:mb-0">
                                                                                        <label className="text-[10px] uppercase font-bold text-gray-400 md:hidden block mb-1">Price</label>
                                                                                        <input form={`form-${v.id}`} name="price" type="number" defaultValue={v.price} className="border border-blue-300 rounded-lg p-2 w-full text-sm bg-blue-50 focus:bg-white" />
                                                                                    </div>
                                                                                    <div className="flex gap-2 justify-end mt-2 md:mt-0">
                                                                                        <form id={`form-${v.id}`} action={async (formData) => { await updateVariant(formData); setEditingVariantId(null); loadData(); }} className="hidden"><input type="hidden" name="id" value={v.id} /></form>
                                                                                        <button type="submit" form={`form-${v.id}`} className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200"><Save className="w-4 h-4" /></button>
                                                                                        <button onClick={() => setEditingVariantId(null)} className="bg-gray-100 text-gray-500 p-2 rounded-lg hover:bg-gray-200"><X className="w-4 h-4" /></button>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <div className="flex justify-between md:block mb-1 md:mb-0">
                                                                                        <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Option</span>
                                                                                        <span className="font-medium text-gray-800">{v.size}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between md:block mb-1 md:mb-0">
                                                                                        <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Detail</span>
                                                                                        <span className="text-sm text-gray-500">{v.crust}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-between md:block mb-2 md:mb-0">
                                                                                        <span className="md:hidden text-xs text-gray-400 font-bold uppercase">Price</span>
                                                                                        <span className="font-medium text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">${(v.price / 100).toFixed(2)}</span>
                                                                                    </div>
                                                                                    <div className="flex justify-end gap-2 pt-2 md:pt-0 border-t md:border-0 border-dashed">
                                                                                        <button onClick={() => setEditingVariantId(v.id)} className="text-blue-500 p-1 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                                                                                        <button onClick={async () => { if (confirm('Remove?')) { await deleteVariant(v.id); loadData(); } }} className="text-red-400 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200 mt-4">
                                                                    <div className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                                                                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px]"><Plus className="w-3 h-3" /></div>
                                                                        Add New Variant
                                                                    </div>
                                                                    <form action={async (formData) => { await createVariant(formData); loadData(); }} className="flex flex-col md:flex-row gap-3">
                                                                        <input type="hidden" name="product_id" value={product.id} />
                                                                        <input name="size" placeholder="Name (e.g. Large)" className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200" required />
                                                                        <input name="crust" placeholder="Detail (Optional)" className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200" />
                                                                        <input name="price" type="number" placeholder="Cents" className="w-full md:w-24 border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-slate-200" required />
                                                                        <button className="bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">Add</button>
                                                                    </form>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* RIGHT: Add-ons Configuration */}
                                                        <div className="flex-1 bg-white border rounded-2xl p-5 shadow-sm">
                                                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3">
                                                                <Utensils className="w-4 h-4 text-orange-500" /> Enabled Add-ons
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {(!data.addonGroups || data.addonGroups.length === 0) && <div className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl">No add-ons created. Go to 'Add-ons' tab.</div>}
                                                                {(data.addonGroups || []).map(group => {
                                                                    // @ts-ignore
                                                                    const isLinked = product.product_addon_groups?.some(pag => pag.group_id === group.id);

                                                                    return (
                                                                        <label key={group.id} className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${isLinked ? 'bg-orange-50 border-orange-200 shadow-sm' : 'hover:bg-gray-50 border-gray-100'}`}>
                                                                            <div className="flex items-center gap-3">
                                                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isLinked ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-300'}`}>
                                                                                    {isLinked && <Check className="w-3.5 h-3.5 text-white" />}
                                                                                </div>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isLinked}
                                                                                    onChange={async (e) => {
                                                                                        await toggleProductAddonGroup(product.id, group.id, e.target.checked);
                                                                                        loadData();
                                                                                    }}
                                                                                    className="hidden"
                                                                                />
                                                                                <div>
                                                                                    <div className={`font-bold text-sm ${isLinked ? 'text-orange-900' : 'text-gray-700'}`}>{group.name}</div>
                                                                                    <div className="text-xs text-gray-500 capitalize">{group.type} • {group.is_required ? 'Required' : 'Optional'}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-[10px] font-bold bg-white/50 px-2 py-1 rounded-md text-gray-500 border border-gray-100">{group.addons?.length || 0} items</div>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Add-ons' && data && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Create Group Form */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4 text-slate-800">Create Add-on Group</h3>
                                <form
                                    id="create-group-form"
                                    action={async (formData) => {
                                        try {
                                            await createAddonGroup(formData);
                                            await loadData();
                                            const form = document.getElementById('create-group-form') as HTMLFormElement;
                                            if (form) form.reset();
                                            setSelectedAddonType('topping');
                                        } catch (error) {
                                            alert("Failed to create group.");
                                        }
                                    }}
                                    className="flex flex-col md:flex-row flex-wrap gap-4 items-end"
                                >
                                    <div className="w-full md:flex-1 min-w-[200px]">
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Group Name</label>
                                        <input name="name" placeholder="e.g. Extra Toppings" className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-xl text-base md:text-sm focus:bg-white outline-none focus:ring-2 focus:ring-slate-200" required />
                                    </div>

                                    {/* Custom Type Dropdown */}
                                    <div className="w-full md:w-36 relative">
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Type</label>
                                        <input type="hidden" name="type" value={selectedAddonType} />
                                        <button
                                            type="button"
                                            onClick={() => setIsAddonTypeOpen(!isAddonTypeOpen)}
                                            className="w-full flex items-center justify-between border border-gray-200 bg-gray-50 p-2.5 rounded-xl text-base md:text-sm focus:bg-white focus:ring-2 focus:ring-slate-200 outline-none transition-all capitalize"
                                        >
                                            <span>{selectedAddonType}</span>
                                            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isAddonTypeOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {isAddonTypeOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsAddonTypeOpen(false)} />
                                                <div className="absolute z-20 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-100">
                                                    {['topping', 'side', 'drink'].map(type => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => { setSelectedAddonType(type); setIsAddonTypeOpen(false); }}
                                                            className="w-full text-left px-4 py-2.5 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-between first:rounded-t-xl last:rounded-b-xl capitalize"
                                                        >
                                                            <span className="font-medium">{type}</span>
                                                            {selectedAddonType === type && <Check className="w-3.5 h-3.5 text-red-600" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex gap-4 w-full md:w-auto">
                                        <div className="w-20 flex-1 md:flex-none">
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Min</label>
                                            <input name="min_select" type="number" defaultValue="0" className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-xl text-base md:text-sm focus:bg-white outline-none focus:ring-2 focus:ring-slate-200" />
                                        </div>
                                        <div className="w-20 flex-1 md:flex-none">
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Max</label>
                                            <input name="max_select" type="number" defaultValue="5" className="w-full border border-gray-200 bg-gray-50 p-2.5 rounded-xl text-base md:text-sm focus:bg-white outline-none focus:ring-2 focus:ring-slate-200" />
                                        </div>
                                    </div>

                                    <div className="pb-3 flex items-center gap-2 w-full md:w-auto">
                                        <input type="checkbox" name="is_required" id="req" className="w-5 h-5 md:w-4 md:h-4 text-red-600 rounded focus:ring-red-600" />
                                        <label htmlFor="req" className="text-sm font-medium text-slate-700">Required?</label>
                                    </div>
                                    <button type="submit" className="w-full md:w-auto bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">Create</button>
                                </form>
                            </div>

                            {/* Groups List - Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(data.addonGroups || []).map(group => (
                                    <div key={group.id} className="bg-white border rounded-3xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                        <div className="p-4 border-b bg-gray-50/80 flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-lg">{group.name}</h4>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    <span className="text-[10px] uppercase font-extrabold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg tracking-wide">{group.type}</span>
                                                    <span className="text-[10px] uppercase font-extrabold bg-gray-200 text-gray-700 px-2 py-1 rounded-lg tracking-wide">
                                                        {group.min_select}-{group.max_select}
                                                    </span>
                                                    {group.is_required && <span className="text-[10px] uppercase font-extrabold bg-red-100 text-red-700 px-2 py-1 rounded-lg tracking-wide">Req</span>}
                                                </div>
                                            </div>
                                            <button onClick={async () => { if (confirm('Delete Group?')) { await deleteAddonGroup(group.id); loadData(); } }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                                        </div>

                                        <div className="p-4 flex-1 flex flex-col gap-3">
                                            {group.addons?.map(addon => (
                                                <div key={addon.id} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                                                    <span className="font-medium text-gray-700">{addon.name}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-slate-800">${(addon.price / 100).toFixed(2)}</span>
                                                        <button onClick={async () => { if (confirm('Remove Item?')) { await deleteAddon(addon.id); loadData(); } }} className="text-gray-300 hover:text-red-500"><X className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!group.addons || group.addons.length === 0) && <div className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl border border-dashed">No items yet</div>}
                                        </div>

                                        <div className="p-3 bg-gray-50 border-t mt-auto">
                                            <form action={async (formData) => { await createAddon(formData); loadData(); }} className="flex gap-2">
                                                <input type="hidden" name="group_id" value={group.id} />
                                                <input name="name" placeholder="Item Name" className="flex-1 text-xs border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white" required />
                                                <input name="price" type="number" placeholder="Cents" className="w-16 text-xs border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white" required />
                                                <button className="bg-white border hover:bg-slate-900 hover:text-white text-slate-700 px-3 rounded-lg text-xs font-bold transition-colors shadow-sm">+</button>
                                            </form>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Empty State */}
                            {(!data.addonGroups || data.addonGroups.length === 0) && (
                                <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border-2 border-dashed flex flex-col items-center justify-center">
                                    <div className="bg-gray-50 p-4 rounded-full mb-4">
                                        <Utensils className="w-10 h-10 opacity-30" />
                                    </div>
                                    <p className="font-medium text-lg text-gray-500">No add-on groups found.</p>
                                    <p className="text-sm mt-1 text-gray-400">Create one above to start upselling toppings, sides, or drinks.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Categories' && data && (
                        <div className="max-w-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4 text-slate-800">Add New Category</h3>
                                <form action={async (formData) => {
                                    await createCategory(formData.get('name') as string);
                                    loadData();
                                }} className="flex gap-3">
                                    <input name="name" placeholder="e.g., Desserts" className="flex-1 border border-gray-200 bg-gray-50 p-3 rounded-xl text-base md:text-sm focus:bg-white focus:ring-2 focus:ring-red-600 outline-none transition-all" required />
                                    <button className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">Add</button>
                                </form>
                            </div>

                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-gray-50 p-4 border-b font-semibold text-gray-600 text-sm flex items-center justify-between">
                                    <span>Existing Categories</span>
                                    <span className="text-xs text-gray-400 font-normal">Drag to reorder</span>
                                </div>
                                <div className="divide-y" ref={listRef}>
                                    {data.categories.map((cat, index) => (
                                        <div
                                            key={cat.id}
                                            data-category-index={index}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={handleDragOver}
                                            onDragEnter={(e) => handleDragEnter(e, index)}
                                            onDrop={handleDrop}
                                            onDragEnd={handleDragEnd}
                                            className={`p-4 flex justify-between items-center hover:bg-gray-50 group transition-all cursor-move touch-manipulation ${draggedCategoryIndex === index ? 'opacity-50 bg-gray-100 ring-2 ring-inset ring-slate-200' : ''}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* TOUCH TARGET */}
                                                <div
                                                    className="cursor-move p-2 -m-2 touch-none text-gray-300 hover:text-gray-500 active:text-slate-800 transition-colors"
                                                    onTouchStart={() => handleTouchStart(index)}
                                                    onTouchMove={handleTouchMove}
                                                    onTouchEnd={handleTouchEnd}
                                                >
                                                    <GripVertical className="w-6 h-6" />
                                                </div>
                                                <span className="font-medium text-slate-800 text-lg md:text-base">{cat.name}</span>
                                            </div>
                                            <button onClick={async () => { if (confirm('Delete?')) { await deleteCategory(cat.id); loadData(); } }} className="text-gray-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                                <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Settings' && data && (
                        <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
                                    <div className="bg-slate-100 p-2 rounded-lg text-slate-600"><Settings className="w-5 h-5" /></div>
                                    Store Configuration
                                </h3>
                                <form action={async (formData) => {
                                    await updateSettings(formData);
                                    loadData();
                                    alert('Settings Saved!');
                                }} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Restaurant Name</label>
                                        <input name="name" defaultValue={data.settings.name} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl text-base md:text-sm focus:bg-white focus:ring-2 focus:ring-red-600 outline-none transition-all" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Phone (WhatsApp)</label>
                                            <input name="phone" defaultValue={data.settings.phone} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl text-base md:text-sm focus:bg-white focus:ring-2 focus:ring-red-600 outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Currency Symbol</label>
                                            <input name="currency" defaultValue={data.settings.currency} className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl text-base md:text-sm focus:bg-white focus:ring-2 focus:ring-red-600 outline-none transition-all" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-500 uppercase mb-2 ml-1">Delivery Fee (Cents)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-gray-400 font-bold">$</span>
                                            <input type="number" name="delivery_fee_cents" defaultValue={data.settings.delivery_fee_cents} className="w-full border border-gray-200 bg-gray-50 p-3 pl-7 rounded-xl text-base md:text-sm focus:bg-white focus:ring-2 focus:ring-red-600 outline-none transition-all" />
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2 ml-1">Example: 299 = $2.99</p>
                                    </div>
                                    <div className="pt-4">
                                        <button className="w-full bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-slate-800 hover:shadow-lg transition-all active:scale-[0.99] text-base">
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

// --- Helper Components ---

function StatCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: any }) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center transition-transform hover:scale-[1.02]">
            <div>
                <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</div>
                <div className="text-3xl font-bold text-slate-800">{value}</div>
            </div>
            <div className="text-slate-900 bg-gray-50 p-4 rounded-2xl">
                <Icon className="w-6 h-6" />
            </div>
        </div>
    );
}

function StatusToggle({ isActive, onToggle }: { isActive: boolean, onToggle: () => void }) {
    return (
        <button onClick={onToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 ${isActive ? 'bg-green-500' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
}