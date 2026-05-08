import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'WriteLikeMe AI — Transform Text Into Your Handwriting',
  description:
    'Upload your handwriting samples and let AI convert any text into your exact handwriting style. Generate realistic handwritten PDFs, notebooks, and more.',
  keywords: ['handwriting AI', 'text to handwriting', 'handwriting generator', 'AI writing', 'PDF handwriting'],
  authors: [{ name: 'WriteLikeMe AI' }],
  openGraph: {
    title: 'WriteLikeMe AI — Your Handwriting, Reimagined',
    description: 'AI-powered handwriting synthesis that captures your unique writing style.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(15, 15, 30, 0.95)',
                color: '#f0f0ff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                backdropFilter: 'blur(20px)',
                fontSize: '0.9rem',
              },
              success: {
                iconTheme: { primary: '#00d4aa', secondary: '#0f0f1e' },
              },
              error: {
                iconTheme: { primary: '#ff6b6b', secondary: '#0f0f1e' },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
