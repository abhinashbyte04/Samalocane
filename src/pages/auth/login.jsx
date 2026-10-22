import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Authentication screen removed.
 * Directly redirects any legacy navigation or bookmarks to the main healthcare interface.
 */
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
