import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();
  const user = await User.find({ solves: { $ne: [] } }).select(
    "_id username solves",
  );

  return NextResponse.json(user, { status: 200 });
}
