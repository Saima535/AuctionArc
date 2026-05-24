"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BidderWatchlistPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/bidder/auctions");
  }, [router]);

  return null;
}
