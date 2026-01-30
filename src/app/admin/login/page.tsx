'use client';
import { loginAction } from '@/lib/actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
    const router = useRouter();
    const [error, setError] = useState('');

    async function handleSubmit(formData: FormData) {
        const res = await loginAction(formData);
        if (res.success) {
            router.push('/admin');
        } else {
            setError(res.error || 'Login failed');
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-gray-100 sm:px-10">
                    <div className="text-center mb-8">
                        {/* <div className="text-4xl mb-2">🍕</div> */}
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Access</h1>
                        <p className="text-sm text-gray-500 mt-2">Authorized personnel only</p>
                    </div>

                    <form action={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Password</label>
                            <input
                                type="password"
                                name="password"
                                className="w-full border border-gray-200 p-3.5 rounded-xl text-base text-gray-900 focus:ring-2 focus:ring-slate-900 outline-none bg-gray-50 focus:bg-white transition-all placeholder:text-gray-400"
                                placeholder="Enter admin password"
                                required
                            />
                        </div>
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl font-medium flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        )}
                        <button className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-base hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]">
                            Login to Dashboard
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}