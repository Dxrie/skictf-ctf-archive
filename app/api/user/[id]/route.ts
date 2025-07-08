import connectDB from "@/lib/db";
import Challenge from "@/models/Challenge";
import { User } from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    await Challenge.findOne();

    const user = await User.findById((await context.params).id)
      .select("username _id solves")
      .populate({
        path: "solves",
        select: "title difficulty category _id",
      });

    if (!user) {
      return NextResponse.json(
        { message: "User doesn't exist" },
        { status: 404 },
      );
    }

    return NextResponse.json(user);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err);
      return NextResponse.json(
        { message: "An error occured: " + err.message },
        { status: 500 },
      );
    } else {
      return NextResponse.json(
        {
          message: "An unknown error occured.",
        },
        { status: 500 },
      );
    }
  }
}
