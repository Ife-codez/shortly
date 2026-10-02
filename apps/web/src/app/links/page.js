'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LinksPage() {
  const [links, setLinks] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/signin');
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/links`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load links');
        }
        return response.json();
      })
      .then((data) => setLinks(data))
      .catch((err) => {
        console.error(err);
        setError('Could not load your links. Please try again.');
      });
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Your links</h1>
        <Link
          href="/links/new"
          className="gradient-bg text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          New link
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!error && links === null && (
        <p className="text-sm text-muted">Loading your links…</p>
      )}

      {!error && links !== null && links.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted mb-4">You haven&apos;t created any links yet.</p>
          <Link
            href="/links/new"
            className="text-primary text-sm font-medium hover:underline"
          >
            Create your first link
          </Link>
        </div>
      )}

      {!error && links !== null && links.length > 0 && (
        <ul className="divide-y divide-border">
          {links.map((link) => (
            <li key={link.id} className="py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">/{link.slug}</p>
                <p className="text-sm text-muted truncate">{link.original_url}</p>
              </div>
              <p className="text-xs text-muted shrink-0">
                {new Date(link.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}