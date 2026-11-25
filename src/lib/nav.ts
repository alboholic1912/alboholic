/** The site's sections, in the order the header and the phone menu list them. */
export const SECTIONS = [
  { href: "/", label: "Home", note: "The front page" },
  { href: "/stories", label: "Stories", note: "Moments from Albanian history" },
  { href: "/people", label: "People", note: "The figures who shaped it" },
  { href: "/battles", label: "Battles", note: "A map of where it was fought" },
  { href: "/about", label: "About", note: "Why Alboholic exists" },
] as const;

/** A section stays highlighted on its detail pages, e.g. People on /people/[slug]. */
export function isActive(pathname: string | null, href: string) {
  return pathname === href || (href !== "/" && Boolean(pathname?.startsWith(`${href}/`)));
}
