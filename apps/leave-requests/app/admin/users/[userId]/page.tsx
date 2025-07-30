import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs";
import UserForm from "@/components/users/user-form";
import AddressList from "@/components/users/address-list";
import ExtendedAbsenceList from "@/components/users/extended-absence-list";
import type { User, Address } from "@/types";
import { PageContainer } from "@workspace/ui/components/page-container";

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { userId } = await params;
  const { data: userData } = await supabase.from("users").select("*").eq("id", userId).single();
  const { data: addressData } = await supabase.from("addresses").select("*").eq("user_id", userId);

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
        </TabsList>
        <TabsContent value="profile">
          <UserForm initialData={userData} pageTitle="Edit User" canEditWorkInfo={true} />
        </TabsContent>
        <TabsContent value="addresses">
          <AddressList addresses={addressData || []} userId={userId} />
        </TabsContent>
        <TabsContent value="absences">
          <ExtendedAbsenceList userId={userId} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
