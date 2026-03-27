"use client";

import SmartSearch from "./components/smart/SmartSearch";
export default function Home() {
  return (
    <div className="min-h-screen   p-6">
      {/* Hero — default component */}
      <div className="flex items-center justify-center py-16">
        <div className="w-full max-w-2xl flex flex-col gap-12">
          <SmartSearch
            className=""
            onSearch={(q, meta) => console.log("search:", q, meta)}
          />
        </div>
      </div>
    </div>
  );
}
