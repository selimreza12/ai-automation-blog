import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Md. Selim Reza | Custom AI Automations & MVPs',
    template: '%s | AutoFlowLab',
  },
  description: 'Production-ready AI workflows, Make.com recipes, and Zapier blueprints to scale operations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Removed 'dark' class so it defaults to Light Mode!
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${jakarta.variable}`}>
      <body className="bg-dark-900 text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-brand-500 selection:text-white transition-colors duration-300">
        <Navbar />
        <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
