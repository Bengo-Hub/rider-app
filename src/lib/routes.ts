export function orgRoute(orgSlug: string, path: string): string {
  return `/${orgSlug}${path.startsWith("/") ? path : `/${path}`}`;
}
