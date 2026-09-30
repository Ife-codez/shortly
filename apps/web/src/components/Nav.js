'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Nav() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsSignedIn(!!localStorage.getItem('token'));
  }, []);

  function handleSignOut() {
    localStorage.removeItem('token');
    setIsSignedIn(false);
    router.push('/signin');
  }

  return (
    <nav className="flex items-center gap-4 p-4 border-b">
      <Link href="/links" className="font-semibold">Shortly</Link>
      {isSignedIn ? (
        <>
          <Link href="/links">My Links</Link>
          <Link href="/links/new">New Link</Link>
          <button onClick={handleSignOut} className="ml-auto">Sign Out</button>
        </>
      ) : (
        <Link href="/signin" className="ml-auto">Sign In</Link>
      )}
    </nav>
  );
}