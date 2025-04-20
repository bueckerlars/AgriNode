import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiKeys } from '@/contexts/ApiKeysContext';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXPIRATION_OPTIONS = [
  { label: 'Nie', value: '0' },
  { label: '1 Tag', value: '86400' },
  { label: '7 Tage', value: '604800' },
  { label: '30 Tage', value: '2592000' },
  { label: '90 Tage', value: '7776000' },
  { label: '1 Jahr', value: '31536000' },
];

export const CreateApiKeyDialog: React.FC<CreateApiKeyDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [name, setName] = useState('');
  const [expiration, setExpiration] = useState('0');
  const { createApiKey } = useApiKeys();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expiresIn = parseInt(expiration);
      await createApiKey(name, expiresIn > 0 ? expiresIn : undefined);
      setName('');
      setExpiration('0');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API-Schlüssel erstellen</DialogTitle>
          <DialogDescription>
            Erstelle einen neuen API-Schlüssel mit optionaler Gültigkeitsdauer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="Mein API-Schlüssel"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="expiration" className="text-right">
                Gültigkeit
              </label>
              <Select
                value={expiration}
                onValueChange={setExpiration}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Wähle eine Gültigkeitsdauer" />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Erstellen</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};