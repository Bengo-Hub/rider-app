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
    <OrgSlugProvider orgSlug={orgSlug}>
      <ProtectedRoute>{children}</ProtectedRoute>
    </OrgSlugProvider>
  );
}
