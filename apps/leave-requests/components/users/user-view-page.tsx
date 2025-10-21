import { notFound } from "next/navigation";
import type { User } from "@/types";
import UserForm from "./user-form";
import { getUserById } from "@/app/actions/users";

type TUserViewPageProps = {
  userId: string;
};

export default async function UserViewPage({ userId }: TUserViewPageProps) {
  let user: User | null = null;
  let pageTitle = "Create New User";

  if (userId !== "new") {
    user = await getUserById(userId);
    if (!user) {
      notFound();
    }
    pageTitle = "Edit User";
  }

  return <UserForm initialData={user} pageTitle={pageTitle} canEditWorkInfo={true} />;
}
