import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(employees);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { firstName, lastName, email, password, phone, area, dni, province, city, street, streetNumber } = body;

  let userId: string | undefined;
  if (email && password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name: `${firstName} ${lastName}`, role: area === "ADMIN" ? "ADMIN" : "USER" },
    });
    userId = user.id;
  }

  const employee = await prisma.employee.create({
    data: {
      firstName, lastName, email, phone: phone || null, area,
      dni: dni || null, province: province || null, city: city || null,
      street: street || null, streetNumber: streetNumber || null,
      userId,
    },
  });

  return NextResponse.json(employee, { status: 201 });
}
