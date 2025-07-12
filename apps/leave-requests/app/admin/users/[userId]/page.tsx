import { Skeleton } from "@workspace/ui/components/skeleton";
import { PageContainer } from "@workspace/ui/components/page-container";
import { Suspense } from "react";
import UserViewPage from "@/components/users/user-view-page";

export const metadata = {
  title: "Dashboard : User View",
};

type PageProps = { params: Promise<{ userId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;

  return (
    <PageContainer>
      <div className="flex-1 space-y-4">
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <UserViewPage userId={params.userId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
