"use client";
import React, { useState } from "react";
import AuthButton from "../ui/AuthButton.jsx";
import { logIn } from "@/actions/auth";
import { useRouter } from "next/navigation";

const LogInForm = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = event.target;
    const formData = new FormData(form);

    const response = await logIn(formData);

    if (response.status === "success") {
      console.log("Login successful");
      router.push("/");
    } else {
      console.error("Login error:", response.status);
      setError(`${response.status}, remember to validate your email before logging in.`);
    }

    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium">
            Email
          </label>
          <input
            type="text"
            placeholder="Email"
            name="email"
            required
            className="mt-1 w-full px-4 p-2  h-10 rounded-md border border-gray-200 bg-white text-sm text-gray-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Password
          </label>
          <input
            type="password"
            placeholder="Password"
            name="password"
            required
            className="mt-1 w-full px-4 p-2  h-10 rounded-md border border-gray-200 bg-white text-sm text-gray-700"
          />
        </div>
        <div className="mt-4">
          <AuthButton type="Log in" loading={loading} />
        </div>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
};

export default LogInForm;