import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/app/authOptions";
import dbConnect from "@/lib/db";
import Challenge from "@/models/Challenge";
import { User } from "@/models/User";
import { Log } from "@/models/Log";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);

    // Get the challenge
    const challenge = await Challenge.findById((await context.params).id);
    if (!challenge) {
      return NextResponse.json(
        { message: "Challenge not found" },
        { status: 404 },
      );
    }

    const { flag }: { flag: string } = await request.json();
    if (!flag) {
      return NextResponse.json(
        { message: "Flag is required" },
        { status: 400 },
      );
    }

    if (flag.trim() !== challenge.flag) {
      return NextResponse.json({ message: "Incorrect flag" }, { status: 400 });
    }

    const chall = await Challenge.findById((await context.params).id);

    if (!chall.solves.includes(user._id)) {
      chall.solves.push(user._id);
      await chall.save();
      user.solves.push(chall._id);
      await user.save();

      console.log("Flag submitted by:", user.username);

      const log = new Log({
        memberId: user._id,
        challengeId: chall._id,
        solvedAt: new Date(),
      });
      await log.save();
    }

    return NextResponse.json(
      { message: "Congratulations! Flag is correct" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Flag submission error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
