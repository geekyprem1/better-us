import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FAQ } from "@/components/FAQ";
import { TrackOnMount } from "@/components/TrackOnMount";
import { EVENTS } from "@/lib/analytics";

const benefits = [
  {
    icon: "🔍",
    title: "See the real picture",
    body: "A clear, science-informed read on trust, communication, connection, and intimacy — no guessing.",
  },
  {
    icon: "🧠",
    title: "AI relationship analysis",
    body: "Get a professional-grade breakdown of your strengths, risks, and what to work on first.",
  },
  {
    icon: "🗺️",
    title: "Personalized recovery plans",
    body: "7, 30, and 90-day plans with daily actions, conversation scripts, and trust-building exercises.",
  },
  {
    icon: "💬",
    title: "An AI coach, 24/7",
    body: "Talk through hard moments and get calm, practical guidance whenever you need it.",
  },
];

const steps = [
  { n: 1, title: "Take the 5-minute assessment", body: "40 honest questions across the four pillars of a healthy relationship." },
  { n: 2, title: "Get your health scores", body: "Beautiful dashboard cards show exactly where you stand today." },
  { n: 3, title: "Receive your AI analysis & plan", body: "A personalized report plus 7/30/90-day recovery plans you can start tonight." },
];

const testimonials = [
  {
    quote: "We'd been drifting for two years. BetterUs put words to what was wrong and gave us a plan we actually followed.",
    name: "Aarav & Meera",
    tag: "Together 6 years",
  },
  {
    quote: "The communication scripts felt like having a therapist in my pocket. Our fights stopped spiraling.",
    name: "Sofia",
    tag: "Engaged",
  },
  {
    quote: "I was skeptical about an 'AI coach' but it genuinely helped me say the things I couldn't.",
    name: "Daniel",
    tag: "Married 11 years",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <TrackOnMount event={EVENTS.LANDING_VIEW} />
      <Navbar />

      {/* Hero */}
      <section className="bg-aurora">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 animate-fade-up">
            ⭐ Trusted by couples rebuilding their connection
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-6xl animate-fade-up">
            Discover What's Really Happening in Your Relationship
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 animate-fade-up">
            Take a 5-minute relationship assessment and get an AI-powered personalized recovery
            plan.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up">
            <Link
              href="/assessment"
              className="w-full rounded-full bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700 sm:w-auto"
            >
              Take Free Assessment
            </Link>
            <Link
              href="/#how"
              className="w-full rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">No credit card required · 100% private</p>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to turn things around
          </h2>
          <p className="mt-4 text-slate-600">
            Clarity, a plan, and support — built on relationship science.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-2xl">
                {b.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-soft">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-slate-600">Three simple steps. About five minutes.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative rounded-2xl bg-white p-8 shadow-sm">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {s.n}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/assessment"
              className="inline-block rounded-full bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700"
            >
              Take Free Assessment
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Couples are finding their way back
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
              <div className="text-accent-500">★★★★★</div>
              <blockquote className="mt-4 text-slate-700">“{t.quote}”</blockquote>
              <figcaption className="mt-5 text-sm">
                <span className="font-semibold text-slate-900">{t.name}</span>
                <span className="text-slate-400"> · {t.tag}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-soft">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <div className="mt-10">
            <FAQ />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-16 text-center text-white shadow-xl">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Your relationship deserves clarity
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">
            Take the free assessment and see exactly where you stand — and what to do next.
          </p>
          <Link
            href="/assessment"
            className="mt-8 inline-block rounded-full bg-white px-8 py-4 text-base font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50"
          >
            Take Free Assessment
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
