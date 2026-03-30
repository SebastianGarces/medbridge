import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-primary py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* CTA */}
        <h2 className="font-serif text-2xl md:text-3xl text-white font-medium mb-8">
          Ready to see it in action?
        </h2>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-secondary text-primary font-semibold text-sm hover:bg-accent transition-all duration-200 shadow-lg shadow-secondary/20"
        >
          Sign In
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Built with */}
        <p className="mt-12 text-white/40 text-sm">
          Built with LangGraph, FastAPI, Next.js &amp; React
        </p>
      </div>
    </footer>
  );
}
