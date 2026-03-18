'use client'

import Image from "next/image";
import { useSession } from 'next-auth/react';
import LoginButton from "../components/LoginButton";
import ClassicFeed from "../components/ClassicFeed";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="text-white font-semibold text-lg flex items-center gap-2">
            <span className="text-2xl">🐙</span>
            OctoFeed
          </a>

          {session && (
            <div className="flex items-center gap-3">
              <Image
                src={session.user.image}
                alt={session.user.name}
                width={32}
                height={32}
                className="rounded-full"
              />
              <LoginButton compact />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {!session ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Sign in to view your feed
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Connect your GitHub account to see activity from people you follow.
              </p>
              <LoginButton />
            </div>
          </div>
        ) : (
          <ClassicFeed />
        )}
      </main>
    </div>
  );
}
