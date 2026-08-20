import { Header } from "./header";
import { BottomNav } from "./bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <Header />
      <div className="flex flex-1 flex-col pb-16">{children}</div>
      <BottomNav />
    </div>
  );
}
