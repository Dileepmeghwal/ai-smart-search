"use client";

import { useState } from "react";
import SmartSearch from "../components/smart/SmartSearch";

export default function SmartSearchDemo() {
  return (
    <div className="p-8 space-y-12">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
        SmartSearch Demo
      </h1>

      <div className="w-full max-w-4xl space-y-6">
        {/* Default SmartSearch */}
        <SmartSearch />

        {/* Red-themed variant */}
        <SmartSearch
          inputWrapperClassName="border-red-900 bg-red-50"
          inputClassName="text-red-700 placeholder-red-400"
          badgeClassName="bg-red-500 text-white"
          ghostTextClassName="text-red-300"
        />
        
      </div>
    </div>
  );
}
