'use client';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [darkMode, setDarkMode] = useState(false); // Default to false (Light Mode)

  useEffect(() => {
    // Check local storage on load
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className="p-2 rounded-lg bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-800 dark:text-slate-200 transition-colors hover:shadow-sm"
    >
      {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
    </button>
  );
}
