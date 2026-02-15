'use client'

import { useState, useEffect } from 'react'

export default function NotificationBanner({ message, type = 'info', onDismiss, autoHide = true }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoHide && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onDismiss?.()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoHide, onDismiss])

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  if (!isVisible) return null

  const typeStyles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
  }

  const typeIcons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full mx-4 sm:mx-0
      border rounded-xl p-4 shadow-lg backdrop-blur-sm
      transform transition-all duration-300 ease-out
      animate-slideIn
      ${typeStyles[type]}
    `}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">{typeIcons[type]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}