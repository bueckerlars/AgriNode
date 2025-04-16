import React, { useState, useEffect } from 'react';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ClipboardIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export const Settings: React.FC = () => {
  const { apiKeys, loading, error, fetchApiKeys, createApiKey, deleteApiKey } = useApiKeys();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [dialogKey, setDialogKey] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleToggleVisibility = (id: string, key: string) => {
    if (visibleKeys[id]) {
      setVisibleKeys(prev => ({ ...prev, [id]: false }));
    } else {
      const element = document.getElementById(`key-${id}`);
      if (element && element.scrollWidth > element.clientWidth) {
        handleOpenDialog(key);
      } else {
        setVisibleKeys(prev => ({ ...prev, [id]: true }));
      }
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Schlüssel kopiert!');
  };

  const handleOpenDialog = (key: string) => {
    setDialogKey(key);
  };

  const handleCloseDialog = () => {
    setDialogKey(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }
    try {
      setSubmitting(true);
      await createApiKey(name.trim());
      setName('');
    } catch {
      // Fehler wird bereits in Context behandelt
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('API-Schlüssel wirklich löschen?')) return;
    try {
      await deleteApiKey(id);
    } catch {
      // Fehler wird bereits angezeigt
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Einstellungen</h1>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">API-Schlüssel verwalten</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex items-center space-x-2 mb-4">
            <Input
              placeholder="Name für neuen Schlüssel"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={submitting}
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Erstelle...' : 'Erstellen'}
            </Button>
          </form>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          <div className="overflow-x-auto">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Name</TableHead>
                  <TableHead className="w-1/2">Schlüssel</TableHead>
                  <TableHead className="w-1/4">Erstellt am</TableHead>
                  <TableHead className="w-1/4">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map(key => (
                  <TableRow key={key.api_key_id}>
                    <TableCell>{key.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div id={`key-${key.api_key_id}`} className="w-full truncate">
                          {visibleKeys[key.api_key_id] ? (
                            <code className="font-mono text-sm break-all">{key.key}</code>
                          ) : (
                            <span className="font-mono text-sm">••••••••••••••••</span>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleCopyKey(key.key)}>
                          <ClipboardIcon className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => handleToggleVisibility(key.api_key_id, key.key)}>
                          {visibleKeys[key.api_key_id] ? (
                            <EyeOffIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(key.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(key.api_key_id)}>
                        Löschen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {dialogKey && (
        <Dialog open={!!dialogKey}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API-Schlüssel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <code className="block font-mono text-sm break-all">{dialogKey}</code>
              <Button onClick={() => handleCopyKey(dialogKey)}>Kopieren</Button>
            </div>
            <DialogFooter>
              <Button onClick={handleCloseDialog}>Schließen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
