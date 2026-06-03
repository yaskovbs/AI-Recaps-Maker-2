import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { blink } from '@/lib/blink';
import { useAuth } from './AuthContext';

export interface Contact {
  id: string;
  userId?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: number;
  status: 'pending' | 'sent' | 'replied';
}

interface ContactsContextType {
  contacts: Contact[];
  isLoading: boolean;
  isSubmitting: boolean;
  addContact: (data: Omit<Contact, 'id' | 'timestamp' | 'status'>) => Promise<string>;
  getContactById: (id: string) => Contact | undefined;
  updateContactStatus: (id: string, status: Contact['status']) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadContacts();
  }, [user]);

  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const query: any = {};
      if (user && !user.id.startsWith('guest_')) {
        query.where = { userId: user.id };
      }
      const data = await blink.db.contacts.list({
        ...query,
        orderBy: { createdAt: 'desc' },
      });
      setContacts(data.map((c: any) => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        email: c.email,
        subject: c.subject,
        message: c.message,
        timestamp: new Date(c.createdAt).getTime(),
        status: c.status as Contact['status'],
      })));
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addContact = async (data: Omit<Contact, 'id' | 'timestamp' | 'status'>): Promise<string> => {
    setIsSubmitting(true);
    try {
      const created = await blink.db.contacts.create({
        userId: user?.id.startsWith('guest_') ? undefined : user?.id,
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        status: 'sent',
        createdAt: new Date().toISOString(),
      });
      const newContact: Contact = {
        id: (created as any).id,
        userId: (created as any).userId,
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        timestamp: Date.now(),
        status: 'sent',
      };
      setContacts(prev => [newContact, ...prev]);
      return newContact.id;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getContactById = (id: string) => contacts.find(c => c.id === id);

  const updateContactStatus = async (id: string, status: Contact['status']) => {
    await blink.db.contacts.update(id, { status });
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const deleteContact = async (id: string) => {
    await blink.db.contacts.delete(id);
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const refresh = async () => loadContacts();

  const value: ContactsContextType = {
    contacts,
    isLoading,
    isSubmitting,
    addContact,
    getContactById,
    updateContactStatus,
    deleteContact,
    refresh,
  };

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>;
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (!context) throw new Error('useContacts must be used within ContactsProvider');
  return context;
}
