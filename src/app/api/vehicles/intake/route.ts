import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  // 1. Create or find the vehicle
  let vehicleId: string | null = null;
  if (body.vehicle && body.vehicle.name) {
    const vehicle = await prisma.vehicle.create({
      data: {
        name: body.vehicle.name,
        brand: body.vehicle.brand || null,
        model: body.vehicle.model || null,
        year: body.vehicle.year ? parseInt(body.vehicle.year) : null,
        version: body.vehicle.version || null,
        domain: body.vehicle.domain || null,
        engineNumber: body.vehicle.engineNumber || null,
        chassisNumber: body.vehicle.chassisNumber || null,
        kilometers: body.vehicle.kilometers ? parseInt(body.vehicle.kilometers) : null,
        fuel: body.vehicle.fuel || null,
        color: body.vehicle.color || null,
        category: body.vehicle.category || "AUTOS_Y_CAMIONETAS",
        status: "EN_PROCESO",
      },
    });
    vehicleId = vehicle.id;
  }

  // 2. Create the intake
  const intake = await prisma.vehicleIntake.create({
    data: {
      vehicleId,
      sellerId: body.seller?.id || null,
      buyerId: body.buyer?.id || null,
      purchasePrice: body.purchasePrice || null,
      currency: "ARS",
    },
  });

  // 3. Create checks and tasks
  const allChecks = [
    ...(body.conditionChecks || []),
    ...(body.documentChecks || []),
  ];

  for (let i = 0; i < allChecks.length; i++) {
    const c = allChecks[i];
    const check = await prisma.intakeCheck.create({
      data: {
        intakeId: intake.id,
        category: c.category,
        label: c.label,
        checked: c.checked || false,
        order: i,
      },
    });

    // Create tasks for this check
    if (c.tasks && Array.isArray(c.tasks)) {
      for (const t of c.tasks) {
        const task = await prisma.intakeTask.create({
          data: {
            intakeId: intake.id,
            checkId: check.id,
            title: t.title,
            description: t.description || null,
            status: t.status || "TODO",
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            dueTime: t.dueTime || null,
            supplierId: t.supplierId || null,
            rating: t.rating || null,
          },
        });

        // Create expenses for this task
        if (t.expenses && Array.isArray(t.expenses)) {
          for (const e of t.expenses) {
            await prisma.taskExpense.create({
              data: {
                taskId: task.id,
                concept: e.concept,
                amount: e.amount || 0,
                currency: e.currency || "ARS",
                supplierId: e.supplierId || null,
                cashAccountId: e.cashAccountId || null,
              },
            });
          }
        }

        // Create calendar event if task has a due date
        if (t.dueDate) {
          await prisma.calendarEvent.create({
            data: {
              title: `Tarea: ${t.title}`,
              type: "OTRO",
              date: new Date(t.dueDate),
              allDay: !t.dueTime,
              description: t.description || null,
              vehicleId,
            },
          });
        }
      }
    }
  }

  // 4. Create payments
  if (body.payments && Array.isArray(body.payments)) {
    for (const p of body.payments) {
      await prisma.intakePayment.create({
        data: {
          intakeId: intake.id,
          concept: p.concept || "VIATICO",
          amount: p.amount || 0,
          currency: p.currency || "ARS",
          cashAccountId: p.cashAccountId || null,
        },
      });

      // Create cash movement if account selected
      if (p.cashAccountId && p.amount > 0) {
        await prisma.cashMovement.create({
          data: {
            type: "EGRESO",
            concept: `Alta vehículo - ${p.concept || "Viático"}`,
            category: "VIATICO",
            amountARS: p.currency === "ARS" ? p.amount : 0,
            amountUSD: p.currency === "USD" ? p.amount : 0,
            currency: p.currency || "ARS",
            cashAccountId: p.cashAccountId,
            vehicleId,
          },
        });

        // Update account balance
        await prisma.cashAccount.update({
          where: { id: p.cashAccountId },
          data: { currentBalance: { decrement: p.amount } },
        });
      }
    }
  }

  return NextResponse.json(intake, { status: 201 });
}

export async function GET() {
  const intakes = await prisma.vehicleIntake.findMany({
    include: {
      vehicle: { select: { id: true, name: true, domain: true, status: true } },
      seller: { select: { id: true, firstName: true, lastName: true } },
      buyer: { select: { id: true, firstName: true, lastName: true } },
      checks: { include: { tasks: true }, orderBy: { order: "asc" } },
      payments: true,
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(intakes);
}
