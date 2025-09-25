"use client";

import { logOut } from "@/actions/auth";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const LogOut = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      logOut();
      router.push("/");
    } catch (error) {
      console.error("Error during logout:", error);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-600 text-white text-sm px-4 py-2 rounded-md cursor-pointer hover:bg-gray-700 transition">
      <form onSubmit={handleLogout}>
        <button type="submit" disabled={loading} className="w-full text-left">
          {loading ? "Logging out..." : "Log Out"}
        </button>
      </form>
    </div>
  );
};

export default LogOut;