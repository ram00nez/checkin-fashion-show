import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';
import { toast } from 'react-toastify';
import { FiUpload } from 'react-icons/fi';

interface Participant {
  id: string;
  nama_anak: string;
  nama_orang_tua: string;
  email: string;
  alamat: string;
  nama_sekolah: string;
  jenis_kelamin: string;
  no_nametag: string;
  check_in: boolean;
  check_in_time: string | null;
  status: string;
  snack_box_received: boolean;
  snack_box_time: string | null;
  lunch_box_ticket_received: boolean;
  lunch_box_ticket_received_time: string | null;
  created_at: string;
  nama_perwakilan: string | null;
  nomer_perwakilan: string | null;
}

function AdminCheckInPage() {
  const [error, setError] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch all participants from database
  const fetchParticipants = async () => {
    try {
      const { data: fetchedParticipants, error } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParticipants(fetchedParticipants || []);
    } catch (err) {
      setError('Gagal mengambil data peserta');
      console.error('Error fetching participants:', err);
    }
  };

  // Handle CSV file upload
  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCsvFile(file);
    }
  };

  // Handle CSV import
  const handleCsvImport = async () => {
    if (!csvFile) return;

    try {
      setIsImporting(true);
      const fileContent = await csvFile.text();
      
      const parsed = Papa.parse(fileContent, {
        header: true,
        transform: (value) => value.trim(),
      });

      if (parsed.errors.length > 0) {
        throw new Error('CSV parsing error: ' + parsed.errors[0].message);
      }

      const participantsToImport = parsed.data.map((row: any) => ({
        nama_anak: row.nama_anak || '',
        nama_orang_tua: row.nama_orang_tua || '',
        email: row.email || '',
        alamat: row.alamat || '',
        nama_sekolah: row.nama_sekolah || '',
        jenis_kelamin: row.jenis_kelamin || '',
        no_nametag: row.no_nametag || '',
        check_in: false,
        check_in_time: null,
        status: 'pending',
        snack_box_received: false,
        snack_box_time: null,
        lunch_box_ticket_received: false,
        lunch_box_ticket_received_time: null,
        created_at: new Date().toISOString(),
        nama_perwakilan: null,
        nomer_perwakilan: null,
      }));

      const { error } = await supabase
        .from('participants')
        .insert(participantsToImport);

      if (error) throw error;

      toast.success('Berhasil mengimpor peserta');
      await fetchParticipants();
      setCsvFile(null);
    } catch (err) {
      setError('Gagal mengimpor CSV: ' + (err instanceof Error ? err.message : 'Error tidak diketahui'));
      toast.error('Gagal mengimpor CSV');
      console.error('Error importing CSV:', err);
    } finally {
      setIsImporting(false);
    }
  };

  // Handle participant check-in
  const handleCheckIn = async (participantId: string) => {
    try {
      const { error } = await supabase
        .from('participants')
        .update({
          check_in: true,
          check_in_time: new Date().toISOString()
        })
        .eq('id', participantId)
        .select('*')
        .single();

      if (error) throw error;
      await fetchParticipants();
    } catch (err) {
      setError('Harap isi semua field yang diperlukan');
      console.error('Error checking in participant:', err);
    }
  };

  // Handle participant search
  const handleSearch = async () => {
    try {
      setIsSearching(true);
      
      const { data: fetchedParticipants, error } = await supabase
        .from('participants')
        .select('*')
        .or(`
          nama_anak.ilike.%${searchQuery}%,
          nama_orang_tua.ilike.%${searchQuery}%,
          email.ilike.%${searchQuery}%
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setParticipants(fetchedParticipants || []);
    } catch (err) {
      setError('Gagal mencari peserta');
      console.error('Error searching participants:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle participant deletion
  const handleDeleteParticipant = async (participantId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus peserta ini?')) return;

    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;
      await fetchParticipants();
      setError('');
    } catch (err) {
      setError('Gagal menghapus peserta');
      console.error('Error deleting participant:', err);
    }
  };



  // Handle participant editing
  const handleEditParticipant = async (participant: Participant) => {
    setCurrentParticipant(participant);
  };

  // Handle participant save/edit
  const handleSaveEdit = async () => {
    if (!currentParticipant) return;

    try {
      const { error } = await supabase
        .from('participants')
        .update({
          nama_anak: currentParticipant.nama_anak,
          nama_orang_tua: currentParticipant.nama_orang_tua,
          email: currentParticipant.email,
          check_in: currentParticipant.check_in,
          check_in_time: currentParticipant.check_in_time,
          status: currentParticipant.status,
          snack_box_received: currentParticipant.snack_box_received,
          snack_box_time: currentParticipant.snack_box_time,
          lunch_box_ticket_received: currentParticipant.lunch_box_ticket_received,
          lunch_box_ticket_received_time: currentParticipant.lunch_box_ticket_received_time,
          nama_perwakilan: currentParticipant.nama_perwakilan,
          nomer_perwakilan: currentParticipant.nomer_perwakilan,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentParticipant.id)
        .select();

      if (error) throw error;
      await fetchParticipants();
      setCurrentParticipant(null);
      setError('');
    } catch (err) {
      setError('Gagal memperbarui peserta');
      console.error('Error updating participant:', err);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  if (error) {
    return <div className="container mx-auto p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Check-in</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Daftar Peserta</h2>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  disabled={isImporting}
                  className="hidden"
                  id="csv-file"
                  title="Pilih file CSV untuk diimpor"
                />
                <label
                  htmlFor="csv-file"
                  className="flex items-center cursor-pointer px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors duration-200"
                  title="Pilih file CSV untuk diimpor"
                >
                  <FiUpload className="w-5 h-5 mr-2" />
                  Pilih File CSV
                </label>
                <button
                  onClick={handleCsvImport}
                  disabled={!csvFile || isImporting}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
                  title="Mulai mengimpor data dari file CSV yang dipilih"
                >
                  <FiUpload className="w-5 h-5 mr-2" />
                  {isImporting ? 'Mengimpor...' : 'Impor'}
                </button>
              </div>
              <input
                type="text"
                placeholder="Cari peserta..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border rounded px-3 py-2 w-64"
                disabled={isSearching}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isSearching ? 'Mencari...' : 'Cari'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Anak</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Orang Tua</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Perwakilan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participants.map((participant) => (
                  <tr key={participant.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.nama_anak}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.nama_orang_tua}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={participant.check_in}
                        onChange={() => handleCheckIn(participant.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {participant.nama_perwakilan ? (
                        <div className="text-sm text-gray-600">
                          <p><strong>Nama Perwakilan:</strong> {participant.nama_perwakilan}</p>
                          <p><strong>Nomor Perwakilan:</strong> {participant.nomer_perwakilan}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Tidak ada perwakilan</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleEditParticipant(participant)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteParticipant(participant.id)}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">{currentParticipant ? 'Edit Peserta' : 'Tambah Peserta Baru'}</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="nama_anak" className="block text-sm font-medium mb-1">Nama Anak</label>
              <input
                id="nama_anak"
                type="text"
                value={currentParticipant?.nama_anak || ''}
                onChange={(e) => {
                  if (currentParticipant) {
                    setCurrentParticipant({
                      ...currentParticipant,
                      nama_anak: e.target.value
                    });
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="nama_orang_tua" className="block text-sm font-medium mb-1">Nama Orang Tua</label>
              <input
                id="nama_orang_tua"
                type="text"
                value={currentParticipant?.nama_orang_tua || ''}
                onChange={(e) => {
                  if (currentParticipant) {
                    setCurrentParticipant({
                      ...currentParticipant,
                      nama_orang_tua: e.target.value
                    });
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={currentParticipant?.email || ''}
                onChange={(e) => {
                  if (currentParticipant) {
                    setCurrentParticipant({
                      ...currentParticipant,
                      email: e.target.value
                    });
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="nama_perwakilan" className="block text-sm font-medium mb-1">Nama Perwakilan</label>
              <input
                id="nama_perwakilan"
                type="text"
                value={currentParticipant?.nama_perwakilan || ''}
                onChange={(e) => {
                  if (currentParticipant) {
                    setCurrentParticipant({
                      ...currentParticipant,
                      nama_perwakilan: e.target.value
                    });
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="nomer_perwakilan" className="block text-sm font-medium mb-1">Nomor Perwakilan</label>
              <input
                id="nomer_perwakilan"
                type="tel"
                value={currentParticipant?.nomer_perwakilan || ''}
                onChange={(e) => {
                  if (currentParticipant) {
                    setCurrentParticipant({
                      ...currentParticipant,
                      nomer_perwakilan: e.target.value
                    });
                  }
                }}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveEdit}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {currentParticipant ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminCheckInPage;
