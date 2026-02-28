"use client";

const cardClass = "rounded-2xl border border-gray-100 bg-white shadow-sm";
const headerClass = "text-lg font-bold text-gray-900";
const metaClass = "text-xs text-gray-500";

export default function NotificationsCard() {
  return (
    <div className={cardClass}>
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className={headerClass}>Notifications</h2>
      </div>
      <div className="px-4 py-4">
        <p className={metaClass}>Coming soon</p>
      </div>
    </div>
  );
}
