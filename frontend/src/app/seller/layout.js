import { MemberShell } from "@/components/member/MemberShell";
import { sellerNavItems } from "@/data/member/navigation";

export default function SellerLayout({ children }) {
  return (
    <MemberShell
      role="Seller"
      navItems={sellerNavItems}
      badge="Seller workspace"
      homeHref="/seller"
      eyebrow="Seller command center"
    >
      {children}
    </MemberShell>
  );
}
