export default function PageContainer({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
      {children ?? <p className="text-gray-500">Content coming soon.</p>}
    </div>
  );
}
