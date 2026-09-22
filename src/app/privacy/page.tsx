import { ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10 dark:border-dark-700 dark:bg-dark-900">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:border-dark-600 dark:bg-dark-800 dark:text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5" />
            Legal Documentation
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 dark:border-dark-700 dark:bg-dark-900">
        <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-h2:text-xl prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-300">
          <h2>1. Information We Collect</h2>
          <p>We may collect personal information such as your name and email address when you voluntarily submit it through our newsletter form or contact page to receive automation blueprints or request services.</p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Send you the requested digital products (JSON blueprints).</li>
            <li>Respond to your service inquiries and provide customer support.</li>
            <li>Send periodic emails regarding new automations (you can unsubscribe at any time).</li>
          </ul>

          <h2>3. Third-Party Links</h2>
          <p>Our blog and tools page contain affiliate links to third-party services (e.g., Make.com, Zapier). If you click on a third-party link, you will be directed to their site. We strongly advise you to review their Privacy Policy as we have no control over their practices.</p>

          <h2>4. Data Security</h2>
          <p>We implement standard security measures to protect your personal information, though no method of transmission over the Internet is 100% secure. We do not sell or trade your email address to outside organizations.</p>

          <p className="mt-8 rounded-xl bg-slate-50 p-6 text-sm dark:bg-dark-800/50">
            If you have questions about this Privacy Policy, please contact us at <strong>imdselim95@gmail.com</strong>.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="rounded-2xl border border-brand-200 bg-brand-50/70 p-6 sm:p-8 dark:border-brand-500/10 dark:bg-brand-500/5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Need clarification?</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              If you have any questions regarding data handling or our tools, reach out.
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
