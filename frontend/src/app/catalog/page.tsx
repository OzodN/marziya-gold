export const dynamic = 'force-dynamic';

import React from "react";
import Image from "next/image";
import { AddToCartButton } from "../../components/AddToCartButton";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock: number;
  image_url: string;
}

interface ProductsResponse {
  data: Product[];
  total?: number;
}

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch("http://localhost:8080/api/v1/public/products", {
      cache: "no-store",
    });
    
    if (!res.ok) {
      console.error("Failed to fetch products:", res.status);
      return [];
    }
    
    const data = await res.json();
    if (Array.isArray(data)) {
      return data;
    } else if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function CatalogPage() {
  const products = await getProducts();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-serif text-gray-900">Our Collection</h1>
          <p className="mt-2 text-gray-600">Discover our carefully curated selection of jewelry.</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No products available at the moment. Please check back later.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {products.map((product) => (
            <div key={product.id} className="group relative">
              <div className="aspect-w-4 aspect-h-5 w-full overflow-hidden rounded-lg bg-gray-100">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover object-center group-hover:opacity-75"
                  />
                ) : (
                  <div className="h-64 w-full bg-gray-200 flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    <a href={`/catalog/${product.id}`}>
                      <span aria-hidden="true" className="absolute inset-0" />
                      {product.name}
                    </a>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{product.description?.substring(0, 50)}...</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {product.currency === "USD" ? "$" : ""}
                  {product.price}
                  {product.currency !== "USD" ? ` ${product.currency}` : ""}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                 <AddToCartButton productId={product.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


