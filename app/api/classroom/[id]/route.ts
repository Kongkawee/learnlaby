import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Extract the ID from the URL path
  const pathname = req.nextUrl.pathname;
  const id = pathname.split("/").pop(); // Assumes route is /api/classroom/[id]

  if (!id) {
    return NextResponse.json({ error: "Missing classroom ID" }, { status: 400 });
  }

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    return NextResponse.json(classroom);
  } catch (error) {
    console.error("Error fetching classroom:", error);
    return NextResponse.json({ error: "Failed to fetch classroom" }, { status: 500 });
  }
}
