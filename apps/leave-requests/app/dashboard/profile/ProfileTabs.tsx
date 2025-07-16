"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@workspace/ui/components/tabs";
import UserForm from "@/components/users/user-form";
import AddressList from "@/components/users/address-list";
import type { User, Address } from "@/types";

export default function ProfileTabs({ userData, addressData, userId }: {
  userData: User;
  addressData: Address[];
  userId: string;
}) {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="addresses">Addresses</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <UserForm initialData={userData} pageTitle="My Profile" />
      </TabsContent>
      <TabsContent value="addresses">
        <AddressList addresses={addressData || []} userId={userId} />
      </TabsContent>
    </Tabs>
  );
} 