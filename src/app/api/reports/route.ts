import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // month, year, all

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "all":
        startDate = new Date(2000, 0, 1);
        break;
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all vehicles
    const vehicles = await prisma.vehicle.findMany({
      include: { buyer: true, supplier: true },
    });

    const totalVehicles = vehicles.length;
    const disponibles = vehicles.filter((v: any) => v.status === "DISPONIBLE").length;
    const vendidos = vehicles.filter((v: any) => v.status === "VENDIDO").length;
    const reservados = vehicles.filter((v: any) => v.status === "RESERVADO").length;
    const enProceso = vehicles.filter((v: any) => v.status === "EN_PROCESO").length;

    // Revenue from sold vehicles (purchase vs sale price)
    const soldVehicles = vehicles.filter(
      (v: any) => v.status === "VENDIDO" && v.salePrice && v.updatedAt >= startDate
    );
    const totalRevenue = soldVehicles.reduce(
      (sum: number, v: any) => sum + ((v.salePrice || 0) - (v.purchasePrice || 0)),
      0
    );
    const totalSales = soldVehicles.reduce((sum: number, v: any) => sum + (v.salePrice || 0), 0);
    const totalInvestment = vehicles
      .filter((v: any) => v.status === "DISPONIBLE" || v.status === "RESERVADO" || v.status === "EN_PROCESO")
      .reduce((sum: number, v: any) => sum + (v.purchasePrice || 0), 0);

    // Cash movements
    const movements = await prisma.cashMovement.findMany({
      where: { createdAt: { gte: startDate } },
      include: { cashAccount: true },
    });

    const ingresos = movements
      .filter((m: any) => m.type === "INGRESO")
      .reduce((sum: number, m: any) => sum + m.amountARS, 0);
    const egresos = movements
      .filter((m: any) => m.type === "EGRESO")
      .reduce((sum: number, m: any) => sum + m.amountARS, 0);

    // Monthly sales chart data (last 12 months)
    const monthlySales: { month: string; ventas: number; ingresos: number; egresos: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthLabel = d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });

      const monthVentas = vehicles.filter(
        (v: any) => v.status === "VENDIDO" && v.updatedAt >= d && v.updatedAt <= monthEnd
      ).length;

      const monthMovements = movements.filter(
        (m: any) => m.createdAt >= d && m.createdAt <= monthEnd
      );
      const monthIngresos = monthMovements
        .filter((m: any) => m.type === "INGRESO")
        .reduce((s: number, m: any) => s + m.amountARS, 0);
      const monthEgresos = monthMovements
        .filter((m: any) => m.type === "EGRESO")
        .reduce((s: number, m: any) => s + m.amountARS, 0);

      monthlySales.push({ month: monthLabel, ventas: monthVentas, ingresos: monthIngresos, egresos: monthEgresos });
    }

    // Top brands
    const brandCounts: Record<string, number> = {};
    vehicles.forEach((v: any) => {
      if (v.brand) brandCounts[v.brand] = (brandCounts[v.brand] || 0) + 1;
    });
    const topBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // Vehicle type distribution
    const typeCounts: Record<string, number> = {};
    vehicles.forEach((v: any) => {
      typeCounts[v.type] = (typeCounts[v.type] || 0) + 1;
    });
    const typeDistribution = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // Clients
    const clients = await prisma.client.count();
    const leads = await prisma.interaction.count({
      where: { createdAt: { gte: startDate } },
    });

    // Debts
    const debts = await prisma.debt.findMany({
      where: { status: { not: "PAGADA" } },
    });
    const totalDebt = debts.reduce((s: number, d: any) => s + (d.totalAmount - d.paidAmount), 0);
    const overdueDebts = debts.filter((d: any) => d.status === "VENCIDA").length;

    // Most profitable vehicles
    const topProfitable = soldVehicles
      .map((v: any) => ({
        name: v.name,
        domain: v.domain,
        profit: (v.salePrice || 0) - (v.purchasePrice || 0),
        margin: v.salePrice ? (((v.salePrice - (v.purchasePrice || 0)) / v.salePrice) * 100).toFixed(1) : "0",
      }))
      .sort((a: any, b: any) => b.profit - a.profit)
      .slice(0, 5);

    // Average days in stock for sold vehicles
    const avgDaysInStock = soldVehicles.length
      ? Math.round(
          soldVehicles.reduce(
            (s: number, v: any) =>
              s + (v.updatedAt.getTime() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24),
            0
          ) / soldVehicles.length
        )
      : 0;

    return NextResponse.json({
      inventory: {
        total: totalVehicles,
        disponibles,
        vendidos,
        reservados,
        enProceso,
        totalInvestment,
        avgDaysInStock,
      },
      financial: {
        totalRevenue,
        totalSales,
        ingresos,
        egresos,
        totalDebt,
        overdueDebts,
        avgProfit: soldVehicles.length ? Math.round(totalRevenue / soldVehicles.length) : 0,
      },
      monthlySales,
      topBrands,
      typeDistribution,
      topProfitable,
      clients,
      leads,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener reportes" }, { status: 500 });
  }
}
