import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { OrgSlugProvider } from "@/providers/org-slug-provider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PWAUpdateBanner } from "@/components/pwa/pwa-update-banner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}): Promise<Metadata> {
  const { orgSlug } = await params;
  return {
    manifest: `/${orgSlug}/manifest.webmanifest`,
  };
}

export default async function OrgSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <OrgSlugProvider orgSlug={orgSlug}>
        <PWAUpdateBanner />
        <ProtectedRoute>{children}</ProtectedRoute>
      </OrgSlugProvider>
    </ThemeProvider>
  );
}
