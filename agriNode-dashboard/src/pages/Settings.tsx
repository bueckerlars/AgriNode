import React, { useState, useEffect, useMemo } from 'react';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { useUsers } from '@/contexts/UsersContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOllama } from '@/contexts/OllamaContext';
import authApi from '@/api/authApi';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertCircle, ClipboardIcon, EyeIcon, EyeOffIcon, RefreshCw, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const EXPIRATION_OPTIONS = [
  { label: 'Nie', value: '0' },
  { label: '1 Tag', value: '86400' },
  { label: '7 Tage', value: '604800' },
  { label: '30 Tage', value: '2592000' },
  { label: '90 Tage', value: '7776000' },
  { label: '1 Jahr', value: '31536000' },
];

const POPULAR_MODELS = [
  { name: 'deepseek-r1:8b', description: 'Kompaktes DeepSeek R1 8B Modell für generelle Aufgaben', size: '4 GB' },
  { name: 'llama3:8b', description: 'Llama 3 8B Modell mit guter Balance aus Leistung und Effizienz', size: '4 GB' },
  { name: 'llama3:70b', description: 'Llama 3 70B Vollversion für komplexe Aufgaben', size: '35 GB' },
  { name: 'mistral:7b', description: 'Kleines Mistral 7B Modell für Effizienz', size: '3.5 GB' },
  { name: 'dolphin-mistral:7b-v2.6', description: 'Optimiertes Mistral 7B für vielseitige Anfragen', size: '4 GB' },
  { name: 'phi3:14b', description: 'Microsoft Phi-3 14B Modell', size: '7 GB' }
];

const formatModelSize = (bytes?: number): string => {
  if (!bytes) return 'Unbekannt';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export const Settings: React.FC = () => {
  const { apiKeys, loading: apiKeysLoading, error: apiKeysError, fetchApiKeys, createApiKey, deleteApiKey } = useApiKeys();
  const { 
    users, 
    loading: usersLoading, 
    error: usersError, 
    registrationEnabled,
    fetchUsers, 
    updateUser, 
    deleteUser, 
    toggleRegistrationStatus 
  } = useUsers();

  const { 
    isConnected: ollamaConnected,
    statusMessage: ollamaStatusMessage,
    loading: ollamaLoading,
    availableModels,
    loadingModels,
    modelDetails,
    loadingModelDetails,
    installProgress,
    checkOllamaStatus,
    fetchAvailableModels,
    getModelDetails,
    installModel,
    deleteModel,
    cancelModelInstallation
  } = useOllama();
  
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [name, setName] = useState('');
  const [expiration, setExpiration] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [dialogKey, setDialogKey] = useState<string | null>(null);
  
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<{
    userId: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
    active: boolean;
  } | null>(null);

  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const [installModelDialogOpen, setInstallModelDialogOpen] = useState(false);
  const [modelToInstall, setModelToInstall] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [insecureInstall, setInsecureInstall] = useState(false);
  const [installingModel, setInstallingModel] = useState(false);
  
  const [modelDetailsDialogOpen, setModelDetailsDialogOpen] = useState(false);
  const [selectedModelName, setSelectedModelName] = useState<string | null>(null);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

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
    toast.success('Key copied!');
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
      toast.error('Please enter a name');
      return;
    }
    try {
      setSubmitting(true);
      const expiresIn = parseInt(expiration);
      await createApiKey(name.trim(), expiresIn > 0 ? expiresIn : undefined);
      setName('');
      setExpiration('0');
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete API key?')) return;
    try {
      await deleteApiKey(id);
    } catch {
    }
  };
  
  const handleToggleRegistration = async (enabled: boolean) => {
    if (!isAdmin) return;
    try {
      await toggleRegistrationStatus(enabled);
    } catch {
    }
  };
  
  const openEditUserDialog = (userId: string) => {
    const userToEdit = users.find(u => u.user_id === userId);
    if (!userToEdit) return;
    
    setEditingUser({
      userId: userToEdit.user_id,
      username: userToEdit.username,
      email: userToEdit.email,
      role: userToEdit.role,
      active: true
    });
    
    setUserDialogOpen(true);
  };

  const openNewUserDialog = () => {
    setNewUser({
      username: '',
      email: '',
      password: '',
      role: 'user'
    });
    setNewUserDialogOpen(true);
  };
  
  const handleCreateUser = async () => {
    if (!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setCreatingUser(true);
      await authApi.register({
        username: newUser.username.trim(),
        email: newUser.email.trim(),
        password: newUser.password.trim()
      });
      
      toast.success('User created successfully');
      setNewUserDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };
  
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    try {
      await updateUser(editingUser.userId, {
        username: editingUser.username,
        email: editingUser.email,
        role: editingUser.role,
        active: editingUser.active
      });
      setUserDialogOpen(false);
      setEditingUser(null);
    } catch {
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete user?')) return;
    
    try {
      await deleteUser(userId);
    } catch {
    }
  };

  const handleRefreshModels = async () => {
    await fetchAvailableModels();
  };

  const handleOpenInstallDialog = () => {
    setModelToInstall('');
    setCustomModel('');
    setInsecureInstall(false);
    setInstallModelDialogOpen(true);
  };

  const handleModelInstall = async () => {
    const modelName = modelToInstall === 'custom' ? customModel.trim() : modelToInstall;
    
    if (!modelName) {
      toast.error('Bitte wähle ein Modell aus oder gib einen Namen ein');
      return;
    }
    
    try {
      setInstallingModel(true);
      
      const success = await installModel({
        name: modelName,
        insecure: insecureInstall
      });
      
      if (success) {
        toast.success(`Installation von ${modelName} gestartet`);
        setInstallModelDialogOpen(false);
      } else {
        toast.error('Fehler beim Starten der Installation');
      }
    } catch (error) {
      console.error('Installation error:', error);
      toast.error('Fehler bei der Installation des Modells');
    } finally {
      setInstallingModel(false);
    }
  };

  const handleOpenModelDetails = async (modelName: string) => {
    setSelectedModelName(modelName);
    setModelDetailsDialogOpen(true);
    await getModelDetails(modelName);
  };

  const handleConfirmDeleteModel = (modelName: string) => {
    setModelToDelete(modelName);
    setConfirmDeleteDialogOpen(true);
  };

  const handleDeleteModel = async () => {
    if (!modelToDelete) return;
    
    try {
      const success = await deleteModel(modelToDelete);
      
      if (success) {
        if (modelDetailsDialogOpen) {
          setModelDetailsDialogOpen(false);
        }
        setConfirmDeleteDialogOpen(false);
        setModelToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      toast.error(`Fehler beim Löschen des Modells ${modelToDelete}`);
    }
  };

  const handleCancelDownload = async (modelName: string) => {
    try {
      const success = await cancelModelInstallation(modelName);
      
      if (success) {
        toast.success(`Download von ${modelName} wurde abgebrochen`);
      }
    } catch (error) {
      console.error(`Error cancelling download for ${modelName}:`, error);
      toast.error(`Fehler beim Abbrechen des Downloads für ${modelName}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Manage API Keys</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4 mb-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Name for new key"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={submitting}
              />
              <Select
                value={expiration}
                onValueChange={setExpiration}
                disabled={submitting}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>

          {apiKeysError && <p className="text-red-600 mb-4">{apiKeysError}</p>}

          <div className="overflow-x-auto">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/4">Name</TableHead>
                  <TableHead className="w-1/3">Key</TableHead>
                  <TableHead className="w-1/6">Created</TableHead>
                  <TableHead className="w-1/6">Expires</TableHead>
                  <TableHead className="w-1/6">Actions</TableHead>
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
                    <TableCell>{new Date(key.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {key.expiration_date ? new Date(key.expiration_date).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(key.api_key_id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-xl font-semibold">Modell Management</h2>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={checkOllamaStatus} 
              disabled={ollamaLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${ollamaLoading ? 'animate-spin' : ''}`} />
              Status prüfen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!ollamaConnected && !ollamaLoading ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {ollamaStatusMessage || "Keine Verbindung zum Ollama-Dienst möglich. KI-Modelle können nicht verwaltet werden."}
              </AlertDescription>
            </Alert>
          ) : ollamaLoading ? (
            <div className="flex justify-center items-center h-20">
              <Loader className="h-6 w-6 animate-spin" />
              <span className="ml-2">Prüfe Ollama-Verbindung...</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-muted-foreground">
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Verbunden mit Ollama
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    size="sm"
                    onClick={handleRefreshModels}
                    disabled={loadingModels}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loadingModels ? 'animate-spin' : ''}`} />
                    Modelle aktualisieren
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleOpenInstallDialog}
                  >
                    Modell installieren
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableModels.length === 0 && loadingModels && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6">
                          <Loader className="h-5 w-5 animate-spin mx-auto" />
                          <span className="text-sm text-muted-foreground mt-2 block">Lade Modelle...</span>
                        </TableCell>
                      </TableRow>
                    )}
                    {availableModels.length === 0 && !loadingModels && Object.keys(installProgress).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6">
                          <span className="text-muted-foreground">Keine Modelle installiert</span>
                        </TableCell>
                      </TableRow>
                    )}
                    {/* Zeige die installierten Modelle */}
                    {availableModels.map(model => {
                      const progress = installProgress[model.name];
                      const isInstalling = progress && !progress.completed;
                      
                      return (
                        <TableRow key={model.name}>
                          <TableCell className="font-semibold">{model.name}</TableCell>
                          <TableCell>{model.description}</TableCell>
                          <TableCell>
                            {isInstalling ? (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs">{progress.status}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(progress.progress * 100)}%
                                  </span>
                                </div>
                                <Progress value={progress.progress * 100} className="h-1" />
                              </div>
                            ) : (
                              <span className="inline-flex items-center text-xs">
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                                Bereit
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleOpenModelDetails(model.name)}
                                disabled={isInstalling}
                              >
                                Details
                              </Button>
                              <Button 
                                size="sm"
                                variant="destructive"
                                onClick={() => handleConfirmDeleteModel(model.name)}
                                disabled={isInstalling}
                              >
                                Löschen
                              </Button>
                              {isInstalling && (
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelDownload(model.name)}
                                >
                                  Abbrechen
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {/* Zeige Modelle, die installiert werden, aber noch nicht in der Liste sind */}
                    {Object.entries(installProgress)
                      .filter(([modelName, progress]) => !progress.completed && !availableModels.some(m => m.name === modelName))
                      .map(([modelName, progress]) => {
                        const progressPercent = Math.round(progress.progress * 100);
                        const description = POPULAR_MODELS.find(m => m.name === modelName)?.description || 'Installation läuft...';
                        
                        return (
                          <TableRow key={modelName}>
                            <TableCell className="font-semibold">{modelName}</TableCell>
                            <TableCell>{description}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs">{progress.status}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {progressPercent}%
                                  </span>
                                </div>
                                <Progress value={progressPercent} className="h-1" />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelDownload(modelName)}
                                >
                                  Abbrechen
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    }
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">User Management</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="registration" 
                  checked={registrationEnabled}
                  onCheckedChange={handleToggleRegistration}
                />
                <Label htmlFor="registration">Allow registration for new users</Label>
              </div>
              <Button onClick={openNewUserDialog}>Add User</Button>
            </div>

            {usersError && <p className="text-red-600 mb-4">{usersError}</p>}

            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registered at</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(listUser => {
                    const isCurrentUser = user && listUser.user_id === user.user_id;
                    
                    return (
                      <TableRow key={listUser.user_id}>
                        <TableCell>{listUser.username}</TableCell>
                        <TableCell>{listUser.email}</TableCell>
                        <TableCell>
                          {listUser.role === 'admin' ? 'Administrator' : 'User'}
                        </TableCell>
                        <TableCell>{new Date(listUser.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => openEditUserDialog(listUser.user_id)}
                              disabled={isCurrentUser}
                              title={isCurrentUser ? "You cannot edit your own account here" : "Edit user"}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              onClick={() => handleDeleteUser(listUser.user_id)}
                              disabled={isCurrentUser}
                              title={isCurrentUser ? "You cannot delete your own account" : "Delete user"}
                            >
                              Delete
                            </Button>
                            {isCurrentUser && (
                              <span className="text-xs text-muted-foreground self-center ml-2">
                                (Current user)
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {dialogKey && (
        <Dialog open={!!dialogKey} onOpenChange={() => setDialogKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <code className="block font-mono text-sm break-all">{dialogKey}</code>
              <Button onClick={() => handleCopyKey(dialogKey)}>Copy</Button>
            </div>
            <DialogFooter>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {editingUser && (
        <Dialog open={userDialogOpen} onOpenChange={open => {
          setUserDialogOpen(open);
          if (!open) setEditingUser(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username"
                  value={editingUser.username} 
                  onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  value={editingUser.email} 
                  onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={editingUser.role}
                  onValueChange={(value: 'admin' | 'user') => 
                    setEditingUser({...editingUser, role: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="active" 
                  checked={editingUser.active}
                  onCheckedChange={checked => 
                    setEditingUser({...editingUser, active: checked})
                  }
                />
                <Label htmlFor="active">User active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setUserDialogOpen(false);
                setEditingUser(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={newUserDialogOpen} onOpenChange={open => {
        setNewUserDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username *</Label>
              <Input 
                id="new-username"
                value={newUser.username} 
                onChange={e => setNewUser({...newUser, username: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email *</Label>
              <Input 
                id="new-email"
                type="email"
                value={newUser.email} 
                onChange={e => setNewUser({...newUser, email: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password *</Label>
              <Input 
                id="new-password"
                type="password"
                value={newUser.password} 
                onChange={e => setNewUser({...newUser, password: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Role</Label>
              <Select 
                value={newUser.role}
                onValueChange={(value: 'admin' | 'user') => 
                  setNewUser({...newUser, role: value})
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={creatingUser}>
              {creatingUser ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={installModelDialogOpen} onOpenChange={setInstallModelDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modell installieren</DialogTitle>
            <DialogDescription>
              Wähle ein voreingestelltes Modell oder gib einen benutzerdefinierten Namen ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="model">Modell</Label>
              <Select
                value={modelToInstall}
                onValueChange={setModelToInstall}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Modell auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_MODELS.map(model => (
                    <SelectItem key={model.name} value={model.name}>
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.description} ({model.size})</span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Benutzerdefiniertes Modell...</SelectItem>
                </SelectContent>
              </Select>
              
              {modelToInstall === 'custom' && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="custom-model">Modellname</Label>
                  <Input
                    id="custom-model"
                    placeholder="z.B. llama2:7b-chat-q4_K_M"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Gib den vollständigen Namen des Modells ein, wie er in Ollama verwendet wird.
                    Beispiele: llama2:7b oder mixtral:8x7b-instruct-v0.1-q5_K_M
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="insecure" 
                checked={insecureInstall}
                onCheckedChange={(checked) => setInsecureInstall(!!checked)}
              />
              <Label htmlFor="insecure" className="text-sm">
                SSL-Zertifikatsüberprüfung deaktivieren (unsicher)
              </Label>
            </div>
            
            <Alert>
              <AlertDescription className="text-sm">
                Die Installation großer Modelle kann je nach Modellgröße und Internetgeschwindigkeit einige Zeit dauern.
                Der Download läuft im Hintergrund und der Fortschritt wird angezeigt.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstallModelDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleModelInstall}
              disabled={installingModel || (!modelToInstall || (modelToInstall === 'custom' && !customModel))}
            >
              {installingModel ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Installation läuft...
                </>
              ) : 'Installieren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modelDetailsDialogOpen} onOpenChange={setModelDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modelldetails</DialogTitle>
          </DialogHeader>
          {loadingModelDetails ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="h-8 w-8 animate-spin" />
              <span className="ml-3">Lade Modelldetails...</span>
            </div>
          ) : !modelDetails ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Details verfügbar für dieses Modell
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
                  <p>{modelDetails.name}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-muted-foreground">Größe</h3>
                  <p>{formatModelSize(modelDetails.size)}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-muted-foreground">Parameter</h3>
                  <p>{modelDetails.parameter_size || 'Unbekannt'}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-muted-foreground">Quantisierung</h3>
                  <p>{modelDetails.quantization || 'Keine'}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-muted-foreground">Format</h3>
                  <p>{modelDetails.format || 'Unbekannt'}</p>
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm text-muted-foreground">Modellfamilie</h3>
                  <p>{modelDetails.families?.join(', ') || 'Unbekannt'}</p>
                </div>
              </div>
              
              {modelDetails.modelfile && (
                <div className="space-y-2">
                  <h3 className="font-medium">Modelfile</h3>
                  
                  <pre className="bg-secondary text-secondary-foreground p-4 rounded-md text-xs overflow-x-auto">
                    {modelDetails.modelfile}
                  </pre>
                </div>
              )}
              
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button 
                  variant="destructive"
                  onClick={() => handleConfirmDeleteModel(modelDetails.name)}
                >
                  Löschen
                </Button>
                <Button variant="outline" onClick={() => setModelDetailsDialogOpen(false)}>
                  Schließen
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modell löschen</DialogTitle>
            <DialogDescription>
              Möchtest du das Modell "{modelToDelete}" wirklich löschen? 
              Dieser Vorgang kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmDeleteDialogOpen(false);
                setModelToDelete(null);
              }}
            >
              Abbrechen
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteModel}
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
