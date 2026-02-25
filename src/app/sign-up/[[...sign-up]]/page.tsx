import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex flex-col">
      {/* Header */}
      <nav className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/50">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-3 w-fit">
            <Image src="/logo.svg" alt="PulseIntel" width={32} height={32} />
            <span className="text-2xl font-bold text-white">PulseIntel</span>
          </Link>
        </div>
      </nav>

      {/* Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Get started for free</h1>
            <p className="text-slate-400">Create your PulseIntel account</p>
          </div>
          
          <SignUp 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-slate-900/80 backdrop-blur-sm shadow-2xl border border-slate-800",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "bg-slate-800 border-slate-700 hover:bg-slate-750 text-white",
                socialButtonsBlockButtonText: "text-white font-medium",
                formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
                footerActionLink: "text-indigo-400 hover:text-indigo-300",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-indigo-400",
                formFieldLabel: "text-slate-300",
                formFieldInput: "bg-slate-800 border-slate-700 text-white",
                footerActionText: "text-slate-400",
                dividerLine: "bg-slate-700",
                dividerText: "text-slate-500",
                formFieldInputShowPasswordButton: "text-slate-400 hover:text-white",
                otpCodeFieldInput: "bg-slate-800 border-slate-700 text-white",
                formResendCodeLink: "text-indigo-400 hover:text-indigo-300",
                alertText: "text-slate-300",
                logoBox: "hidden"
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
                shimmer: true
              }
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/onboarding"
          />

          <div className="text-center mt-6">
            <p className="text-slate-500 text-sm">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
