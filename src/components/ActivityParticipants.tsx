'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { Member, Activity } from '@/types';

interface ActivityParticipantsProps {
  activity: Activity;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ActivityParticipants({ activity, onClose, onUpdate }: ActivityParticipantsProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(activity.participants || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const membersRef = collection(db, 'members');
      const snapshot = await getDocs(membersRef);
      const memberData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
      setMembers(memberData);
      setError(null);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMemberIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        if (activity.maxParticipants && prev.length >= activity.maxParticipants) {
          alert('Maximum participants limit reached!');
          return prev;
        }
        return [...prev, memberId];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const activityRef = doc(db, 'activities', activity.id);
      
      // Get the members to add and remove
      const currentParticipants: string[] = activity.participants || [];
      const membersToAdd = selectedMemberIds.filter((id: string) => !currentParticipants.includes(id));
      const membersToRemove = currentParticipants.filter((id: string) => !selectedMemberIds.includes(id));

      // Update the activity document
      await updateDoc(activityRef, {
        participants: selectedMemberIds,
        currentParticipants: selectedMemberIds.length,
        updatedAt: new Date()
      });

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating participants:', err);
      setError('Failed to update participants. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Select Participants</h3>
        {activity.maxParticipants && (
          <p className="text-sm text-gray-500">
            Selected: {selectedMemberIds.length} / {activity.maxParticipants}
          </p>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {members.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No members found</p>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => handleMemberToggle(member.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedMemberIds.includes(member.id)}
                  onChange={() => {}}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
} 