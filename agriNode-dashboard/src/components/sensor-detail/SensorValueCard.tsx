import { LucideIcon } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface SensorValueCardProps {
  icon: LucideIcon;
  iconColorClass: string;
  label: string;
  value: string;
  isLoading?: boolean;
}

export const SensorValueCard = ({
  icon: Icon,
  iconColorClass,
  label,
  value,
  isLoading = false,
}: SensorValueCardProps) => {
  return (
    <div className="flex flex-col p-4 bg-agrinode-light rounded-lg">
      <div className="flex items-center mb-2">
        <Icon className={`${iconColorClass} mr-2`} size={20} />
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold h-9 flex items-center">
        {isLoading ? (
          <LoadingSpinner size="sm" className={iconColorClass} />
        ) : (
          value
        )}
      </div>
    </div>
  );
};