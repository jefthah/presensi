"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLoader from "@/components/PageLoader";

export default function RouteTransitionWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    // Jalankan ketika pathname berubah
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 700); // fallback

    return () => clearTimeout(timeout);
  }, [pathname]);

  return (
    <>
      {loading && <PageLoader />}
      {children}
    </>
  );
}
