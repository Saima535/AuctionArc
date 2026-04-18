import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminWorkspace } from "@/components/admin-custom/AdminWorkspace";

export default function AdminLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <AdminWorkspace>{children}</AdminWorkspace>
    </ProtectedRoute>
  );
}
