
"use client";

import React from "react";
import { useCart } from "../store/CartContext";

export const AddToCartButton = ({ productId }: { productId: string }) => {
  const { addToCart } = useCart();

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        addToCart(productId, 1);
        // Optional: show a toast or feedback here
      }}
      className="w-full bg-gray-900 text-white py-2 px-4 text-sm font-medium hover:bg-gray-800 transition-colors relative z-10"
    >
      Add to Cart
    </button>
  );
};

