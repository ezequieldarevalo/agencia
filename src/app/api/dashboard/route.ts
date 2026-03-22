import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const vehicles = await prisma.vehicle.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: { supplier: true, buyer: true },
  });

  const movements = await prisma.cashMovement.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  });

  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  const monthlyOps = months.map((month, i) => {
    const monthVehicles = vehicles.filter((v) => v.createdAt.getMonth() === i);
    return {
      month,
      compras: monthVehicles.filter((v) => v.status !== "VENDIDO").length,
      ventas: monthVehicles.filter((v) => v.status === "VENDIDO").length,
    };
  });

  const profitability = months.map((month, i) => {
    const monthMovements = movements.filter((m) => m.date.getMonth() === i);
    const income = monthMovements.filter((m) => m.type === "INGRESO").reduce((s, m) => s + m.amountARS, 0);
    const expense = monthMovements.filter((m) => m.type === "EGRESO").reduce((s, m) => s + m.amountARS, 0);
    return { month, actual: income - expense, anterior: 0 };
  });

  const currentMonth = new Date().getMonth();
  const thisMonthVehicles = vehicles.filter((v) => v.createdAt.getMonth() === currentMonth);
  const thisMonthMovements = movements.filter((m) => m.date.getMonth() === currentMonth);

  const details = thisMonthVehicles
    .filter((v) => v.status === "VENDIDO")
    .map((v) => ({
      vehicle: v.name,
      cost: v.priceARS || 0,
      income: (v.priceARS || 0) * 1.15,
      profit: (v.priceARS || 0) * 0.15,
    }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59);

  const todayIncome = movements
    .filter((m) => m.date >= today && m.date <= todayEnd && m.type === "INGRESO")
    .reduce((s, m) => s + m.amountARS, 0);

  return NextResponse.json({
    monthlyOps,
    profitability,
    details,
    stats: {
      totalOps: thisMonthVehicles.length,
      totalProfit: thisMonthMovements.filter((m) => m.type === "INGRESO").reduce((s, m) => s + m.amountARS, 0) - thisMonthMovements.filter((m) => m.type === "EGRESO").reduce((s, m) => s + m.amountARS, 0),
      vehicles: await prisma.vehicle.count({ where: { status: "DISPONIBLE" } }),
      todayIncome,
    },
  });
}
