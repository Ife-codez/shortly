'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { clearToken, hasToken, subscribeToAuth } from '@/lib/auth';

export default function Nav() {
  const router = useRouter();
  const isSignedIn = useSyncExternalStore(subscribeToAuth, hasToken, () => false);

  function handleSignOut() {
    clearToken();
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