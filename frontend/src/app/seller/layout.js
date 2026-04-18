import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SellerShell } from "@/components/seller/SellerShell";

export default function SellerLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["Seller"]}>
      <SellerShell>{children}</SellerShell>
    </ProtectedRoute>
  );
}
