import { Home, Plus, BarChart, Settings, Leaf, User, LogOut, Code } from "lucide-react";
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
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Funktion, um die Initialen des Benutzers zu erhalten
  const getUserInitials = () => {
    if (!user || !user.username) return "UN";
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="py-6">
        <div className="flex justify-between flex-row items-center px-4">
          <div className="flex flex-row gap-2">
            <Leaf size={28} className="text-white" />
            <span className="text-xl font-bold text-white">AgriNode</span>
          </div>
          <SidebarTrigger/>
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
                <SidebarMenuButton
                  className={isActive("/analysis") ? "bg-sidebar-primary text-white" : ""}
                  onClick={() => navigate("/analysis")}
                >
                  <BarChart />
                  <span>Analysen</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/settings")}
                >
                  <Settings />
                  <span>Einstellungen</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {user?.role === 'admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={isActive("/firmware") ? "bg-sidebar-primary text-white" : ""}
                    onClick={() => navigate("/firmware")}
                  >
                    <Code />
                    <span>Firmware</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
          <DropdownMenu >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center w-full justify-start gap-3 hover:bg-sidebar-primary hover:text-white p-4 rounded-md">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-sidebar-primary text-white text-sm">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{user?.username || "Benutzer"}</span>
                  <span className="text-xs text-white/70">{user?.email || ""}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Abmelden</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;