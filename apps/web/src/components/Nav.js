'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearToken } from '@/lib/auth';

export default function Nav() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsSignedIn(!!localStorage.getItem('token'));

    function handleAuthChange() {
      setIsSignedIn(!!localStorage.getItem('token'));
    }

    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  function handleSignOut() {
    clearToken();
    setIsSignedIn(false);
    router.push('/signin');
  }

  return (
  <nav className="flex items-center gap-6 px-6 py-4 border-b border-border">
      <Link href="/links" className="text-lg font-semibold tracking-tight gradient-text">
        Shortly
      </Link>
      {isSignedIn ? (
        <>
          <Link href="/links" className="text-sm text-ink hover:text-primary transition-colors">
            My Links
          </Link>
          <Link href="/links/new" className="text-sm text-ink hover:text-primary transition-colors">
            New Link
          </Link>
          <button
            onClick={handleSignOut}
            className="ml-auto text-sm font-medium text-white gradient-bg px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign Out
          </button>
        </>
      ) : (
        <Link
          href="/signin"
          className="ml-auto text-sm font-medium text-white gradient-bg px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          Sign In
        </Link>
      )}
    </nav>
  );
}