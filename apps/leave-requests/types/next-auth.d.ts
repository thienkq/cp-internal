import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
      full_name?: string
      email?: string
      name?: string
      image?: string
      date_of_birth?: string
      start_date?: string
      end_date?: string
      gender?: string
      position?: string
      phone?: string
      is_active?: boolean
      manager_id?: string
      created_at?: string
      updated_at?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role?: string
    full_name?: string
    email?: string
    name?: string
    image?: string
    date_of_birth?: string
    start_date?: string
    end_date?: string
    gender?: string
    position?: string
    phone?: string
    is_active?: boolean
    manager_id?: string
    created_at?: string
    updated_at?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: string
    full_name?: string
    email?: string
    name?: string
    image?: string
    date_of_birth?: string
    start_date?: string
    end_date?: string
    gender?: string
    position?: string
    phone?: string
    is_active?: boolean
    manager_id?: string
    created_at?: string
    updated_at?: string
  }
}

