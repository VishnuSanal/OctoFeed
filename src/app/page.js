'use client'

import Image from "next/image";
import { useSession } from 'next-auth/react';
import LoginButton from "../components/LoginButton";
import GitHubFeed from "../components/GitHubFeed";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐙</span>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              OctoFeed
            </h1>
          </div>
          
          {session && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {session.user.name}
                </span>
              </div>
              <LoginButton compact />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!session ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                  Welcome to OctoFeed
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  Stay updated with your GitHub activity feed. Sign in to see what's happening in your network.
                </p>
              </div>
              
              <div className="flex justify-center">
                <LoginButton />
              </div>
              
              <div className="pt-8 space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-500">Features:</p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>📝 Recent Events</span>
                  <span>🔀 Pull Requests</span>
                  <span>⭐ Stars</span>
                  <span>🍴 Forks</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <GitHubFeed />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Built with Next.js & NextAuth.js
            </p>
            <div className="flex gap-6 text-sm">
              <a
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Docs
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
