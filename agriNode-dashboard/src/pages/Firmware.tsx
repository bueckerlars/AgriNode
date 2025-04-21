import React from 'react';
import { useFirmware } from '../contexts/FirmwareContext';
import { FirmwareUploadDialog } from '../components/FirmwareUploadDialog';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Check, Trash2, Zap } from 'lucide-react';
import { format } from 'date-fns';

export default function Firmware() {
  const { firmwareList, isLoading, setActiveFirmware, deleteFirmware } = useFirmware();

  const handleSetActive = async (firmwareId: string) => {
    try {
      await setActiveFirmware(firmwareId);
    } catch (error) {
      // Error handling is done in FirmwareContext
    }
  };

  const handleDelete = async (firmwareId: string) => {
    try {
      await deleteFirmware(firmwareId);
    } catch (error) {
      // Error handling is done in FirmwareContext
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Firmware Management</h1>
        <FirmwareUploadDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Firmware Versions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {firmwareList.map((firmware) => (
                  <TableRow key={firmware.firmware_id}>
                    <TableCell className="font-medium">{firmware.version}</TableCell>
                    <TableCell>
                      {firmware.active && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(firmware.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!firmware.active && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetActive(firmware.firmware_id)}
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Set Active
                          </Button>
                        )}
                        {!firmware.active && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(firmware.firmware_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {firmwareList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No firmware versions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}