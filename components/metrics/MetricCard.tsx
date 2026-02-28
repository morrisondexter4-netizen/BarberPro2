import { Card } from "@/components/ui/Card";

type MetricCardProps = {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: string;
};

export default function MetricCard({
  label,
  value,
  subtitle,
  icon,
  accentColor = "bg-gray-100",
}: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${accentColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
