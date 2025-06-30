import authOptions from "@/app/authOptions";
import connectDB from "@/lib/db";
import Challenge from "@/models/Challenge";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" })
  }

  try {
    await connectDB();

    const challenge = await Challenge.find();

    return NextResponse.json(challenge);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(err);
      return NextResponse.json({ message: "An error occured: " + err.message }, { status: 500 });
    } else {
      console.error(err);
      return NextResponse.json({ message: "An unknown error occured." }, { status: 500 });
    }
  }
}
