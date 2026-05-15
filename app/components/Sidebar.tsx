"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const NAV = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: "/practicar",
    label: "Materias",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M6 12.4v3.3c0 .7 2.7 2.3 6 2.3s6-1.6 6-2.3v-3.3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: "/mazos/nuevo",
    label: "Nuevo mazo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/mazos",
    label: "Mazos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="4" y="7" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/mazos") return pathname.startsWith("/mazos") && !pathname.startsWith("/mazos/nuevo");
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      {/* Marca */}
      <div className={styles.brand}>
        <span className={styles.brandIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3L4 7v5c0 5.25 3.4 10.15 8 11.35C16.6 22.15 20 17.25 20 12V7l-8-4Z"
              stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className={styles.brandText}>
          Core Study <em>AI</em>
        </span>
      </div>

      {/* Navegación */}
      <nav className={styles.nav} aria-label="Menú principal">
        <p className={styles.sectionLabel}>Navegación</p>
        {NAV.map(item => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {active && <span className={styles.activePip} aria-hidden="true" />}
            </Link>
          );
        })}
      </nav>

      {/* Salir */}
      <div className={styles.bottom}>
        <Link href="/" className={styles.logoutItem}>
          <span className={styles.navIcon}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M10 5H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h4" stroke="currentColor" strokeWidth="1.8" />
              <path d="M14 16l4-4-4-4M18 12H9" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </span>
          <span className={styles.navLabel}>Salir</span>
        </Link>
      </div>
    </aside>
  );
}
