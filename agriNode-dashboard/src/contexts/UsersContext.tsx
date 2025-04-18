import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UpdateUserRequest } from '@/types/api';
import userApi from '@/api/userApi';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface UsersContextType {
  users: User[];
  loading: boolean;
  error: string | null;
  registrationEnabled: boolean;
  fetchUsers: () => Promise<void>;
  updateUser: (userId: string, userData: UpdateUserRequest) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleRegistrationStatus: (enabled: boolean) => Promise<void>;
  fetchRegistrationStatus: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const useUsers = (): UsersContextType => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};

interface UsersProviderProps {
  children: ReactNode;
}

export const UsersProvider: React.FC<UsersProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);

  const fetchUsers = async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await userApi.getAllUsers();
      setUsers(fetchedUsers);
    } catch (err: any) {
      setError(err.message || 'Error loading users');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, userData: UpdateUserRequest) => {
    if (!user || user.role !== 'admin') {
      toast.error('Only administrators can edit users');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await userApi.updateUser(userId, userData);
      toast.success('User updated');
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Error updating user');
      toast.error('Failed to update user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!user || user.role !== 'admin') {
      toast.error('Only administrators can delete users');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await userApi.deleteUser(userId);
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u.user_id !== userId));
    } catch (err: any) {
      setError(err.message || 'Error deleting user');
      toast.error('Failed to delete user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationStatus = async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      setLoading(true);
      setError(null);
      const { registrationEnabled: status } = await userApi.getRegistrationStatus();
      setRegistrationEnabled(status);
    } catch (err: any) {
      setError(err.message || 'Error loading registration status');
      toast.error('Failed to load registration status');
    } finally {
      setLoading(false);
    }
  };

  const toggleRegistrationStatus = async (enabled: boolean) => {
    if (!user || user.role !== 'admin') {
      toast.error('Only administrators can manage registration');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { registrationEnabled: status } = await userApi.toggleRegistration(enabled);
      setRegistrationEnabled(status);
      toast.success(`Registration has been ${status ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      setError(err.message || 'Error changing registration status');
      toast.error('Failed to change registration status');
    } finally {
      setLoading(false);
    }
  };

  // Load users when the context is initialized and the user is an admin
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchRegistrationStatus();
    }
  }, [user?.user_id, user?.role]);

  return (
    <UsersContext.Provider
      value={{
        users,
        loading,
        error,
        registrationEnabled,
        fetchUsers,
        updateUser,
        deleteUser,
        toggleRegistrationStatus,
        fetchRegistrationStatus
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};