import { NextRequest, NextResponse } from "next/server";
import { requireOrganization } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { uploadDocumentRequestSchema } from "@/lib/validators";

/**
 * POST /api/documents/upload-url
 * Generate signed URL for document upload to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const body = await request.json();

    // Validate input
    const validatedData = uploadDocumentRequestSchema.parse(body);

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = validatedData.fileName
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();
    const filePath = `${organizationId}/${validatedData.entityType}/${validatedData.entityId}/${timestamp}-${sanitizedFileName}`;

    // Get Supabase admin client
    const supabase = getSupabaseAdmin();

    // Generate signed URL for upload (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("Supabase upload URL error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate upload URL",
          details: error.message,
        },
        { status: 500 }
      );
    }

    // Get public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: data.signedUrl,
        fileUrl: publicUrlData.publicUrl,
        filePath,
        expiresIn: 3600, // 1 hour
      },
      message: "Upload URL vygenerovaná",
    });
  } catch (error) {
    console.error("Error generating upload URL:", error);

    if (error instanceof Error && "issues" in error) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status:
          error instanceof Error && error.message === "Unauthorized" ? 401 : 500,
      }
    );
  }
}

