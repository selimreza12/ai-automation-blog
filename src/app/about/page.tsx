import { ShieldCheck, Code2, Zap, ArrowRight, User, Cpu } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'About Md. Selim Reza' };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-12 shadow-sm sm:px-10 sm:py-14 dark:border-dark-700 dark:bg-dark-900">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400">
            <User className="h-3.5 w-3.5" />
            The Architect
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
            Hi, I&apos;m Md. Selim Reza
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
            I am a Full-Stack Developer and AI Solutions Architect based in Rajshahi, Bangladesh. I help businesses, founders, and creators save hundreds of hours by building custom AI automations, internal web tools, and production-ready MVPs.
          </p>
        </div>
      </section>

      {/* PHILOSOPHY & PILLARS */}
      <section className="space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 sm:p-10 dark:border-dark-700 dark:bg-dark-800/50">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Cpu className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Engineering Philosophy</h2>
          </div>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Unlike traditional developers who take months to deploy, I leverage modern serverless architectures and advanced AI integrations (Google Gemini, Groq, Supabase, Make.com) to design, build, and deploy custom software solutions in <em>days</em>. My focus is strictly on speed, clean architecture, and measurable business ROI.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {/* Pillar 1 */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-brand-500/50 hover:shadow-md dark:border-dark-700 dark:bg-dark-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white dark:bg-dark-800 dark:text-brand-400 dark:group-hover:bg-brand-500 dark:group-hover:text-dark-900">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Rapid Deployment</h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">MVPs and automations conceptualized, built, and shipped to production in days, not months.</p>
          </div>
          {/* Pillar 2 */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-brand-500/50 hover:shadow-md dark:border-dark-700 dark:bg-dark-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white dark:bg-dark-800 dark:text-brand-400 dark:group-hover:bg-brand-500 dark:group-hover:text-dark-900">
              <Code2 className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Full-Stack Scale</h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">Robust architectures utilizing Next.js, Python, Supabase, Webhooks, and Tailwind CSS.</p>
          </div>
          {/* Pillar 3 */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-brand-500/50 hover:shadow-md dark:border-dark-700 dark:bg-dark-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white dark:bg-dark-800 dark:text-brand-400 dark:group-hover:bg-brand-500 dark:group-hover:text-dark-900">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-bold text-slate-900 dark:text-white">AI Integration</h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">Native integration with state-of-the-art models like Google Gemini, OpenAI, and Groq.</p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="rounded-2xl border border-brand-200 bg-brand-50/70 p-6 sm:p-8 dark:border-brand-500/10 dark:bg-brand-500/5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Ready to automate your operations?
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Check out my custom AI packages or send me a message directly.
            </p>
          </div>
          <Link
            href="/contact"
            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-offset-dark-900"
          >
            Get in touch
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
