import { Navbar } from '@/components/layout/Navbar';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <Breadcrumb />
      <main className="flex-1 w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
