import Link from 'next/link';
import { Cpu, BookOpen, Layers, Zap } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 dark:border-dark-700 bg-white/80 dark:bg-dark-900/80 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900 dark:text-white hover:opacity-90">
          <Cpu className="text-brand-500 w-6 h-6" />
          <span>Auto<span className="text-brand-500">Flow</span>Lab</span>
        </Link>
        <nav className="flex items-center gap-5 sm:gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/blog" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors">
            <BookOpen className="w-4 h-4" /> Tutorials
          </Link>
          <Link href="/tools" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors">
            <Layers className="w-4 h-4" /> Stack & Services
          </Link>
          <a href="#newsletter" className="inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-dark-900 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-lg shadow-brand-500/20">
            <Zap className="w-3.5 h-3.5" /> Free Blueprints
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
