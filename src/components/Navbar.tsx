'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Cpu, BookOpen, Layers, Zap, Menu, X, Info, Phone } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="border-b border-slate-200 dark:border-dark-700 bg-white/90 dark:bg-dark-900/90 backdrop-blur sticky top-0 z-50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link 
          href="/" 
          onClick={closeMenu}
          className="flex items-center gap-2 font-bold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white hover:opacity-90"
        >
          <Cpu className="text-brand-500 w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          <span>Auto<span className="text-brand-500">Flow</span>Lab</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href="/blog" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors">
            <BookOpen className="w-4 h-4" /> Tutorials
          </Link>
          <Link href="/tools" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors">
            <Layers className="w-4 h-4" /> Stack & Services
          </Link>
          <Link href="/about" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors">
            Contact
          </Link>
          <a 
            href="#newsletter" 
            className="inline-flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-dark-900 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-md shadow-brand-500/20"
          >
            <Zap className="w-3.5 h-3.5" /> Free Blueprints
          </a>
          <ThemeToggle />
        </nav>

        {/* Mobile Action Bar */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-800 transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-4 py-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3 text-base font-semibold">
            <Link 
              href="/blog" 
              onClick={closeMenu}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-200"
            >
              <BookOpen className="w-5 h-5 text-brand-500" /> Tutorials
            </Link>
            <Link 
              href="/tools" 
              onClick={closeMenu}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-200"
            >
              <Layers className="w-5 h-5 text-brand-500" /> Stack & Services
            </Link>
            <Link 
              href="/about" 
              onClick={closeMenu}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-200"
            >
              <Info className="w-5 h-5 text-brand-500" /> About Md. Selim Reza
            </Link>
            <Link 
              href="/contact" 
              onClick={closeMenu}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-200"
            >
              <Phone className="w-5 h-5 text-brand-500" /> Contact & FAQs
            </Link>
          </div>
          
          <div className="pt-3 border-t border-slate-200 dark:border-dark-700">
            <a 
              href="#newsletter" 
              onClick={closeMenu}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-dark-900 py-3 rounded-xl font-bold text-sm shadow-md"
            >
              <Zap className="w-4 h-4" /> Download Free Blueprints
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
