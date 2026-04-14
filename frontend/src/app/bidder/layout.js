import { MemberShell } from "@/components/member/MemberShell";
import { bidderNavItems } from "@/data/member/navigation";

export default function BidderLayout({ children }) {
  return (
    <MemberShell
      role="Bidder"
      navItems={bidderNavItems}
      badge="Bidder workspace"
      homeHref="/bidder"
      eyebrow="Bidder command center"
    >
      {children}
    </MemberShell>
  );
}
