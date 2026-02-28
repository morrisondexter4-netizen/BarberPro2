"use client";

import { useState, useCallback, useEffect } from "react";
import PageContainer from "@/components/ui/PageContainer";
import ShopDetailsCard from "./ShopDetailsCard";
import BarbersCard from "./BarbersCard";
import ServicesCard from "./ServicesCard";
import NotificationsCard from "./NotificationsCard";
import {
  DAYS,
  type ShopDetailsState,
  type Barber,
  type Service,
  type DayKey,
} from "./types";
import { BARBERS } from "@/lib/mock-data";
import type { Barber as LibBarber } from "@/lib/types";

const STORAGE_KEY = "barberpro.shopSettings.barbers";

const DAY_KEY_TO_NUM: Record<DayKey, number> = {
  Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0,
};
const DAY_NUM_TO_KEY: Record<number, DayKey> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

function libBarberToLocal(lib: LibBarber): Barber {
  return {
    id: lib.id,
    name: lib.name,
    color: lib.color as Barber["color"],
    workingDays: lib.workDays.map((n) => DAY_NUM_TO_KEY[n]).filter(Boolean),
    startTime: "09:00",
    endTime: "18:00",
    lunchEnabled: !!lib.lunchBreak,
    lunchStart: lib.lunchBreak?.start ?? "12:00",
    lunchEnd: lib.lunchBreak?.end ?? "13:00",
  };
}

function localBarberToLib(local: Barber): LibBarber {
  return {
    id: local.id,
    name: local.name,
    color: local.color,
    workDays: local.workingDays.map((d) => DAY_KEY_TO_NUM[d]),
    lunchBreak: local.lunchEnabled
      ? { start: local.lunchStart, end: local.lunchEnd }
      : undefined,
  };
}

function defaultHours(): ShopDetailsState["hours"] {
  const entries = DAYS.map((day) => [
    day,
    {
      open: day !== "Sun",
      openTime: "09:00",
      closeTime: "18:00",
    },
  ]) as [DayKey, ShopDetailsState["hours"][DayKey]][];
  return Object.fromEntries(entries) as ShopDetailsState["hours"];
}

function initialShopDetails(): ShopDetailsState {
  return {
    shopName: "Classic Cuts",
    address: "123 Main St, Your City",
    phone: "(555) 123-4567",
    hours: defaultHours(),
  };
}

function loadBarbersFromStorage(): Barber[] {
  if (typeof window === "undefined") return BARBERS.map(libBarberToLocal);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return BARBERS.map(libBarberToLocal);
    const parsed = JSON.parse(raw) as LibBarber[];
    return Array.isArray(parsed) ? parsed.map(libBarberToLocal) : BARBERS.map(libBarberToLocal);
  } catch {
    return BARBERS.map(libBarberToLocal);
  }
}

function initialServices(): Service[] {
  return [
    { id: "s1", name: "Haircut", durationMinutes: 30, price: 25 },
    { id: "s2", name: "Beard Trim", durationMinutes: 15, price: 12 },
    { id: "s3", name: "Haircut + Beard", durationMinutes: 45, price: 35 },
    { id: "s4", name: "Kids Cut", durationMinutes: 20, price: 18 },
  ];
}

const NEW_BARBER_TEMPLATE: Barber = {
  id: "",
  name: "",
  color: "blue",
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  startTime: "09:00",
  endTime: "18:00",
  lunchEnabled: false,
  lunchStart: "12:00",
  lunchEnd: "13:00",
};

const NEW_SERVICE_TEMPLATE: Service = {
  id: "",
  name: "",
  durationMinutes: 30,
  price: 0,
};

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export default function ShopSettingsPage() {
  const [shopDetails, setShopDetails] = useState<ShopDetailsState>(initialShopDetails);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>(initialServices);

  useEffect(() => {
    setBarbers(loadBarbersFromStorage());
  }, []);

  useEffect(() => {
    if (barbers.length === 0) return;
    const lib = barbers.map(localBarberToLib);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lib));
    } catch (_) {}
  }, [barbers]);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [removeBarberTarget, setRemoveBarberTarget] = useState<Barber | null>(null);
  const [removeServiceTarget, setRemoveServiceTarget] = useState<Service | null>(null);

  const handleSaveShopDetails = useCallback(() => {
    setSaveMessage("Saved (local only)");
    setTimeout(() => setSaveMessage(null), 3000);
  }, []);

  const openAddBarber = useCallback(() => {
    setEditingBarber({ ...NEW_BARBER_TEMPLATE });
  }, []);

  const openEditBarber = useCallback((barber: Barber) => {
    setEditingBarber({ ...barber });
  }, []);

  const saveBarber = useCallback((barber: Barber) => {
    if (barber.id) {
      setBarbers((prev) => prev.map((b) => (b.id === barber.id ? barber : b)));
    } else {
      setBarbers((prev) => [...prev, { ...barber, id: nextId("barber") }]);
    }
    setEditingBarber(null);
  }, []);

  const requestRemoveBarber = useCallback((barber: Barber) => setRemoveBarberTarget(barber), []);
  const confirmRemoveBarber = useCallback(() => {
    if (removeBarberTarget) {
      setBarbers((prev) => prev.filter((b) => b.id !== removeBarberTarget.id));
      setRemoveBarberTarget(null);
    }
  }, [removeBarberTarget]);
  const closeRemoveBarberConfirm = useCallback(() => setRemoveBarberTarget(null), []);

  const handleBarberLunchChange = useCallback(
    (barberId: string, lunchBreak: { start: string; end: string } | null) => {
      setBarbers((prev) =>
        prev.map((b) =>
          b.id === barberId
            ? {
                ...b,
                lunchEnabled: !!lunchBreak,
                lunchStart: lunchBreak?.start ?? "12:00",
                lunchEnd: lunchBreak?.end ?? "13:00",
              }
            : b
        )
      );
    },
    []
  );

  const openAddService = useCallback(() => {
    setEditingService({ ...NEW_SERVICE_TEMPLATE });
  }, []);

  const openEditService = useCallback((service: Service) => {
    setEditingService({ ...service });
  }, []);

  const saveService = useCallback((service: Service) => {
    if (service.id) {
      setServices((prev) => prev.map((s) => (s.id === service.id ? service : s)));
    } else {
      setServices((prev) => [...prev, { ...service, id: nextId("service") }]);
    }
    setEditingService(null);
  }, []);

  const requestRemoveService = useCallback((service: Service) => setRemoveServiceTarget(service), []);
  const confirmRemoveService = useCallback(() => {
    if (removeServiceTarget) {
      setServices((prev) => prev.filter((s) => s.id !== removeServiceTarget.id));
      setRemoveServiceTarget(null);
    }
  }, [removeServiceTarget]);
  const closeRemoveServiceConfirm = useCallback(() => setRemoveServiceTarget(null), []);

  return (
    <PageContainer title="Shop Settings">
      <p className="text-sm text-gray-500 mb-6">Manage shop details, barbers, and services.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ShopDetailsCard
            details={shopDetails}
            onChange={setShopDetails}
            onSave={handleSaveShopDetails}
            saveMessage={saveMessage}
          />
          <NotificationsCard />
        </div>
        <div className="space-y-6">
          <BarbersCard
            barbers={barbers}
            editingBarber={editingBarber}
            removeTarget={removeBarberTarget}
            onAdd={openAddBarber}
            onEdit={openEditBarber}
            onSaveBarber={saveBarber}
            onCloseModal={() => setEditingBarber(null)}
            onRemoveRequest={requestRemoveBarber}
            onConfirmRemove={confirmRemoveBarber}
            onCloseConfirm={closeRemoveBarberConfirm}
            onBarberLunchChange={handleBarberLunchChange}
          />
          <ServicesCard
            services={services}
            editingService={editingService}
            removeTarget={removeServiceTarget}
            onAdd={openAddService}
            onEdit={openEditService}
            onSaveService={saveService}
            onCloseModal={() => setEditingService(null)}
            onRemoveRequest={requestRemoveService}
            onConfirmRemove={confirmRemoveService}
            onCloseConfirm={closeRemoveServiceConfirm}
          />
        </div>
      </div>
    </PageContainer>
  );
}
