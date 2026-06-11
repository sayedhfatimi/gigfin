"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { AddDialog } from "@/components/add-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { ExpensePanel } from "./_components/expense-panel";
import { ExpenseForm } from "./_components/forms/expense-form";
import { IncomeForm } from "./_components/forms/income-form";
import { IncomePanel } from "./_components/income-panel";
import { MileageActions } from "./_components/mileage-actions";
import { MileagePanel } from "./_components/mileage-panel";
import { RecurringSheet } from "./_components/recurring-sheet";
import { ShiftActions } from "./_components/shift-actions";
import { ShiftPanel } from "./_components/shift-panel";

export default function LogsPage() {
  const profile = useQuery(api.profiles.getMine);
  const currency = profile?.currency ?? "GBP";
  const odometerUnit = profile?.odometerUnit ?? "km";
  const [tab, setTab] = useState("income");

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as string)}
      className="gap-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Logs</h1>
          <p className="text-muted-foreground text-sm">
            Record income, expenses, mileage and shifts — search, filter and
            edit inline.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TabsList>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="mileage">Mileage</TabsTrigger>
            <TabsTrigger value="shifts">Shifts</TabsTrigger>
          </TabsList>
          {tab === "income" && (
            <AddDialog title="Add income">
              {(close) => <IncomeForm onDone={close} />}
            </AddDialog>
          )}
          {tab === "expenses" && (
            <>
              <RecurringSheet currency={currency} />
              <AddDialog title="Add expense">
                {(close) => <ExpenseForm onDone={close} />}
              </AddDialog>
            </>
          )}
          {tab === "mileage" && <MileageActions />}
          {tab === "shifts" && <ShiftActions />}
        </div>
      </div>

      <TabsContent value="income">
        <IncomePanel currency={currency} active={tab === "income"} />
      </TabsContent>
      <TabsContent value="expenses">
        <ExpensePanel currency={currency} active={tab === "expenses"} />
      </TabsContent>
      <TabsContent value="mileage">
        <MileagePanel odometerUnit={odometerUnit} active={tab === "mileage"} />
      </TabsContent>
      <TabsContent value="shifts">
        <ShiftPanel active={tab === "shifts"} />
      </TabsContent>
    </Tabs>
  );
}
