import React from "react";
import { 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  MessageSquare, 
  Layers, 
  Lock,
  ArrowRight,
  Loader2
} from "lucide-react";

interface LandingViewProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export function LandingView({ onSignIn, isLoading, errorMessage }: LandingViewProps) {
  return (
    <div id="landing-page" className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col justify-between selection:bg-stone-200">
      {/* Header Navigation */}
      <header id="landing-header" className="w-full border-b border-[#EAE4DC] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2D3B2C] text-[#FAF8F5] flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-200" />
            </div>
            <span className="font-serif italic text-xl tracking-tight text-stone-900 font-medium">
              Prism
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="landing-signin-nav-btn"
              onClick={onSignIn}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-1.5 text-xs tracking-wide uppercase font-semibold text-stone-700 hover:text-stone-950 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : null}
              Sign In
            </button>
            <button
              id="landing-cta-nav-btn"
              onClick={onSignIn}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-md bg-[#2D3B2C] text-[#FAF8F5] hover:bg-[#1E281D] transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main id="landing-hero-section" className="flex-1 max-w-4xl mx-auto px-6 py-16 md:py-20 flex flex-col items-center text-center">
        {/* Subtle Security Badge */}
        <div id="security-badge" className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0EBE1] border border-[#DFD7CB] text-[11px] font-medium text-stone-700 mb-8">
          <ShieldCheck className="w-3.5 h-3.5 text-[#3A4D39]" />
          <span>Firebase Auth & Firestore Isolated Storage</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-6xl font-serif tracking-tight text-stone-950 max-w-3xl leading-[1.12] mb-6 font-normal">
          Mindful reflections, framed with <span className="italic font-serif">editorial clarity.</span>
        </h1>

        <p className="text-base md:text-lg text-stone-600 max-w-xl font-normal leading-relaxed mb-10 font-sans">
          A private sanctuary to pen your thoughts, explore multi-turn reflections with Gemini AI, and cultivate clarity with strictly isolated cloud storage.
        </p>

        {/* Error notification if any */}
        {errorMessage && (
          <div id="auth-error-banner" className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg max-w-md w-full">
            {errorMessage}
          </div>
        )}

        {/* Auth Action Card */}
        <div id="auth-action-card" className="w-full max-w-sm p-7 bg-white border border-[#E2DDD5] rounded-xl shadow-xs text-center">
          <h2 className="text-base font-serif font-semibold text-stone-900 mb-1">
            Access Your Private Journal
          </h2>
          <p className="text-xs text-stone-500 mb-6 font-sans">
            Authenticate securely using Google Sign-In. No passwords stored.
          </p>

          <button
            id="google-signin-button"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#2D3B2C] hover:bg-[#1E281D] text-[#FAF8F5] rounded-lg font-medium text-xs tracking-wide uppercase transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                <span>Authenticating with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
            <Lock className="w-3 h-3 text-stone-400" />
            <span>End-to-end user-bound Firestore documents</span>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div id="features-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left max-w-4xl w-full">
          <div className="p-6 bg-white rounded-xl border border-[#E2DDD5] shadow-2xs">
            <div className="w-8 h-8 rounded-md bg-[#F0EBE1] text-[#3A4D39] flex items-center justify-center mb-3">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-medium text-stone-900 text-sm mb-1">
              Multi-Turn Deep Conversations
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Explore your thoughts continuously with Gemini 3.6 Flash. Brainstorm, unpack complex situations, and gain clarity with empathetic AI guidance.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-[#E2DDD5] shadow-2xs">
            <div className="w-8 h-8 rounded-md bg-[#F0EBE1] text-[#3A4D39] flex items-center justify-center mb-3">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-medium text-stone-900 text-sm mb-1">
              Intelligent Summarization & Modes
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Automatically extract executive summaries, action steps, themes, and tags from lengthy journal entries with one click.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-[#E2DDD5] shadow-2xs">
            <div className="w-8 h-8 rounded-md bg-[#F0EBE1] text-[#3A4D39] flex items-center justify-center mb-3">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-medium text-stone-900 text-sm mb-1">
              Strict User-Isolated Storage
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Every thought is persisted under your authenticated Firebase UID. Cloud Firestore security rules prohibit any cross-user leakage.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="landing-footer" className="w-full border-t border-[#EAE4DC] py-6 text-center text-xs text-stone-500 font-sans">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Prism. Powered by Gemini API & Firebase Firestore.</p>
          <div className="flex items-center gap-4 text-stone-400 text-[11px]">
            <span>Client-Server Security Isolation</span>
            <span>•</span>
            <span>Zero Password Storage</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
