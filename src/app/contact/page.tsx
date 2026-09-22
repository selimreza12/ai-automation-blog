import {
  Mail,
  MessageSquare,
  ArrowRight,
  Plus,
  Clock,
  Workflow,
  Users,
} from 'lucide-react';

export const metadata = {
  title: 'Contact & FAQs',
};

const faqs = [
  {
    question: 'How long does an MVP take to build?',
    answer:
      'Most Micro-SaaS and MVP projects can be designed, developed, tested, and deployed within approximately 10–14 days, depending on the project scope, features, and integrations required.',
    icon: Clock,
  },
  {
    question: 'What do I need to start an automation project?',
    answer:
      'You only need to explain your current workflow and the problem you want to solve. For example, you might describe how leads are collected from Webflow and manually transferred to Google Sheets. I can then handle the technical architecture, integrations, APIs, and automation workflow.',
    icon: Workflow,
  },
  {
    question: 'Do you work with non-technical founders?',
    answer:
      'Absolutely. I translate business requirements into practical technical solutions and explain important decisions clearly without unnecessary technical jargon.',
    icon: Users,
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-16">
      {/* =========================================================
          CONTACT HERO
      ========================================================== */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-12 shadow-sm sm:px-10 sm:py-14 dark:border-dark-700 dark:bg-dark-900">
        {/* Decorative background */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative text-center">
          {/* Small label */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Let&apos;s work together
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
            Let&apos;s automate your business
          </h1>

          {/* Description */}
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg dark:text-slate-400">
            Have a custom project, automation, or Micro-SaaS idea in mind?
            Tell me what you are trying to build and let&apos;s explore the right
            technical approach.
          </p>

          {/* Contact buttons */}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {/* Email */}
            <a
              href="mailto:imdselim95@gmail.com"
              className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-brand-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/25 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-dark-900"
            >
              <Mail className="h-5 w-5" />
              Email me
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/selimreza123"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-dark-600 dark:bg-dark-800 dark:text-white dark:hover:border-dark-500 dark:hover:bg-dark-700 dark:focus:ring-offset-dark-900"
            >
              <MessageSquare className="h-5 w-5" />
              Message on Telegram
            </a>
          </div>

          {/* Contact availability */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Available for new projects
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ SECTION
      ========================================================== */}
      <section>
        {/* Section header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-px w-8 bg-brand-500" />

            <span className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              FAQ
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Frequently asked questions
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-400">
            A few common questions about project timelines, automation,
            collaboration, and getting started.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-dark-700 dark:bg-dark-800/50">
          {faqs.map((faq, index) => {
            const Icon = faq.icon;

            return (
              <details
                key={faq.question}
                className={`group ${
                  index !== faqs.length - 1
                    ? 'border-b border-slate-200 dark:border-dark-700'
                    : ''
                }`}
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 p-5 transition-colors hover:bg-slate-50 sm:p-6 dark:hover:bg-dark-800">
                  {/* Icon */}
                  <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 sm:flex dark:bg-brand-500/10 dark:text-brand-400">
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Question */}
                  <h3 className="flex-1 text-left text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
                    {faq.question}
                  </h3>

                  {/* Plus icon */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all duration-200 group-open:rotate-45 group-open:bg-brand-50 group-open:text-brand-600 dark:border-dark-600 dark:text-slate-400 dark:group-open:bg-brand-500/10 dark:group-open:text-brand-400">
                    <Plus className="h-4 w-4" />
                  </span>
                </summary>

                {/* Answer */}
                <div className="px-5 pb-6 sm:pl-[88px] sm:pr-16">
                  <p className="max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                    {faq.answer}
                  </p>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          FINAL CTA
      ========================================================== */}
      <section className="rounded-2xl border border-brand-200 bg-brand-50/70 p-6 sm:p-8 dark:border-brand-500/10 dark:bg-brand-500/5">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Have a different question?
            </h3>

            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-400">
              Send me a message with your idea, workflow, or business problem.
              We can figure out the next step from there.
            </p>
          </div>

          <a
            href="mailto:imdselim95@gmail.com"
            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-offset-dark-900"
          >
            Start a conversation
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </section>
    </div>
  );
}