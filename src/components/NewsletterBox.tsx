'use client';
import { useState } from 'react';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';

export default function NewsletterBox() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // Calls your custom Next.js API instead of Web3Forms
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        setEmail('');
      } else {
        setErrorMessage(data.message || "Submission failed. Please try again.");
      }
    } catch (err) {
      setErrorMessage("Network error. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="newsletter" className="scroll-mt-32 my-12 p-8 sm:p-12 rounded-3xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-center shadow-xl">
      <div className="max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-500 flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Mail className="w-7 h-7" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
          Get Verified Automation Blueprints
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          Drop your email below to instantly receive downloadable Make.com & Zapier JSON workflows + tested LLM prompt templates.
        </p>
        
        {submitted ? (
          <div className="flex flex-col items-center justify-center gap-3 text-brand-600 dark:text-brand-500 font-bold p-6 bg-brand-500/10 rounded-2xl animate-in zoom-in duration-300">
            <CheckCircle2 className="w-8 h-8" />
            <span>Success! The blueprints have been sent to your email.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                className="bg-slate-50 dark:bg-dark-900 border border-slate-300 dark:border-dark-700 text-slate-900 dark:text-white px-5 py-3.5 rounded-xl flex-1 focus:ring-2 focus:ring-brand-500 outline-none text-sm transition shadow-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Free Blueprints'}
              </button>
            </div>
            {errorMessage && <p className="text-red-500 text-xs font-semibold mt-2">{errorMessage}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
