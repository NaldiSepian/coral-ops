import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'Belum Dibaca', 'Dibaca', or null for all
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from("notifikasi")
      .select("*")
      .eq("penerima_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: notifications || [],
      count: notifications?.length || 0
    });
  } catch (err) {
    console.error("Error in notifications API:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { penerima_id, pesan } = body;

    if (!penerima_id || !pesan) {
      return NextResponse.json(
        { error: "penerima_id and pesan are required" },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabase
      .from("notifikasi")
      .insert({
        penerima_id,
        pesan,
        status: "Belum Dibaca"
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return NextResponse.json(
        { error: "Failed to create notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: notification,
      message: "Notification created successfully"
    });
  } catch (err) {
    console.error("Error in notifications API:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notification_ids } = body;

    if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
      return NextResponse.json(
        { error: "notification_ids array is required" },
        { status: 400 }
      );
    }

    const { data: updatedNotifications, error } = await supabase
      .from("notifikasi")
      .update({ status: "Dibaca" })
      .in("id", notification_ids)
      .eq("penerima_id", user.id)
      .select();

    if (error) {
      console.error("Error updating notifications:", error);
      return NextResponse.json(
        { error: "Failed to update notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: updatedNotifications,
      message: `${updatedNotifications?.length || 0} notifications marked as read`
    });
  } catch (err) {
    console.error("Error in notifications API:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}