import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DashboardSearchProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
}

export const DashboardSearch = ({
    searchQuery,
    onSearchChange
}: DashboardSearchProps) => {
    return (
        <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
                className="pl-9"
                placeholder="Sensoren durchsuchen..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
    );
};

export default DashboardSearch;