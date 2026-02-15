'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Image from 'next/image'

export default function LoginButton({ compact = false }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-200 dark:border-purple-800"></div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent absolute inset-0"></div>
        </div>
      </div>
    )
  }

  if (session) {
    if (compact) {
      return (
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      )
    }

    return (
      <div className="flex flex-col items-center gap-6 p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="relative">
            <Image
              src={session.user.image}
              alt="Profile"
              width={48}
              height={48}
              className="rounded-full ring-2 ring-purple-200 dark:ring-purple-800"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-lg">
              Welcome back, {session.user.name}!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {session.user.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    )
  }

  if (compact) {
    return (
      <button
        onClick={() => signIn('github')}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-700 dark:to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-700 dark:hover:from-gray-600 dark:hover:to-gray-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 font-medium"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
        </svg>
        Sign in
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="text-center space-y-2">
        <div className="text-4xl mb-3">🚀</div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Ready to explore?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">Connect your GitHub account to get started</p>
      </div>
      <button
        onClick={() => signIn('github')}
        className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 text-white rounded-xl hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 dark:hover:from-gray-600 dark:hover:via-gray-700 dark:hover:to-gray-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-lg"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
        </svg>
        Sign in with GitHub
        <div className="ml-1 opacity-75">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
          </svg>
        </div>
      </button>
    </div>
  )
}