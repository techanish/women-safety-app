import React, { useState } from 'react';
import { X, Plus, Star, Phone, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSafety } from '@/contexts/SafetyContext';
import { cn } from '@/lib/utils';

interface EmergencyContactsProps {
  onClose: () => void;
}

export function EmergencyContacts({ onClose }: EmergencyContactsProps) {
  const { emergencyContacts, addEmergencyContact, removeEmergencyContact, updateEmergencyContact } = useSafety();
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: '',
  });

  const handleAdd = () => {
    if (newContact.name && newContact.phone) {
      addEmergencyContact({
        ...newContact,
        isPrimary: emergencyContacts.length === 0,
      });
      setNewContact({ name: '', phone: '', relationship: '' });
      setIsAdding(false);
    }
  };

  const togglePrimary = (id: string) => {
    emergencyContacts.forEach(contact => {
      updateEmergencyContact(contact.id, { isPrimary: contact.id === id });
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col p-6 safe-area-top safe-area-bottom">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground">Emergency Contacts</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-6 h-6" />
        </Button>
      </div>

      <p className="text-muted-foreground mb-6">
        These contacts will be notified when SOS is triggered.
      </p>

      {/* Contact list */}
      <div className="flex-1 overflow-auto space-y-3">
        {emergencyContacts.map((contact) => (
          <div
            key={contact.id}
            className={cn(
              "p-4 rounded-2xl transition-all",
              contact.isPrimary 
                ? "bg-accent/20 border border-accent/30" 
                : "glass"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                contact.isPrimary ? "bg-accent/30" : "bg-muted"
              )}>
                <User className={cn(
                  "w-6 h-6",
                  contact.isPrimary ? "text-accent" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{contact.name}</span>
                  {contact.isPrimary && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/30 text-accent">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{contact.phone}</p>
                {contact.relationship && (
                  <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => togglePrimary(contact.id)}
                >
                  <Star className={cn(
                    "w-4 h-4",
                    contact.isPrimary ? "fill-accent text-accent" : "text-muted-foreground"
                  )} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 text-destructive"
                  onClick={() => removeEmergencyContact(contact.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Add new contact form */}
        {isAdding && (
          <div className="glass p-4 rounded-2xl space-y-3">
            <Input
              placeholder="Name"
              value={newContact.name}
              onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
              className="bg-muted/50"
            />
            <Input
              placeholder="Phone number"
              type="tel"
              value={newContact.phone}
              onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
              className="bg-muted/50"
            />
            <Input
              placeholder="Relationship (optional)"
              value={newContact.relationship}
              onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
              className="bg-muted/50"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button variant="accent" className="flex-1" onClick={handleAdd}>
                Add Contact
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add button */}
      {!isAdding && (
        <Button
          variant="outline"
          size="lg"
          className="w-full mt-4"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Emergency Contact
        </Button>
      )}
    </div>
  );
}
