import { Scale, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Terms & Conditions' };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10 dark:border-dark-700 dark:bg-dark-900">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:border-dark-600 dark:bg-dark-800 dark:text-slate-400">
            <Scale className="h-3.5 w-3.5" />
            Legal Documentation
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Terms & Conditions
          </h1>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 dark:border-dark-700 dark:bg-dark-900">
        <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-h2:text-xl prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-300">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using AutoFlowLab, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, you may not access the website.</p>

          <h2>2. Intellectual Property</h2>
          <p>All content, including automation guides, tutorials, and codebase snippets provided on this site are the intellectual property of AutoFlowLab and Md. Selim Reza unless otherwise noted. You may use the provided JSON blueprints for personal and commercial business purposes, but you may not actively resell the blueprints themselves as standalone products.</p>

          <h2>3. Disclaimer of Liability</h2>
          <p>The tutorials and blueprints are provided &quot;as is&quot;. AutoFlowLab makes no warranties regarding the continuity of third-party APIs (such as changes to OpenAI, LangChain, or Zapier&apos;s pricing and endpoints). You are solely responsible for any API usage costs incurred on third-party platforms while following our guides.</p>

          <h2>4. Affiliate Disclosure</h2>
          <p>Some outbound links on this website (e.g., Make.com, Zapier) are affiliate links. If you click on an affiliate link and make a purchase, we may receive a commission at no additional cost to you. This helps maintain our testing infrastructure.</p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="rounded-2xl border border-brand-200 bg-brand-50/70 p-6 sm:p-8 dark:border-brand-500/10 dark:bg-brand-500/5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Have questions?</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              For any legal or service-related inquiries, please reach out to our support channel.
            </p>
          </div>
          <Link href="/contact" className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-lg dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
            Contact Support <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
