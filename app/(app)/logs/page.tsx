"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { ExpensePanel } from "./_components/expense-panel";
import { IncomePanel } from "./_components/income-panel";
import { MileagePanel } from "./_components/mileage-panel";
import { ShiftPanel } from "./_components/shift-panel";

export default function LogsPage() {
  const profile = useQuery(api.profiles.getMine);
  const currency = profile?.currency ?? "GBP";
  const odometerUnit = profile?.odometerUnit ?? "km";
  const [tab, setTab] = useState("income");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">Logs</h1>
        <p className="text-muted-foreground text-sm">
          Record income, expenses, mileage and shifts. Search, filter and edit
          inline — updates are live.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as string)}
        className="gap-4"
      >
        <TabsList>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="mileage">Mileage</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
        </TabsList>
        <TabsContent value="income">
          <IncomePanel currency={currency} active={tab === "income"} />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensePanel currency={currency} active={tab === "expenses"} />
        </TabsContent>
        <TabsContent value="mileage">
          <MileagePanel
            odometerUnit={odometerUnit}
            active={tab === "mileage"}
          />
        </TabsContent>
        <TabsContent value="shifts">
          <ShiftPanel active={tab === "shifts"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
