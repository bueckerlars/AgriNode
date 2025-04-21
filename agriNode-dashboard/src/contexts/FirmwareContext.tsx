import React, { createContext, useContext, useState, useEffect } from 'react';
import { firmwareApi } from '../api/firmwareApi';
import { Firmware } from '../types/firmware';
import { useToast } from '../hooks/use-toast';
import { useAuth } from './AuthContext';

interface FirmwareContextType {
  firmwareList: Firmware[];
  isLoading: boolean;
  uploadFirmware: (formData: FormData) => Promise<void>;
  setActiveFirmware: (firmwareId: string) => Promise<void>;
  deleteFirmware: (firmwareId: string) => Promise<void>;
  refreshFirmwareList: () => Promise<void>;
}

const FirmwareContext = createContext<FirmwareContextType | undefined>(undefined);

export function FirmwareProvider({ children }: { children: React.ReactNode }) {
  const [firmwareList, setFirmwareList] = useState<Firmware[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const refreshFirmwareList = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const firmware = await firmwareApi.getAllFirmware();
      setFirmwareList(firmware);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load firmware list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFirmware = async (formData: FormData) => {
    try {
      await firmwareApi.uploadFirmware(formData);
      toast({
        title: "Success",
        description: "Firmware uploaded successfully",
      });
      await refreshFirmwareList();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload firmware",
        variant: "destructive",
      });
      throw error;
    }
  };

  const setActiveFirmware = async (firmwareId: string) => {
    try {
      await firmwareApi.setActiveFirmware(firmwareId);
      toast({
        title: "Success",
        description: "Firmware activated successfully",
      });
      await refreshFirmwareList();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate firmware",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteFirmware = async (firmwareId: string) => {
    try {
      await firmwareApi.deleteFirmware(firmwareId);
      toast({
        title: "Success",
        description: "Firmware deleted successfully",
      });
      await refreshFirmwareList();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete firmware",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      refreshFirmwareList();
    }
  }, [user]);

  return (
    <FirmwareContext.Provider
      value={{
        firmwareList,
        isLoading,
        uploadFirmware,
        setActiveFirmware,
        deleteFirmware,
        refreshFirmwareList,
      }}
    >
      {children}
    </FirmwareContext.Provider>
  );
}

export function useFirmware() {
  const context = useContext(FirmwareContext);
  if (context === undefined) {
    throw new Error('useFirmware must be used within a FirmwareProvider');
  }
  return context;
}