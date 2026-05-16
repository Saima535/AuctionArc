"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Chat from "@/components/chat/Chat";

export default function SellerMessagesPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== "Seller") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "Seller") {
    return null;
  }

  return (
    <div>
      <Chat />
    </div>
  );
}

