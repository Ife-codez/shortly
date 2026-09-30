'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewLinkPage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);
  const [createdLink, setCreatedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

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
        return;
      }

      setCreatedLink(data);
      setUrl('');
    } catch (err) {
      console.error('Failed to create link:', err);
      setError('Something went wrong. Please try again.');
    }
  }

  function handleCopy() {
    const shortUrl = `${process.env.NEXT_PUBLIC_API_URL}/${createdLink.slug}`;
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {error && <p>{error}</p>}
        <div>
          <label>URL to shorten</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/some/long/path"
          />
        </div>
        <button type="submit">Create short link</button>
      </form>

      {createdLink && (
        <div>
          <p>Your short link:</p>
          <p>{process.env.NEXT_PUBLIC_API_URL}/{createdLink.slug}</p>
          <button onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
      )}
    </div>
  );
}