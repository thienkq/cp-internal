import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import ProfileTabs from "./ProfileTabs";
import { PageContainer } from "@workspace/ui/components/page-container";

export default async function ProfilePage() {
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: userData } = await supabase.from("users").select("*").eq("id", user.id).single();
  const { data: addressData } = await supabase.from("addresses").select("*").eq("user_id", user.id);

  if (!userData) {
    return <div>User not found.</div>;
  }

  return (
    <PageContainer>
      <ProfileTabs userData={userData} addressData={addressData || []} userId={user.id} />
    </PageContainer>
  );
} 