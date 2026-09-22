import { getAllPosts } from '@/lib/posts';
import CategoryFilter from '@/components/CategoryFilter';

export const metadata = {
  title: 'All AI Automation Tutorials',
  description: 'Search categorized step-by-step automation guides and workflow recipes.',
};

export default function BlogIndex() {
  const posts = getAllPosts();
  const categories = ['All', ...Array.from(new Set(posts.map((p) => p.category)))];

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 dark:border-dark-700 pb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Automation Library</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">
          Browse verified workflows, API chains, and visual automation recipes.
        </p>
      </div>
      <CategoryFilter posts={posts} categories={categories} />
    </div>
  );
}
