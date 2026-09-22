
import React from "react";

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="text-2xl font-serif tracking-wide">LUMIÈRE</span>
            <p className="mt-4 text-gray-400 text-sm">
              Crafting timeless elegance and preserving the beauty of moments through exquisite jewelry.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase">Customer Service</h3>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-white">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-white">Care Guide</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase">Stay in touch</h3>
            <p className="mt-4 text-gray-400 text-sm">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Lumière Jewelry. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

