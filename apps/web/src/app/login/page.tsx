import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-background to-background-light">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Quivio</h1>
          <p className="text-white/70">Sign in to save your progress and compete with friends</p>
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

          <div className="space-y-3">
            <button 
              formAction={login}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Sign In
            </button>
            
            <button 
              formAction={signup}
              className="w-full bg-white/10 text-white py-3 px-4 rounded-lg font-semibold hover:bg-white/20 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 transition-colors border border-white/20"
            >
              Create Account
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-white/20 text-center">
          <p className="text-white/70 text-sm mb-3">
            Want to play without an account?
          </p>
          <a
            href="/"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Continue as Guest
          </a>
        </div>
      </div>
    </div>
  )
}
