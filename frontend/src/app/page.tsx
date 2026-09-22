
import Link from "next/link";
import React from "react";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full h-[600px] bg-gray-100 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2000&auto=format&fit=crop')" }}
        ></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl sm:text-6xl font-serif text-gray-900 tracking-tight mb-6">
            Timeless Elegance
          </h1>
          <p className="text-lg sm:text-xl text-gray-800 mb-8 max-w-2xl mx-auto">
            Discover our curated collection of exquisite jewelry pieces crafted to perfection.
          </p>
          <Link
            href="/catalog"
            className="inline-block bg-gray-900 text-white px-8 py-3 text-sm font-medium uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Shop the Collection
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-serif text-center text-gray-900 mb-12">Featured Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Rings", image: "https://images.unsplash.com/photo-1605100804763-247f67130c28?q=80&w=600&auto=format&fit=crop" },
            { title: "Necklaces", image: "https://images.unsplash.com/photo-1599643478514-4a4e09b533f0?q=80&w=600&auto=format&fit=crop" },
            { title: "Earrings", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop" },
          ].map((category) => (
            <Link href="/catalog" key={category.title} className="group relative block h-80 overflow-hidden bg-gray-200">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${category.image})` }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 transition-opacity group-hover:bg-opacity-30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-serif text-white tracking-wider">{category.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

