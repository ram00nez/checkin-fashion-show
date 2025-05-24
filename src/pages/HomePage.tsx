import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { format } from 'date-fns';
import SearchInput from '../components/ui/SearchInput';
import { searchParticipants, updateParticipantStatus } from '../lib/supabase';
import type { Participant } from '../types';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showRepresentativeModal, setShowRepresentativeModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [representativeName, setRepresentativeName] = useState('');
  const [representativePhone, setRepresentativePhone] = useState('');

  const handleAddRepresentative = async () => {
    if (!selectedParticipant || !representativeName || !representativePhone) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const updates: Participant = {
        ...selectedParticipant,
        nama_perwakilan: representativeName,
        nomer_perwakilan: representativePhone
      };

      await updateParticipantStatus(selectedParticipant.id, updates);
      setSearchResults((prev: Participant[]) => 
        prev.map((p: Participant) => p.id === selectedParticipant.id ? updates : p)
      );
      setShowRepresentativeModal(false);
      setSelectedParticipant(null);
      setRepresentativeName('');
      setRepresentativePhone('');
    } catch (err) {
      setError('Failed to add representative');
      console.error('Error adding representative:', err);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearched(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const results = await searchParticipants(query);
      setSearchResults(results);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantUpdate = async (updated: Participant) => {
    try {
      // Get current participant data
      const currentParticipant = searchResults.find(p => p.id === updated.id);
      if (!currentParticipant) {
        throw new Error('Participant not found in current results');
      }

      // Prepare updates with timestamps
      const updates: Participant = {
        ...currentParticipant, // Start with current data
        updated_at: new Date().toISOString(),
        check_in: currentParticipant.check_in ?? false,
        check_in_time: currentParticipant.check_in_time ?? null,
        status: currentParticipant.status ?? 'pending',
        snack_box_received: currentParticipant.snack_box_received ?? false,
        snack_box_time: currentParticipant.snack_box_time ?? null,
        lunch_box_ticket_received: currentParticipant.lunch_box_ticket_received ?? false,
        lunch_box_ticket_received_time: currentParticipant.lunch_box_ticket_received_time ?? null
      };

      // Update specific fields based on what was changed
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

      console.log('Final updates:', updates);

      // Update database first
      const result = await updateParticipantStatus(updated.id, updates);
      
      // Then update local state with the result from database
      setSearchResults((prev: Participant[]) => 
        prev.map((p: Participant) => p.id === updated.id ? result : p)
      );
    } catch (error) {
      console.error('Failed to update participant:', error);
      setError('Failed to update participant status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Modal */}
      {showRepresentativeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Add Representative</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="representativeName" className="block text-sm font-medium mb-1">Representative Name</label>
                <input
                  id="representativeName"
                  type="text"
                  value={representativeName}
                  onChange={(e) => setRepresentativeName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter representative name"
                />
              </div>
              <div>
                <label htmlFor="representativePhone" className="block text-sm font-medium mb-1">Representative Phone</label>
                <input
                  id="representativePhone"
                  type="tel"
                  value={representativePhone}
                  onChange={(e) => setRepresentativePhone(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter representative phone number"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowRepresentativeModal(false);
                    setSelectedParticipant(null);
                    setRepresentativeName('');
                    setRepresentativePhone('');
                  }}
                  className="px-4 py-2 rounded-md border text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRepresentative}
                  className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600"
                  disabled={!representativeName || !representativePhone}
                >
                  Add Representative
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Check-in System</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Search for participants by name to view their information and status.
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto mb-8">
        <SearchInput 
          value={searchValue}
          onChange={setSearchValue}
          onSearch={handleSearch} 
          placeholder="Search..."
          className="w-full"
        />
      </div>
      
      <div className="space-y-6">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>{error}</p>
          </div>
        )}
        
        {!loading && searched && searchResults.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No participants found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try searching with a different name or check the spelling.
            </p>
          </div>
        )}
        
        {searchResults.map(participant => (
          <div key={participant.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{participant.nama_anak}</h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Parent's Name:</strong> {participant.nama_orang_tua}</p>
                  <p><strong>Gender:</strong> {participant.jenis_kelamin}</p>
                  <p><strong>School:</strong> {participant.nama_sekolah}</p>
                  <p><strong>Address:</strong> {participant.alamat}</p>
                  <p><strong>Email:</strong> {participant.email}</p>
                  <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Nametag #{participant.no_nametag}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  {user && !participant.check_in && (
                    <button
                      onClick={() => handleParticipantUpdate({ ...participant, check_in: true })}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Check In
                    </button>
                  )}
                  
                  {user && participant.check_in && !participant.snack_box_received && (
                    <button
                      onClick={() => handleParticipantUpdate({ ...participant, snack_box_received: true })}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Receive Snack Box
                    </button>
                  )}
                  
                  {user && participant.check_in && !participant.lunch_box_ticket_received && (
                    <button
                      onClick={() => handleParticipantUpdate({ ...participant, lunch_box_ticket_received: true })}
                      className="w-full bg-amber-500 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors"
                    >
                      Receive Lunch Box Ticket
                    </button>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Representative Information</h4>
                  {participant.nama_perwakilan ? (
                    <div className="text-gray-600">
                      <p><strong>Name:</strong> {participant.nama_perwakilan}</p>
                      <p><strong>Phone:</strong> {participant.nomer_perwakilan}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No representative assigned</p>
                  )}
                  {user && !participant.nama_perwakilan && (
                    <button
                      onClick={() => {
                        setSelectedParticipant(participant);
                        setShowRepresentativeModal(true);
                      }}
                      className="mt-2 bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Add Representative
                    </button>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                  <div className="space-y-2">
                    <div className={`flex items-center ${participant.check_in ? 'text-green-600' : 'text-gray-500'}`}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Check In
                    </div>
                    <div className={`flex items-center ${participant.snack_box_received ? 'text-green-600' : 'text-gray-500'}`}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Snack Box
                    </div>
                    <div className={`flex items-center ${participant.lunch_box_ticket_received ? 'text-green-600' : 'text-gray-500'}`}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Lunch Box Ticket: {participant.lunch_box_ticket_received ? 'Received' : 'Not Received'}
                      {participant.lunch_box_ticket_received && participant.lunch_box_ticket_received_time && (
                        <span className="ml-2 text-sm text-gray-600">
                          ({format(new Date(participant.lunch_box_ticket_received_time), 'PPp')})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {!searched && !loading && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Search for participants</h3>
            <p className="mt-1 text-sm text-gray-500">
              Enter a participant's name in the search box above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;