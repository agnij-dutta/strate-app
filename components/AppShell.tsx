"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ConnectButton from "./ConnectButton";
import ErrorBoundary from "./ErrorBoundary";
import ToastContainer from "./ToastContainer";
import TxDrawer from "./TxDrawer";
import Wordmark from "./Wordmark";
import { IS_MAINNET, NETWORK_LABEL } from "@/lib/addresses";

const navItems = [
  { label: "Markets", href: "/markets" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "History", href: "/history" },
  { label: "Docs", href: "https://docs.usestrate.app", external: true },
];

function NavLink({
  label,
  href,
  active,
  external,
  onClick,
}: {
  label: string;
  href: string;
  active: boolean;
  external?: boolean;
  onClick?: () => void;
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
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={onClick}
    >
      {Inner}
    </a>
  ) : (
    <Link href={href} className={className} onClick={onClick}>
      {Inner}
    </Link>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);

  // Close mobile menu on route change.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Lock body scroll while mobile menu is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-foil/15 bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-5 lg:h-18 lg:px-10">
          <Link href="/" className="flex items-center" aria-label="Strate, home">
            <Wordmark size={26} color="parchment" />
          </Link>

          {/* Center nav — md+ only */}
          <nav
            aria-label="Primary"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex lg:gap-12"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                label={item.label}
                href={item.href}
                external={item.external}
                active={
                  !item.external &&
                  (pathname === item.href ||
                    pathname.startsWith(item.href + "/"))
                }
              />
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/40 lg:inline">
              <span className="mr-2 inline-block h-1.5 w-1.5 translate-y-[-1px] bg-foil align-middle" />
              {NETWORK_LABEL}
            </span>
            <ConnectButton />
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="flex h-10 w-10 items-center justify-center border border-parchment/15 bg-parchment/[0.04] text-parchment/75 transition-colors hover:border-foil/60 hover:text-parchment md:hidden"
              style={{ borderRadius: 2 }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 4h12M2 8h12M2 12h12"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="square"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu sheet */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-[55] bg-ink-deep/75 backdrop-blur-sm md:hidden"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 top-0 z-[58] border-b border-foil/25 bg-ink/95 backdrop-blur-xl shadow-panel md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
            >
              <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-5">
                <Wordmark size={26} color="parchment" />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="font-mono text-[10px] uppercase tracking-[0.32em] text-parchment/55 transition-colors hover:text-foil"
                >
                  Close ×
                </button>
              </div>
              <nav
                aria-label="Mobile"
                className="px-5 pb-8 pt-2"
              >
                <ul className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const active =
                      !item.external &&
                      (pathname === item.href ||
                        pathname.startsWith(item.href + "/"));
                    return (
                      <li key={item.href}>
                        {item.external ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center justify-between border-b border-parchment/8 py-4 font-display text-[24px] text-parchment/85 transition-colors hover:text-foil"
                          >
                            <span>{item.label}</span>
                            <span aria-hidden="true" className="font-mono text-[10px] uppercase tracking-[0.28em] text-parchment/40">
                              ↗
                            </span>
                          </a>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center justify-between border-b border-parchment/8 py-4"
                          >
                            <span
                              className={`font-display text-[24px] transition-colors ${
                                active ? "text-foil" : "text-parchment/85 hover:text-foil"
                              }`}
                            >
                              {item.label}
                            </span>
                            {active && (
                              <span
                                aria-hidden="true"
                                className="block h-1.5 w-1.5 bg-foil"
                              />
                            )}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-8 font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/40">
                  <span className="mr-2 inline-block h-1.5 w-1.5 translate-y-[-1px] bg-foil align-middle" />
                  {IS_MAINNET ? "Mainnet · unaudited beta" : "Testnet · Mainnet pending audit"}
                </p>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex-1">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>

      <TxDrawer />
      <ToastContainer />

      <footer className="border-t border-parchment/8 bg-ink-deep">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-start gap-2 px-5 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/40">
            Strate · Yield-stripping on Stellar · {NETWORK_LABEL}
          </p>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/30">
            Audit by OtterSec · pending mainnet
          </p>
        </div>
      </footer>
    </div>
  );
}
