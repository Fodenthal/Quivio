export default function ErrorPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-background to-background-light">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="text-red-400 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-4">Authentication Error</h1>
        <p className="text-white/70 mb-6">
          There was a problem with your authentication. This could be due to:
        </p>
        <ul className="text-white/60 text-sm text-left mb-6 space-y-1">
          <li>• Invalid or expired confirmation link</li>
          <li>• Incorrect email or password</li>
          <li>• Account verification required</li>
        </ul>
        <div className="space-y-3">
          <a
            href="/login"
            className="block w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </a>
          <a
            href="/"
            className="block w-full text-white/70 hover:text-white transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
