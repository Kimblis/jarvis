import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Initialize Supabase client (will use server-side environment variables)
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_PRIVATE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    console.log(`exerciseId ${id}`);

    if (!id) {
      return NextResponse.json(
        { error: "Exercise ID is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("exercise")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching exercise:", error);
      return NextResponse.json(
        { error: `Failed to load exercise: ${error.message}` },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
