import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs";
import UserForm from "@/components/users/user-form";
import AddressList from "@/components/users/address-list";
import ExtendedAbsenceList from "@/components/users/extended-absence-list";
import BonusLeaveGrants from "@/components/users/bonus-leave-grants";
import type { User, Address } from "@/types";
import { PageContainer } from "@workspace/ui/components/page-container";
import { getUserById } from "@/app/actions/users";
import { getAddressesByUserId } from "@/app/actions/addresses";

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { userId } = await params;
  const userData = await getUserById(userId);
  const addressData = await getAddressesByUserId(userId);

  if (!userData) {
    return <div>User not found.</div>;
  }

  return (
    <PageContainer>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="absences">Extended Absences</TabsTrigger>
          <TabsTrigger value="bonus-leave">Bonus Leave</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <UserForm initialData={userData} pageTitle="Edit User" canEditWorkInfo={true} canEditRole={true} />
        </TabsContent>
        <TabsContent value="addresses">
          <AddressList addresses={addressData || []} userId={userId} />
        </TabsContent>
        <TabsContent value="absences">
          <ExtendedAbsenceList userId={userId} />
        </TabsContent>
        <TabsContent value="bonus-leave">
          <BonusLeaveGrants userId={userId} userName={userData.full_name || ''} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
