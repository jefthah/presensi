"use client";
import { useEffect, useState } from "react";
import PageLoader from "./PageLoader"; // ⬅️ MENGGUNAKAN komponen spinner di atas

export default function PageLoadingWrapper({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <PageLoader />;

  return children;
}
