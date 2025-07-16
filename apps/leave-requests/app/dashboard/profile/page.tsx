import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import UserForm from "@/components/users/user-form";
import AddressList from "@/components/users/address-list";
import { PageContainer } from "@workspace/ui/components/page-container";

export default async function ProfilePage() {
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user profile
  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single();
  // Fetch addresses
  const { data: addressData } = await supabase.from("addresses").select("*").eq("user_id", user.id);

  if (!userData) {
    return <div>User not found.</div>;
  }

  return (
    <PageContainer>
      <UserForm initialData={userData} pageTitle="My Profile" />
      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-4">Addresses</h3>
        <AddressList addresses={addressData || []} userId={user.id} />
      </div>
    </PageContainer>
  );
} 