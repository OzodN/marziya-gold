import Link from 'next/link';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col min-h-screen">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
            Dashboard
          </Link>
          <Link href="/admin/products" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
            Products
          </Link>
          <Link href="/admin/inquiries" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
            Inquiries
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
