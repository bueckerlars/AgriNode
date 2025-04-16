import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import { SidebarInset } from "./ui/sidebar";

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout = ({children}: AppLayoutProps) => {
    const { open } = useSidebar();

    return (
        <div className="min-h-screen flex w-full">
              <AppSidebar />
              <SidebarInset>
                {!open && <div className="p-4"><SidebarTrigger /></div>}
                {children}
              </SidebarInset>
        </div>
    );
};