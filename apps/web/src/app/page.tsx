import { MSG } from '@shared';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          PopReplay - Fresh Start ✨
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🎉 Setup Complete!
          </h2>
          <p className="text-gray-600 mb-4">
            Your fresh Next.js client is ready and connected to the shared packages.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            📡 Shared Package Integration Test
          </h3>
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-medium">Chat Message Type:</span> 
              <code className="bg-gray-100 px-2 py-1 rounded ml-2">{MSG.CHAT}</code>
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Player Ready Type:</span> 
              <code className="bg-gray-100 px-2 py-1 rounded ml-2">{MSG.PLAYER_READY}</code>
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Submit Guess Type:</span> 
              <code className="bg-gray-100 px-2 py-1 rounded ml-2">{MSG.SUBMIT_GUESS}</code>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            🚀 Ready to Build
          </h3>
          <ul className="space-y-2 text-gray-600">
            <li>✅ Next.js 15 with App Router</li>
            <li>✅ React 19</li>
            <li>✅ TypeScript</li>
            <li>✅ Tailwind CSS</li>
            <li>✅ Colyseus.js client</li>
            <li>✅ Shared types and constants</li>
            <li>✅ Server integration ready</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500">
            Server intact • Shared package connected • Ready for game UI development
          </p>
        </div>
      </div>
    </div>
  );
}
