'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewLinkPage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/signin');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
        setIsLoading(false);
        return;
      }

      setCreatedLink(data);
      setUrl('');
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to create link:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  function handleCopy() {
    const shortUrl = `${process.env.NEXT_PUBLIC_API_URL}/${createdLink.slug}`;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative flex min-h-[calc(100vh-73px)] items-center justify-center px-6 overflow-hidden">
      <div
        className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full opacity-20 blur-3xl gradient-bg"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">New link</h1>
        <p className="text-sm text-muted mb-8">Paste a long URL to shorten it.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-ink mb-1">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/some/long/path"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full gradient-bg text-white text-sm font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating short link…' : 'Create short link'}
          </button>
        </form>

        {createdLink && (
          <div className="mt-6 rounded-lg border border-border bg-surface px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink truncate">
              {process.env.NEXT_PUBLIC_API_URL}/{createdLink.slug}
            </p>
            <button
              onClick={handleCopy}
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}