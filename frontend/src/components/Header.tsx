
"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "../store/CartContext";

export const Header = () => {
  const { cartTotalItems } = useCart();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-serif text-gray-900 tracking-wide">
              LUMIÈRE
            </Link>
          </div>
          <nav className="hidden sm:flex space-x-8">
            <Link href="/catalog" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              Collections
            </Link>
            <Link href="#" className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium">
              About Us
            </Link>
          </nav>
          <div className="flex items-center">
            <button className="text-gray-700 hover:text-gray-900 p-2 relative">
              <span className="sr-only">Cart</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartTotalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                  {cartTotalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

