"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBarberPro } from "@/lib/barberpro-context";
import { useUserRole } from "@/lib/auth";
import {
  filterByBarber,
  filterByTimePeriod,
  calculateMetrics,
  TimePeriod,
} from "@/components/metrics/metrics-utils";
import MetricCard from "@/components/metrics/MetricCard";
import BarberFilter from "@/components/metrics/BarberFilter";
import TimePeriodToggle from "@/components/metrics/TimePeriodToggle";

function DollarIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function CashIcon() {
  return (
    <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const role = useUserRole();
  const [selectedBarberId, setSelectedBarberId] = useState<string>("all");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");
  const { appointments, services } = useBarberPro();

  useEffect(() => {
    if (role === "barber") router.replace("/dashboard");
  }, [role, router]);

  const metrics = useMemo(() => {
    const byBarber = filterByBarber(appointments, selectedBarberId);
    const byTime = filterByTimePeriod(byBarber, timePeriod);
    return calculateMetrics(byTime, services);
  }, [appointments, services, selectedBarberId, timePeriod]);

  const periodLabel =
    timePeriod === "day" ? "today" : timePeriod === "week" ? "this week" : "this month";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Metrics</h1>
        <p className="text-sm text-gray-500 mt-1">Business overview</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <BarberFilter value={selectedBarberId} onChange={setSelectedBarberId} />
        <TimePeriodToggle value={timePeriod} onChange={setTimePeriod} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          label="Revenue"
          value={`$${metrics.revenue.toLocaleString()}`}
          subtitle={`From paid appointments ${periodLabel}`}
          icon={<DollarIcon />}
          accentColor="bg-emerald-50"
        />
        <MetricCard
          label="Appointments"
          value={String(metrics.totalAppointments)}
          subtitle={`Total booked ${periodLabel}`}
          icon={<CalendarIcon />}
          accentColor="bg-blue-50"
        />
        <MetricCard
          label="Clients Served"
          value={String(metrics.clientsServed)}
          subtitle={`Completed & paid ${periodLabel}`}
          icon={<UsersIcon />}
          accentColor="bg-violet-50"
        />
        <MetricCard
          label="No-Shows"
          value={String(metrics.noShows)}
          subtitle={`Missed appointments ${periodLabel}`}
          icon={<AlertIcon />}
          accentColor="bg-rose-50"
        />
        <MetricCard
          label="Cash Revenue"
          value={`$${metrics.cashRevenue.toLocaleString()}`}
          subtitle={`${metrics.cashCount} cash payment${metrics.cashCount !== 1 ? "s" : ""} ${periodLabel}`}
          icon={<CashIcon />}
          accentColor="bg-teal-50"
        />
        <MetricCard
          label="Card Revenue"
          value={`$${metrics.cardRevenue.toLocaleString()}`}
          subtitle={`${metrics.cardCount} card payment${metrics.cardCount !== 1 ? "s" : ""} ${periodLabel}`}
          icon={<CardIcon />}
          accentColor="bg-indigo-50"
        />
      </div>
    </div>
  );
}
