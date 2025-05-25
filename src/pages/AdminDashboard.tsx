import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Coffee, Ticket, Clock, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, searchParticipants, getAllParticipants, updateParticipantStatus } from '../lib/supabase';
import SearchInput from '../components/ui/SearchInput';
import ParticipantCard from '../components/ParticipantCard';
import type { Participant } from '../types';
import Papa from 'papaparse';

interface Stats {
  checkedIn: number;
  notCheckedIn: number;
  snackDistributed: number;
  lunchDistributed: number;
}

const AdminDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({
    checkedIn: 0,
    notCheckedIn: 0,
    snackDistributed: 0,
    lunchDistributed: 0
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fungsi untuk mengambil data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, participantsData] = await Promise.all([
        getAdminStats(),
        getAllParticipants()
      ]);
      if (statsData && participantsData) {
        setStats(statsData);
        setParticipants(participantsData);
        setFilteredParticipants(participantsData);
      } else {
        throw new Error('Data tidak lengkap dari server');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleExportData = () => {
    try {
      // Transform data for CSV export
      const exportData = participants.map(participant => ({
        'Nama Anak': participant.nama_anak,
        'Nama Orang Tua': participant.nama_orang_tua,
        'Email': participant.email,
        'Alamat': participant.alamat,
        'Sekolah': participant.nama_sekolah,
        'Jenis Kelamin': participant.jenis_kelamin,
        'No. Nametag': participant.no_nametag,
        'Status Check-in': participant.check_in ? 'Ya' : 'Tidak',
        'Waktu Check-in': participant.check_in_time || '-',
        'Snack Box': participant.snack_box_received ? 'Diterima' : 'Belum',
        'Waktu Snack Box': participant.snack_box_time || '-',
        'Tiket Makan Siang': participant.lunch_box_ticket_received ? 'Diterima' : 'Belum',
        'Waktu Tiket Makan Siang': participant.lunch_box_ticket_received_time || '-',
        'Nama Perwakilan': participant.representative_name || '-',
        'No. Telepon Perwakilan': participant.representative_phone || '-'
      }));

      // Generate CSV
      const csv = Papa.unparse(exportData);
      
      // Create blob and download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `peserta_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Gagal mengekspor data');
    }
  };

  const handleSearch = async (query: string) => {
    try {
      setLoading(true);
      if (query.trim() === '') {
        setFilteredParticipants(participants);
      } else {
        const results = await searchParticipants(query);
        setFilteredParticipants(results);
      }
      setSearchValue(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantUpdate = async (updated: Partial<Participant>) => {
    try {
      const currentParticipant = filteredParticipants.find(p => p.id === updated.id);
      if (!currentParticipant || !updated.id) {
        throw new Error('Participant or ID not found');
      }

      const updates: Participant = {
        ...currentParticipant,
        updated_at: new Date().toISOString(),
        check_in: currentParticipant.check_in ?? false,
        check_in_time: currentParticipant.check_in_time ?? null,
        status: currentParticipant.status ?? 'pending',
        snack_box_received: currentParticipant.snack_box_received ?? false,
        snack_box_time: currentParticipant.snack_box_time ?? null,
        lunch_box_ticket_received: currentParticipant.lunch_box_ticket_received ?? false,
        lunch_box_ticket_received_time: currentParticipant.lunch_box_ticket_received_time ?? null
      };

      if (updated.check_in !== undefined) {
        updates.check_in = updated.check_in;
        if (updated.check_in) {
          updates.check_in_time = new Date().toISOString();
          updates.status = 'checked_in';
        }
      }
      if (updated.snack_box_received !== undefined) {
        updates.snack_box_received = updated.snack_box_received;
        if (updated.snack_box_received) {
          updates.snack_box_time = new Date().toISOString();
        }
      }
      if (updated.lunch_box_ticket_received !== undefined) {
        updates.lunch_box_ticket_received = updated.lunch_box_ticket_received;
        if (updated.lunch_box_ticket_received) {
          updates.lunch_box_ticket_received_time = new Date().toISOString();
        }
      }

      const result = await updateParticipantStatus(updated.id!, updates);
      
      setFilteredParticipants((prev: Participant[]) => 
        prev.map((p: Participant) => p.id === updated.id ? result : p)
      );

      const statsUpdates = {
        checkedIn: updated.check_in && !currentParticipant.check_in ? 1 : 0,
        notCheckedIn: !updated.check_in && currentParticipant.check_in ? 1 : 0,
        snackDistributed: updated.snack_box_received && !currentParticipant.snack_box_received ? 1 : 0,
        lunchDistributed: updated.lunch_box_ticket_received && !currentParticipant.lunch_box_ticket_received ? 1 : 0
      };

      setStats(prev => ({
        ...prev,
        checkedIn: prev.checkedIn + statsUpdates.checkedIn,
        notCheckedIn: prev.notCheckedIn + statsUpdates.notCheckedIn,
        snackDistributed: prev.snackDistributed + statsUpdates.snackDistributed,
        lunchDistributed: prev.lunchDistributed + statsUpdates.lunchDistributed
      }));

    } catch (error) {
      console.error('Failed to update participant:', error);
      setError('Failed to update participant status');
    }
  };

  const formatDateTime = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta'
    });
  };

  if (!authLoading && !user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-lg text-gray-600">
            Monitor event activities and manage participant information.
          </p>
        </div>
        <button
          onClick={handleExportData}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Checked In</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.checkedIn || 0}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <Clock className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Not Checked In</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.notCheckedIn || 0}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <Coffee className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Snack Boxes Distributed</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.snackDistributed || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center">
          <div className="rounded-full bg-amber-100 p-3 mr-4">
            <Ticket className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Lunch Tickets Distributed</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.lunchDistributed}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-8">
        <SearchInput 
          value={searchValue}
          onChange={(value: string) => setSearchValue(value)}
          onSearch={handleSearch} 
          placeholder="Search by participant name..."
          className="w-full"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            <p>{error}</p>
          </div>
        )}
        
        {!loading && filteredParticipants.length === 0 && (
          <div className="text-center py-8">
            <Clock className="mx-auto h-10 w-10 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No participants found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {participants.length === 0 
                ? 'No participants have been registered yet.'
                : 'Try searching with a different name.'}
            </p>
          </div>
        )}
        
        {filteredParticipants.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent's Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Snack Box Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lunch Ticket Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParticipants.map((participant) => (
                  <tr key={participant.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                          {participant.nama_anak.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{participant.nama_anak}</div>
                          <div className="text-sm text-gray-500">#{participant.no_nametag}</div>
                          <div className="text-xs text-gray-400">{participant.representative_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{participant.nama_orang_tua}</span>
                        <span className="text-xs text-gray-400">{participant.representative_phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          participant.check_in ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {formatDateTime(participant.check_in_time)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          participant.snack_box_received ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {formatDateTime(participant.snack_box_time)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          participant.lunch_box_ticket_received ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatDateTime(participant.lunch_box_ticket_received_time)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm">
                      <ParticipantCard
                        participant={participant}
                        onUpdate={handleParticipantUpdate}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;