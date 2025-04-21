import React, { createContext, useContext, useState, useEffect } from 'react';
import { firmwareApi } from '../api/firmwareApi';
import { Firmware } from '../types/firmware';
import { toast } from 'sonner';
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
  const { user } = useAuth();

  const refreshFirmwareList = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const firmware = await firmwareApi.getAllFirmware();
      setFirmwareList(firmware);
    } catch (error) {
      toast.error('Fehler beim Laden der Firmware-Liste');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFirmware = async (formData: FormData) => {
    try {
      await firmwareApi.uploadFirmware(formData);
      toast.success('Firmware erfolgreich hochgeladen');
      await refreshFirmwareList();
    } catch (error) {
      toast.error('Fehler beim Hochladen der Firmware');
      throw error;
    }
  };

  const setActiveFirmware = async (firmwareId: string) => {
    try {
      await firmwareApi.setActiveFirmware(firmwareId);
      toast.success('Firmware erfolgreich aktiviert');
      await refreshFirmwareList();
    } catch (error) {
      toast.error('Fehler beim Aktivieren der Firmware');
      throw error;
    }
  };

  const deleteFirmware = async (firmwareId: string) => {
    try {
      await firmwareApi.deleteFirmware(firmwareId);
      toast.success('Firmware erfolgreich gelöscht');
      await refreshFirmwareList();
    } catch (error) {
      toast.error('Fehler beim Löschen der Firmware');
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