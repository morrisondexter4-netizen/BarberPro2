import AppShell from "@/components/shell/AppShell"
import { BarberProProvider } from "@/lib/barberpro-context"

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  return (
    <BarberProProvider>
      <AppShell>{children}</AppShell>
    </BarberProProvider>
  )
}
