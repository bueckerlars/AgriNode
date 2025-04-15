
import { Home, Plus, BarChart, Settings, Leaf } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="py-6">
        <div className="flex items-center space-x-2 px-4">
          <Leaf size={28} className="text-white" />
          <span className="text-xl font-bold text-white">AgriNode</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  className={isActive("/") ? "bg-sidebar-primary text-white" : ""}
                  onClick={() => navigate("/")}
                >
                  <Home />
                  <span>Übersicht</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => { /* Wird im AddSensorDialog behandelt */ }}
                >
                  <Plus />
                  <span>Sensor hinzufügen</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <BarChart />
                  <span>Analysen</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings />
                  <span>Einstellungen</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4">
          <p className="text-xs text-white/70">AgriNode Dashboard v1.0</p>
        </div>
      </SidebarFooter>
      <SidebarTrigger />
    </Sidebar>
  );
}

export default AppSidebar;
