import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔍 PulseIntel</h1>
          <p className="text-slate-400">AI-Powered Competitive Intelligence</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-slate-900 shadow-xl border border-slate-800"
            }
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}
