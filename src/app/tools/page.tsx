import fs from 'fs';
import path from 'path';
import { ExternalLink, Check, Briefcase, Wrench } from 'lucide-react';
import { Tool } from '@/types';

export const metadata = {
  title: 'Agency Services & Recommended Stack',
  description: 'Hire Md. Selim Reza for custom AI automation packages or explore recommended software tools.',
};

export default function ToolsPage() {
  const toolsFilePath = path.join(process.cwd(), 'content/tools/tools.json');
  const tools: Tool[] = fs.existsSync(toolsFilePath) ? JSON.parse(fs.readFileSync(toolsFilePath, 'utf8')) : [];

  const agencyPackages = tools.filter((t) => t.category.includes('Agency Service') || t.category.includes('Featured Web Utility App'));
  const softwareStack = tools.filter((t) => !t.category.includes('Agency Service') && !t.category.includes('Featured Web Utility App'));

  return (
    <div className="space-y-16">
      {/* Agency Services Section */}
      <div className="space-y-8">
        <div className="border-b border-slate-200 dark:border-dark-700 pb-6">
          <span className="text-xs font-bold text-brand-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <Briefcase className="w-4 h-4" /> Done-For-You Engineering & AI Solutions
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Custom AI Automation Packages</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm max-w-2xl">
            Want me to build these systems directly for your business? Choose a verified package or reach out for a custom architecture build.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {agencyPackages.map((pkg) => (
            <div key={pkg.slug} className="p-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-dark-800 dark:to-dark-700 border border-slate-200 dark:border-dark-600 flex flex-col justify-between shadow-lg">
              <div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-brand-500/20 text-brand-500 inline-block mb-3">
                  {pkg.category}
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{pkg.name}</h2>
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{pkg.description}</p>
                <div className="mt-4 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brand-500 shrink-0" />
                    <span><strong>Best for:</strong> {pkg.bestFor}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-300 dark:border-dark-600 font-semibold text-brand-600 dark:text-brand-400">
                    {pkg.pricing}
                  </div>
                </div>
              </div>
              <a
                href="https://t.me/selimreza123"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-1.5 w-full bg-brand-500 hover:bg-brand-600 text-dark-900 font-bold py-2.5 rounded-xl text-xs transition shadow"
              >
                Book This Package <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Software Stack & Affiliate Tools */}
      <div className="space-y-8 pt-6 border-t border-slate-200 dark:border-dark-700">
        <div className="pb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <Wrench className="w-4 h-4" /> Verified Infrastructure
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Recommended Automation Stack</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-xs">Platforms tested and used in our production agency environments.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {softwareStack.map((tool) => (
            <div key={tool.slug} className="p-6 rounded-xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tool.name}</h3>
                  <span className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-dark-700 text-slate-700 dark:text-slate-300">{tool.category}</span>
                </div>
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{tool.description}</p>
                <div className="mt-4 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-brand-500 shrink-0" />
                    <span><strong>Best for:</strong> {tool.bestFor}</span>
                  </div>
                  <div className="text-slate-500 dark:text-slate-400"><strong>Pricing:</strong> {tool.pricing}</div>
                </div>
              </div>
              <a
                href={tool.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="mt-6 flex items-center justify-center gap-1.5 w-full bg-slate-200 dark:bg-dark-700 hover:bg-brand-500 hover:text-dark-900 text-slate-900 dark:text-white font-semibold py-2 rounded-lg text-xs transition"
              >
                Visit {tool.name} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
