'use client'

import Image from "next/image";
import { useState } from "react";
import { useSession } from 'next-auth/react';
import LoginButton from "../components/LoginButton";
import GitHubFeed from "../components/GitHubFeed";
import ClassicFeed from "../components/ClassicFeed";

export default function Home() {
  const { data: session, status } = useSession();
  const [feedMode, setFeedMode] = useState("default"); // "default" | "classic"

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="text-3xl animate-pulse">🐙</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                OctoFeed
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your GitHub Activity</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Feed Mode Toggle */}
            {session && (
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setFeedMode("default")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    feedMode === "default"
                      ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  All Events
                </button>
                <button
                  onClick={() => setFeedMode("classic")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    feedMode === "classic"
                      ? "bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Classic
                </button>
              </div>
            )}

            {session && (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                  <div className="relative">
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full ring-2 ring-white dark:ring-gray-700"
                    />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {session.user.name}
                    </span>
                  </div>
                </div>
                <LoginButton compact />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!session ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center space-y-10 max-w-2xl mx-auto">
              <div className="space-y-6">
                <div className="relative">
                </div>
              </div>

              <div className="flex justify-center">
                <div className="transform hover:scale-105 transition-transform duration-200">
                  <LoginButton />
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div>
            {feedMode === "classic" ? <ClassicFeed /> : <GitHubFeed />}
          </div>
        )}
      </main>
    </div>
  );
}
