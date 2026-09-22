import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import NewsletterBox from '@/components/NewsletterBox';
import { ArrowRight, Zap, Clock, Tag, ShieldCheck, Code2, ExternalLink } from 'lucide-react';

export default function HomePage() {
  const posts = getAllPosts();
  const featured = posts[0];
  const recent = posts.slice(1, 5);

  return (
    <div className="space-y-12 sm:space-y-16 max-w-full">
      {/* Hero Section */}
      <section className="text-center py-6 sm:py-12 space-y-4 sm:space-y-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-500 border border-brand-500/20 max-w-full text-left sm:text-center">
          <Zap className="w-3.5 h-3.5 shrink-0" /> Built by Md. Selim Reza • AI Solutions Architect
        </span>
        
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight break-words">
          Custom AI Automations & <span className="text-brand-500">Rapid MVPs</span> in Days, Not Months
        </h1>
        
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
          Eliminate manual bottlenecks. I help businesses scale using modern serverless architectures, advanced LLMs (Gemini & Groq), and automated workflow pipelines.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2 w-full max-w-md mx-auto sm:max-w-none">
          <Link
            href="/tools"
            className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-dark-900 font-bold px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
          >
            Hire for Custom Automation <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/blog"
            className="w-full sm:w-auto bg-slate-200 dark:bg-dark-800 hover:bg-slate-300 dark:hover:bg-dark-700 text-slate-900 dark:text-white font-semibold px-6 py-3 rounded-xl text-sm transition flex items-center justify-center"
          >
            Explore Free Blueprints
          </Link>
        </div>
      </section>

      {/* Verified Proof of Work Showcase */}
      <section className="p-5 sm:p-8 rounded-2xl bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-dark-700 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-500 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 shrink-0" /> Verified Proof-of-Work & Portfolio
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Production Utilities Built by Selim</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">ToolVerse</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Comprehensive web suite featuring 50+ free online developer, PDF, image, and business utility tools.
              </p>
            </div>
            <a
              href="https://toolsverse-kappa.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-xs font-semibold text-brand-600 dark:text-brand-500 flex items-center gap-1 hover:underline"
            >
              Launch ToolVerse <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">LeadScout V3 HQ</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Autonomous cloud intelligence CRM that scrapes data, scores leads with dual AI models, and pushes mobile alerts.
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-500" /> Private Agency Core Engine
            </span>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">MyImageTools</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                100% browser-based WebAssembly and AI client-side image processing engine for lightning-fast edits.
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-500" /> Client-Side WASM Tool
            </span>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featured && (
        <section>
          <div className="p-5 sm:p-8 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 hover:border-brand-500/50 transition shadow-sm">
            <span className="text-xs font-bold text-brand-600 dark:text-brand-500 uppercase tracking-widest">{featured.category}</span>
            <Link href={`/blog/${featured.slug}`}>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-2 text-slate-900 dark:text-white hover:text-brand-500 transition break-words">
                {featured.title}
              </h2>
            </Link>
            <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">{featured.excerpt}</p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {featured.readingTime}
              </span>
              <Link href={`/blog/${featured.slug}`} className="text-brand-600 dark:text-brand-500 text-xs sm:text-sm font-semibold flex items-center gap-1">
                Read Recipe <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Recent Tutorials */}
      {recent.length > 0 && (
        <section>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-6">Latest Automation Workflows</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {recent.map((post) => (
              <article key={post.slug} className="p-5 sm:p-6 rounded-xl bg-white dark:bg-dark-800/60 border border-slate-200 dark:border-dark-700 flex flex-col justify-between shadow-sm">
                <div>
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-500 flex items-center gap-1 mb-2">
                    <Tag className="w-3 h-3" /> {post.category}
                  </span>
                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white hover:text-brand-500 transition break-words">{post.title}</h3>
                  </Link>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{post.excerpt}</p>
                </div>
                <div className="mt-6 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-dark-700">
                  <span>{post.publishedAt}</span>
                  <Link href={`/blog/${post.slug}`} className="text-brand-600 dark:text-brand-500 font-medium">Read Guide →</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <NewsletterBox />
    </div>
  );
}
