'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member, TrusteeRole } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaUserShield, FaEdit } from 'react-icons/fa';

const TRUSTEE_ROLES: { role: TrusteeRole; description: string }[] = [
  { role: 'President', description: 'Leads the trust and oversees all operations' },
  { role: 'Vice President', description: 'Assists the president and acts in their absence' },
  { role: 'Secretary Treasurer', description: 'Manages documentation and financial records' },
  { role: 'Managing Trustee', description: 'Handles day-to-day trust operations' },
  { role: 'Program Director', description: 'Oversees and coordinates trust programs' },
  { role: 'Logistics Coordinator', description: 'Manages event logistics and resources' },
  { role: 'Digital Engagement Coordinator', description: 'Oversees digital presence and technology' },
  { role: 'Volunteer Coordinator', description: 'Manages volunteer recruitment and coordination' },
  { role: 'Volunteer', description: 'Actively participates in trust activities' },
  { role: 'IT Team', description: 'Manages technical infrastructure' },
  { role: 'Social Media Team', description: 'Handles social media presence' },
  { role: 'General Trustee', description: 'Core member of the trust' }
];

export default function TrusteesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const fetchMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'members'));
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];
      setMembers(membersData);
    } catch (err) {
      setError('Failed to fetch members');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleRoleUpdate = async (memberId: string, role: TrusteeRole | null) => {
    setEditLoading(true);
    try {
      const timestamp = new Date();
      if (role) {
        await updateDoc(doc(db, 'members', memberId), {
          trusteeRole: role,
          roleStartDate: timestamp,
          roleEndDate: null
        });
      } else {
        await updateDoc(doc(db, 'members', memberId), {
          trusteeRole: null,
          roleEndDate: timestamp
        });
      }
      await fetchMembers();
      setShowEditModal(false);
      setSelectedMember(null);
    } catch (err) {
      setError('Failed to update role');
      console.error('Error updating role:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const trustees = members.filter(member => member.trusteeRole);
  const availableMembers = members.filter(member => !member.trusteeRole);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Trust Management</h1>
        <p className="text-sm text-gray-600 mt-1">Manage trustees and their roles in Good for Good Trust</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Trustees */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Trustees</h2>
          <div className="space-y-4">
            {trustees.map(trustee => (
              <div
                key={trustee.id}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                      <FaUserShield size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{trustee.name}</h3>
                      <p className="text-sm text-blue-600 font-medium">{trustee.trusteeRole}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMember(trustee);
                      setShowEditModal(true);
                    }}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit Role"
                  >
                    <FaEdit size={16} />
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {TRUSTEE_ROLES.find(r => r.role === trustee.trusteeRole)?.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Members */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Members</h2>
          <div className="bg-white rounded-lg shadow-md border border-gray-100">
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Select a member to assign a trustee role:
              </p>
              <div className="divide-y divide-gray-100">
                {availableMembers.map(member => (
                  <div
                    key={member.id}
                    className="py-3 flex justify-between items-center"
                  >
                    <span className="text-gray-800">{member.name}</span>
                    <button
                      onClick={() => {
                        setSelectedMember(member);
                        setShowEditModal(true);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Assign Role
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Role Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] flex flex-col">
            <h2 className="text-xl font-bold mb-4">
              {selectedMember.trusteeRole ? 'Update Role' : 'Assign Role'}
            </h2>
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-3">
                {TRUSTEE_ROLES.map(({ role, description }) => (
                  <button
                    key={role}
                    onClick={() => handleRoleUpdate(selectedMember.id, role)}
                    disabled={editLoading}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedMember.trusteeRole === role
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-800">{role}</div>
                    <div className="text-sm text-gray-600">{description}</div>
                  </button>
                ))}
                {selectedMember.trusteeRole && (
                  <button
                    onClick={() => handleRoleUpdate(selectedMember.id, null)}
                    disabled={editLoading}
                    className="w-full p-3 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                  >
                    Remove Role
                  </button>
                )}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedMember(null);
                }}
                disabled={editLoading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              {editLoading && (
                <div className="text-sm text-gray-600">Updating role...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 