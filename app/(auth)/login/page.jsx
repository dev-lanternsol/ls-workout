import LogInForm from '@/components/layout/LogInForm'
import Link from "next/link";
import React from "react";

export default function LoginPage() {
  return (
    <div className="w-full flex mt-20 justify-center">
      <section className="flex flex-col w-[400px]">
        <h1 className="text-3xl w-full text-center font-bold mb-6">Log In</h1>
        <LogInForm />
        <div className="mt-2 flex items-center">
          <h1>You don't have an account?</h1>
          <Link className="font-bold ml-2" href="/register">
            Sign Up
          </Link>
        </div>
      </section>
    </div>
  )
}