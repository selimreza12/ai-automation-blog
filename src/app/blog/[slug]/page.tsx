import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostBySlug, getAllPosts } from '@/lib/posts';
import { generateArticleJsonLd, SITE_URL } from '@/lib/seo';
import Markdown from 'markdown-to-jsx';
import { Clock, Calendar, ArrowLeft, Download, ExternalLink, CheckCircle } from 'lucide-react';
import NewsletterBox from '@/components/NewsletterBox';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.meta.title} | AutoFlowLab`,
    description: post.meta.excerpt,
  };
}

const slugify = (text: string) => {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

const getText = (child: any): string => {
  if (typeof child === 'string') return child;
  if (Array.isArray(child)) return child.map(getText).join('');
  if (child && child.props && child.props.children) return getText(child.props.children);
  return '';
};

const CustomH2 = ({ children, ...props }: any) => {
  const id = slugify(getText(children));
  return <h2 id={id} className="scroll-mt-24 sm:scroll-mt-28 break-words" {...props}>{children}</h2>;
};

const CustomH3 = ({ children, ...props }: any) => {
  const id = slugify(getText(children));
  return <h3 id={id} className="scroll-mt-24 sm:scroll-mt-28 break-words" {...props}>{children}</h3>;
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = generateArticleJsonLd(post.meta);

  const headings = post.content
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.replace('## ', '').trim());

  return (
    <div className="space-y-8 max-w-full overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-brand-600 dark:hover:text-brand-500 transition-colors">
        <ArrowLeft className="w-4 h-4 shrink-0" /> Back to Library
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* min-w-0 prevents markdown code blocks from expanding the column past the screen */}
        <article className="lg:col-span-8 min-w-0 w-full space-y-6">
          <header className="space-y-3 sm:space-y-4 border-b border-slate-200 dark:border-dark-700 pb-6">
            <span className="inline-flex text-xs font-bold px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-500 uppercase tracking-widest">
              {post.meta.category}
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight break-words">
              {post.meta.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 pt-2">
              <span>By {post.meta.author}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {post.meta.publishedAt}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.meta.readingTime}</span>
            </div>
          </header>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-white prose-headings:font-extrabold prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-pre:bg-slate-900 dark:prose-pre:bg-dark-800 prose-pre:border prose-pre:border-slate-800 dark:prose-pre:border-dark-700 prose-pre:rounded-xl prose-pre:max-w-full prose-pre:overflow-x-auto prose-code:text-brand-600 dark:prose-code:text-brand-500">
            <Markdown options={{ overrides: { h2: CustomH2, h3: CustomH3 } }}>
              {post.content}
            </Markdown>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 w-full">
          {headings.length > 0 && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 shadow-sm">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-4">
                On This Page
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                {headings.map((h, i) => (
                  <li key={i}>
                    <a href={`#${slugify(h)}`} className="hover:text-brand-600 dark:hover:text-brand-500 transition-colors flex items-start break-words">
                      <span className="text-brand-500 font-mono mr-1.5 opacity-60">#</span>
                      <span className="leading-tight">{h}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-dark-800 border-2 border-brand-500/20 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-500 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Download Workflow Blueprint</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                Import this exact scenario directly into Make.com or Zapier with pre-configured API chains.
              </p>
            </div>
            <ul className="text-xs space-y-2 text-slate-700 dark:text-slate-300 font-medium">
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-500 shrink-0" /> Ready-to-import JSON schema</li>
              <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-brand-500 shrink-0" /> Lead qualification prompt chains</li>
            </ul>
            <a
              href="#newsletter"
              className="flex items-center justify-center gap-1.5 w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl text-sm transition shadow-md cursor-pointer"
            >
              Get The Files <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </aside>
      </div>

      <NewsletterBox />
    </div>
  );
}
