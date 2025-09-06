import "@/app/globals.css";
import Sidebar from "../components/ui/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar/>

      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
