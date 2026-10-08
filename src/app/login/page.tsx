"use client";

import React, { useState, type FormEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/Button";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      router.replace("/");
    } catch {
      
    }
  };

  return (
    <div className="bg-linear-to-br from-primary-600 to-primary-700 min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
      <div className="hidden lg:flex items-center justify-center relative">
      </div>

      <div className="flex items-center justify-center p-6 z-20">
        <div className="w-full max-w-120 bg-linear-to-b from-primary-100 via-white to-white flex flex-col items-center rounded-3xl shadow-2xl overflow-hidden pb-12 pt-8 relative">
          
          <div className="w-full mb-6 opacity-80 mix-blend-multiply">
            <Image 
              src="/images/login/map.png" 
              alt="Map" 
              width={400} 
              height={200}
              className="w-full h-auto object-contain"
            />
          </div>

          <form onSubmit={handleSubmit} className="w-full px-12 flex flex-col items-center z-10">
            <h1 className="text-primary-600 font-bold text-h4 mb-10 text-center">
              Selamat Datang!
            </h1>

            {error && (
              <div className="w-full mb-4 bg-red-50 border border-red-200 text-red-600 text-body-3 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            
            <div className="flex flex-col w-full gap-5">
              <input 
                type="text" 
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) clearError();
                }}
                className="w-full bg-neutral-50 border border-transparent text-neutral-900 py-3.5 px-5 rounded-xl text-body-2 transition-all placeholder:text-neutral-400 focus:bg-white focus:border-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-600/10" 
                placeholder="Username"
                required
                autoComplete="username"
                disabled={isLoading}
              />
              
              <div className="relative w-full">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) clearError();
                  }}
                  className="w-full bg-neutral-50 border border-transparent text-neutral-900 py-3.5 pl-5 pr-12 rounded-xl text-body-2 transition-all placeholder:text-neutral-400 focus:bg-white focus:border-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-600/10" 
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary-600 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              
              <Button 
                type="submit"
                variant="solid" 
                color="primary" 
                size="L" 
                className="font-bold w-full rounded-xl mt-4"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Log In"}
              </Button>
            </div>
          </form>
          
        </div>
      </div>

      <div className="absolute -bottom-10 -left-10 lg:-left-20 lg:bottom-0 w-full max-w-300 z-10 pointer-events-none">
        <Image src="/images/login/flag.png" alt="Flag Bottom" width={1200} height={600} className="w-full h-auto object-contain" />
      </div>

    </div>
  );
}
