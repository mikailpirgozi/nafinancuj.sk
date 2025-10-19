import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireOrganization() {
  const user = await requireAuth();

  if (!user.organizationId) {
    throw new Error("User is not assigned to an organization");
  }

  return {
    user,
    organizationId: user.organizationId,
  };
}

export function isSuperAdmin(role: string) {
  return role === "SUPER_ADMIN";
}

export function isOwnerOrAdmin(role: string) {
  return role === "SUPER_ADMIN" || role === "OWNER" || role === "ADMIN";
}

export function isAgent(role: string) {
  return role === "AGENT";
}

export function canManageOrganizations(role: string) {
  return role === "SUPER_ADMIN";
}

export function canManageUsers(role: string) {
  return role === "SUPER_ADMIN" || role === "OWNER" || role === "ADMIN";
}

export function canManageApplications(role: string) {
  return (
    role === "SUPER_ADMIN" ||
    role === "OWNER" ||
    role === "ADMIN" ||
    role === "AGENT"
  );
}

export function canViewOnly(role: string) {
  return role === "VIEWER";
}

