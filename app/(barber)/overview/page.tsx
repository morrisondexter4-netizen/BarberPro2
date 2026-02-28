import PageContainer from "@/components/ui/PageContainer";
import Link from "next/link";

export default function OverviewPage() {
  return (
    <PageContainer title="Overview">
      <p className="text-gray-500 text-sm mb-6">
        Welcome to BarberPro. Use the menu to navigate.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          Dashboard
        </Link>
        <Link
          href="/customers"
          className="px-4 py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-200"
        >
          Customers
        </Link>
        <Link
          href="/schedule"
          className="px-4 py-2 bg-gray-100 text-gray-900 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-200"
        >
          Schedule
        </Link>
      </div>
    </PageContainer>
  );
}
