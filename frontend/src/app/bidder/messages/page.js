"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Chat from "@/components/chat/Chat";

export default function BidderMessagesPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "Buyer") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "Buyer") {
    return null;
  }

  return (
    <div>
      <Chat />
    </div>
  );
}
