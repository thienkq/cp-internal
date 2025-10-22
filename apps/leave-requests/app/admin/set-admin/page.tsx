import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { PageContainer } from "@workspace/ui/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import SetAdminForm from "@/components/admin/set-admin-form";

export default async function SetAdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Set Admin Role</h1>
          <p className="text-gray-600">Set a user's role to admin for testing purposes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set User as Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <SetAdminForm />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
} 