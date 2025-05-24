import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Button } from './ui/Button';
import type { Participant } from '../types';
import { updateParticipantStatus } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ParticipantCardProps {
  participant: Participant;
  onUpdate: (updated: Participant) => void;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, onUpdate }) => {
  const { user } = useAuth();
  const isAdmin = user?.user_metadata?.role === 'admin';

  const [loading, setLoading] = useState<string | null>(null);
  const [showRepForm, setShowRepForm] = useState(false);
  const [formData, setFormData] = useState({
    nama_anak: participant.nama_anak,
    nama_orang_tua: participant.nama_orang_tua,
    representative_name: participant.representative_name || '',
    representative_phone: participant.representative_phone || ''
  });

  const handleStatusUpdate = async (status: keyof Participant, value: boolean) => {
    if (!participant.id) {
      console.error('ID peserta tidak valid');
      return;
    }

    try {
      setLoading(status as string);
      
      // Prepare updates with all required fields
      const updates: Partial<Participant> = {
        id: participant.id,
        [status]: value,
        updated_at: new Date().toISOString()
      };
      
      // Add timestamps for specific status changes
      if (value) {
        if (status === 'check_in') {
          updates.check_in_time = new Date().toISOString();
          updates.status = 'checked_in';
        } else if (status === 'snack_box_received') {
          updates.snack_box_time = new Date().toISOString();
        } else if (status === 'lunch_box_ticket_received') {
          updates.lunch_box_ticket_received_time = new Date().toISOString();
        }
      } else {
        // Reset timestamps when status is false
        if (status === 'check_in') {
          updates.check_in_time = null;
          updates.status = 'pending';
        } else if (status === 'snack_box_received') {
          updates.snack_box_time = null;
        } else if (status === 'lunch_box_ticket_received') {
          updates.lunch_box_ticket_received_time = null;
        }
      }

      console.log('Sending updates to Supabase:', updates);
      
      await updateParticipantStatus(participant.id, updates);
      
      // Update local state
      onUpdate(updates);
    } catch (error) {
      console.error('Failed to update status:', error);
      throw error; // Propagate error to parent component
    } finally {
      setLoading(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi input
    if (!formData.nama_anak.trim()) {
      alert('Nama anak tidak boleh kosong');
      return;
    }
    if (!formData.nama_orang_tua.trim()) {
      alert('Nama orang tua tidak boleh kosong');
      return;
    }
    
    try {
      setLoading('form');
      const updates: Participant = {
        id: participant.id,
        nama_anak: formData.nama_anak.trim(),
        nama_orang_tua: formData.nama_orang_tua.trim(),
        email: participant.email,
        alamat: participant.alamat,
        nama_sekolah: participant.nama_sekolah,
        jenis_kelamin: participant.jenis_kelamin,
        no_nametag: participant.no_nametag,
        check_in: participant.check_in,
        check_in_time: participant.check_in_time,
        status: participant.status,
        snack_box_received: participant.snack_box_received,
        snack_box_time: participant.snack_box_time,
        lunch_box_ticket_received: participant.lunch_box_ticket_received,
        lunch_box_ticket_received_time: participant.lunch_box_ticket_received_time,
        created_at: participant.created_at,
        updated_at: new Date().toISOString(),
        representative_name: formData.representative_name?.trim() || null,
        representative_phone: formData.representative_phone?.trim() || null
      };
      
      const updated = await updateParticipantStatus(participant.id, updates);
      
      if (updated) {
        onUpdate(updated);
        setShowRepForm(false);
      } else {
        throw new Error('Gagal memperbarui data');
      }
    } catch (error) {
      console.error('Failed to update details:', error);
      alert('Gagal memperbarui data: ' + (error instanceof Error ? error.message : 'Kesalahan tidak diketahui'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex space-x-2">
      {!participant.check_in && (
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => handleStatusUpdate('check_in', true)}
          isLoading={loading === 'check_in'}
        >
          Check-in
        </Button>
      )}
      
      {!participant.snack_box_received && participant.check_in && (
        <Button 
          variant="success" 
          size="sm"
          onClick={() => handleStatusUpdate('snack_box_received', true)}
          isLoading={loading === 'snack_box_received'}
        >
          Snack Box
        </Button>
      )}
      
      {!participant.lunch_box_ticket_received && participant.check_in && (
        <Button 
          variant="warning" 
          size="sm"
          onClick={() => handleStatusUpdate('lunch_box_ticket_received', true)}
          isLoading={loading === 'lunch_box_ticket_received'}
        >
          Lunch Box Ticket
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowRepForm(true)}
      >
        Edit Details
      </Button>

      {showRepForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Update Participant Details
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Child's Name
                </label>
                <input
                  type="text"
                  placeholder="Enter child's name"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={formData.nama_anak}
                  onChange={(e) => setFormData({...formData, nama_anak: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent's Name
                </label>
                <input
                  type="text"
                  placeholder="Enter parent's name"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={formData.nama_orang_tua}
                  onChange={(e) => setFormData({...formData, nama_orang_tua: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Representative Name
                </label>
                <input
                  type="text"
                  placeholder="Enter representative name"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={formData.representative_name}
                  onChange={(e) => setFormData({...formData, representative_name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={formData.representative_phone}
                  onChange={(e) => setFormData({...formData, representative_phone: e.target.value})}
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  size="sm"
                  isLoading={loading === 'form'}
                >
                  Save Changes
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRepForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantCard;