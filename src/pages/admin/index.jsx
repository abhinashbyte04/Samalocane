import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Admin Panel removed from user-facing interface for current prototype.
 * Automatically redirects any direct URL access or legacy navigation to the public interface.
 */
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
}
