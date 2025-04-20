import React, { useState, useEffect } from 'react';
import { useApiKeys } from '@/contexts/ApiKeysContext';
import { useUsers } from '@/contexts/UsersContext';
import { useAuth } from '@/contexts/AuthContext';
import authApi from '@/api/authApi';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ClipboardIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const EXPIRATION_OPTIONS = [
  { label: 'Nie', value: '0' },
  { label: '1 Tag', value: '86400' },
  { label: '7 Tage', value: '604800' },
  { label: '30 Tage', value: '2592000' },
  { label: '90 Tage', value: '7776000' },
  { label: '1 Jahr', value: '31536000' },
];

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
  
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [name, setName] = useState('');
  const [expiration, setExpiration] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [dialogKey, setDialogKey] = useState<string | null>(null);
  
  // State for user dialog
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<{
    userId: string;
    username: string;
    email: string;
    role: 'admin' | 'user';
    active: boolean;
  } | null>(null);

  // State for new user dialog
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    fetchApiKeys();
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // API Key functions
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
      // Error is already handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete API key?')) return;
    try {
      await deleteApiKey(id);
    } catch {
      // Error is already displayed
    }
  };
  
  // User functions
  const handleToggleRegistration = async (enabled: boolean) => {
    if (!isAdmin) return;
    try {
      await toggleRegistrationStatus(enabled);
    } catch {
      // Error is already handled in context
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
      active: true // Assumption: We set all users as active since we don't have a status
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
      // Refresh user list
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
      // Error is already handled in context
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete user?')) return;
    
    try {
      await deleteUser(userId);
    } catch {
      // Error is already handled in context
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

      {/* Only visible for admins */}
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
                    // Check if this is the current logged-in user
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

      {/* API Key Dialog */}
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
      
      {/* Edit User Dialog */}
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

      {/* New User Dialog */}
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
    </div>
  );
};
