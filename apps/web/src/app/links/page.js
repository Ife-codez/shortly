'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

  if (error) {
    return <p>{error}</p>;
  }

  if (links === null) {
    return <p>Loading...</p>;
  }

  if (links.length === 0) {
    return <p>You haven&apos;t created any links yet.</p>;
  }

  return (
    <ul>
      {links.map((link) => (
        <li key={link.id}>
          {link.slug} → {link.original_url}
        </li>
      ))}
    </ul>
  );
}