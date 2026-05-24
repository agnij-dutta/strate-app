"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import ConnectButton from "./ConnectButton";
import TxDrawer from "./TxDrawer";
import Wordmark from "./Wordmark";

const navItems = [
  { label: "Markets", href: "/markets" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Docs", href: "https://docs.usestrate.app", external: true },
];

function NavLink({
  label,
  href,
  active,
  external,
}: {
  label: string;
  href: string;
  active: boolean;
  external?: boolean;
}) {
  const className = `group relative font-mono text-[11px] uppercase tracking-[0.32em] transition-colors duration-200 ${
    active ? "text-parchment" : "text-parchment/55 hover:text-parchment"
  }`;
  const Inner = (
    <>
      {label}
      <span
        aria-hidden="true"
        className={`absolute -bottom-2 left-0 right-0 mx-auto h-px bg-foil transition-all duration-300 ${
          active ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {Inner}
    </a>
  ) : (
    <Link href={href} className={className}>
      {Inner}
    </Link>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-foil/15 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-6 lg:h-18 lg:px-10">
          <Link href="/" className="flex items-center" aria-label="Strate, home">
            <Wordmark size={26} color="parchment" />
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-12 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                label={item.label}
                href={item.href}
                external={item.external}
                active={
                  !item.external &&
                  (pathname === item.href || pathname.startsWith(item.href + "/"))
                }
              />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/40 lg:inline">
              <span className="mr-2 inline-block h-1.5 w-1.5 translate-y-[-1px] bg-foil align-middle" />
              Testnet
            </span>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1">{children}</main>

      <TxDrawer />

      <footer className="border-t border-parchment/8 bg-ink-deep">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-6 lg:px-10">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/40">
            Strate · Yield-stripping on Stellar · Testnet
          </p>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/30">
            Audit by OtterSec · pending mainnet
          </p>
        </div>
      </footer>
    </div>
  );
}
