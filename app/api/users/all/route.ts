import { User } from "@/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await User.find({ solves: { $ne: [] } });

  return NextResponse.json(user, { status: 200 });
}
