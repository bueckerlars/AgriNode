import AppSidebar from "./AppSidebar";
import { SidebarInset } from "./ui/sidebar";

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout = ({children}: AppLayoutProps) => {

    return (
        <div className="min-h-screen flex w-full">
              <AppSidebar />
              <SidebarInset>
                {children}
              </SidebarInset>
        </div>
    );
}