import Link from 'next/link';
import { Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              <Cpu className="text-brand-500 w-6 h-6" />
              <span>Auto<span className="text-brand-500">Flow</span>Lab</span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Production-ready AI workflows, Make.com recipes, and Zapier blueprints built by Md. Selim Reza.
            </p>
          </div>

          {/* Links Col 1 */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/blog" className="hover:text-brand-600 dark:hover:text-brand-500 transition">Tutorials</Link></li>
              <li><Link href="/tools" className="hover:text-brand-600 dark:hover:text-brand-500 transition">Agency Services</Link></li>
              <li><Link href="/about" className="hover:text-brand-600 dark:hover:text-brand-500 transition">About</Link></li>
              <li><Link href="/contact" className="hover:text-brand-600 dark:hover:text-brand-500 transition">Contact & FAQs</Link></li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/privacy" className="hover:text-brand-600 dark:hover:text-brand-500 transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-600 dark:hover:text-brand-500 transition">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-dark-700 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Md. Selim Reza. All rights reserved.</p>
          <p>Built with Next.js & Tailwind CSS.</p>
        </div>
      </div>
    </footer>
  );
}
