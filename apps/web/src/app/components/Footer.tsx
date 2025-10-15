"use client";

import Link from "next/link";
import { useFooterVisibility } from "@/contexts/FooterVisibilityContext";

const links = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/community-guidelines", label: "Community Guidelines" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-conditions", label: "Terms & Conditions" },
];

export function Footer() {
  const { isVisible } = useFooterVisibility();

  if (!isVisible) {
    return null;
  }

  return (
    <footer className="border-t border-white/10 bg-background/80 backdrop-blur py-4 text-sm text-text-secondary">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-text-main transition-colors">
            {link.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
