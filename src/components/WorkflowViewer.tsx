'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function WorkflowViewer({ jsonString }: { jsonString: string }) {
  const [copied, setCopied] = useState(false);

  const copyBlueprint = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-dark-700 bg-dark-800">
      <div className="flex justify-between items-center px-4 py-2 bg-dark-900 border-b border-dark-700 text-xs text-slate-400">
        <span>Workflow JSON Blueprint</span>
        <button onClick={copyBlueprint} className="flex items-center gap-1 text-brand-500 hover:text-brand-400">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto">
        <code>{jsonString}</code>
      </pre>
    </div>
  );
}
