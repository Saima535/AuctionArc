import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BuyerShell } from "@/components/bidder/BuyerShell";

export default function BidderLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["Bidder"]}>
      <BuyerShell>{children}</BuyerShell>
    </ProtectedRoute>
  );
}
