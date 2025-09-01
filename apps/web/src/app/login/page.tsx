'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login, signup } from './actions'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [ageError, setAgeError] = useState('')

  // Calculate age and validate 13+ requirement
  const validateAge = () => {
    if (mode === 'signin') return true // No age check for sign in
    
    if (!birthMonth || !birthDay || !birthYear) {
      setAgeError('Please enter your complete date of birth')
      return false
    }

    const today = new Date()
    const birthDate = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay))
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    // Adjust age if birthday hasn't occurred this year
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
      ? age - 1 
      : age

    if (actualAge < 13) {
      setAgeError('You must be at least 13 years old to create an account')
      return false
    }

    setAgeError('')
    return true
  }

  const handleFormSubmit = (action: (formData: FormData) => void) => {
    return (formData: FormData) => {
      if (!validateAge()) return
      
      // Add birth year to form data for signup
      if (mode === 'signup') {
        formData.append('birthYear', birthYear)
      }
      
      action(formData)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-background to-background-light">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Quivio</h1>
          <p className="text-white/70">
            {mode === 'signin' 
              ? 'Sign in to save your progress and compete with friends'
              : 'Create an account to save your progress and chat with other players'
            }
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-white/5 rounded-lg p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'signin'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'signup'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        <form className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
              Email
            </label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none backdrop-blur-sm"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
              Password
            </label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none backdrop-blur-sm"
              placeholder="Enter your password"
            />
          </div>

          {/* Age verification for signup */}
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Date of Birth <span className="text-red-400">*</span>
              </label>
              <p className="text-xs text-white/60 mb-3">
                You must be at least 13 years old to create an account
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="birthMonth" className="sr-only">Month</label>
                  <select
                    id="birthMonth"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    required={mode === 'signup'}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none backdrop-blur-sm"
                  >
                    <option value="" className="bg-gray-800">Month</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-gray-800">
                        {new Date(0, i).toLocaleString('default', { month: 'short' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="birthDay" className="sr-only">Day</label>
                  <select
                    id="birthDay"
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    required={mode === 'signup'}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none backdrop-blur-sm"
                  >
                    <option value="" className="bg-gray-800">Day</option>
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-gray-800">
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="birthYear" className="sr-only">Year</label>
                  <select
                    id="birthYear"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    required={mode === 'signup'}
                    className="w-full px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none backdrop-blur-sm"
                  >
                    <option value="" className="bg-gray-800">Year</option>
                    {Array.from({ length: 100 }, (_, i) => {
                      const year = new Date().getFullYear() - i
                      return (
                        <option key={year} value={year} className="bg-gray-800">
                          {year}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
              {ageError && (
                <p className="mt-2 text-sm text-red-400">{ageError}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {mode === 'signin' ? (
              <button 
                formAction={handleFormSubmit(login)}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Sign In
              </button>
            ) : (
              <button 
                formAction={handleFormSubmit(signup)}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Create Account
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <p className="text-white/70 text-sm mb-3">
            Want to play without an account?
          </p>
          <Link
            href="/"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Continue as Guest
          </Link>
        </div>
      </div>
    </div>
  )
}
