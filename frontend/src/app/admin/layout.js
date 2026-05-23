import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AdminShell>{children}</AdminShell>
    </ProtectedRoute>
  );
}
