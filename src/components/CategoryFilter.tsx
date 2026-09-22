'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Tag, Clock, ArrowRight } from 'lucide-react';
import { PostMeta } from '@/types';

export default function CategoryFilter({ posts, categories }: { posts: PostMeta[]; categories: string[] }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredPosts =
    activeCategory === 'All'
      ? posts
      : posts.filter((p) => p.category === activeCategory);

  return (
    <div className="space-y-8">
      {/* Premium Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeCategory === category
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-dark-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid of Premium Filtered Tutorials */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredPosts.map((post) => (
          <article
            key={post.slug}
            className="p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 hover:border-brand-500/50 hover:shadow-xl transition-all shadow-sm flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> {post.category}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {post.readingTime}
                </span>
              </div>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-500 transition-colors">
                  {post.title}
                </h2>
              </Link>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-dark-700 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">{post.publishedAt}</span>
              <Link
                href={`/blog/${post.slug}`}
                className="text-brand-600 dark:text-brand-500 font-bold flex items-center gap-1 hover:underline"
              >
                Read Blueprint <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
