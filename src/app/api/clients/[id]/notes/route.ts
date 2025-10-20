import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { clients } from "@/db/schema/clients";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

// Create a simple notes table schema inline since we need to store notes per client
// In a real scenario, you'd have this in your schema
const noteCreateSchema = z.object({
  content: z.string().min(1).max(2000),
});

// For now, we'll use a mock storage or extend to use a proper DB table
// This is a placeholder implementation that would need a notes table in the DB
const clientNotes: Record<string, Array<{ id: string; content: string; createdAt: string; createdBy: string }>> = {};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not associated with an organization" },
        { status: 403 }
      );
    }

    const clientId = params.id;

    // Verify client exists
    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Return notes for this client (from mock storage for now)
    const notes = clientNotes[clientId] || [];

    return NextResponse.json({ data: notes });
  } catch (error) {
    console.error("Error fetching client notes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not associated with an organization" },
        { status: 403 }
      );
    }

    const clientId = params.id;

    // Verify client exists
    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = noteCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    // Create new note (in mock storage)
    const newNote = {
      id: `note_${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };

    if (!clientNotes[clientId]) {
      clientNotes[clientId] = [];
    }

    clientNotes[clientId].push(newNote);

    return NextResponse.json({ data: newNote }, { status: 201 });
  } catch (error) {
    console.error("Error creating client note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
