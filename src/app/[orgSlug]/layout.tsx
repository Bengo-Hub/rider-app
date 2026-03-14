import { ThemeProvider } from "@/components/providers/theme-provider";
import { OrgSlugProvider } from "@/providers/org-slug-provider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

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
        <ProtectedRoute>{children}</ProtectedRoute>
      </OrgSlugProvider>
    </ThemeProvider>
  );
}
