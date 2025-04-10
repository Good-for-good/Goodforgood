import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import type { Meeting, Member } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface MeetingFormProps {
  meeting?: Meeting | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function MeetingForm({ meeting, onSuccess, onCancel }: MeetingFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    attendees: [] as {
      id: string;
      name: string;
      role?: string;
      present: boolean;
    }[],
    agenda: '',
    minutes: '',
    decisions: [] as string[],
    attachments: [] as {
      name: string;
      url: string;
      type: string;
    }[]
  });
  const [newDecision, setNewDecision] = useState('');

  useEffect(() => {
    fetchMembers();
    if (meeting) {
      setFormData({
        title: meeting.title,
        date: meeting.date instanceof Date ? meeting.date.toISOString().split('T')[0] : '',
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location,
        attendees: meeting.attendees,
        agenda: meeting.agenda,
        minutes: meeting.minutes,
        decisions: meeting.decisions,
        attachments: meeting.attachments || []
      });
    }
  }, [meeting]);

  const fetchMembers = async () => {
    try {
      const membersRef = collection(db, 'members');
      const snapshot = await getDocs(membersRef);
      const memberData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Member));
      setMembers(memberData);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('Failed to load members. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAttendeeChange = (memberId: string, isPresent: boolean) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    setFormData(prev => {
      const existingAttendee = prev.attendees.find(a => a.id === memberId);
      if (existingAttendee) {
        return {
          ...prev,
          attendees: prev.attendees.map(a =>
            a.id === memberId ? { ...a, present: isPresent } : a
          )
        };
      }
      return {
        ...prev,
        attendees: [
          ...prev.attendees,
          {
            id: memberId,
            name: member.name,
            present: isPresent
          }
        ]
      };
    });
  };

  const addDecision = () => {
    if (newDecision.trim()) {
      setFormData(prev => ({
        ...prev,
        decisions: [...prev.decisions, newDecision.trim()]
      }));
      setNewDecision('');
    }
  };

  const removeDecision = (index: number) => {
    setFormData(prev => ({
      ...prev,
      decisions: prev.decisions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const meetingData = {
        ...formData,
        date: new Date(formData.date),
        updatedAt: serverTimestamp()
      };

      if (!meeting) {
        const newMeetingData = {
          ...meetingData,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'meetings'), newMeetingData);
      } else {
        const meetingRef = doc(db, 'meetings', meeting.id!);
        await updateDoc(meetingRef, meetingData);
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving meeting:', err);
      setError('Failed to save meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Time</label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Time</label>
          <input
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Attendees</label>
        <div className="mt-2 space-y-2">
          {members.map((member) => {
            const isAttending = formData.attendees.some(a => a.id === member.id);
            return (
              <div key={member.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isAttending}
                  onChange={(e) => handleAttendeeChange(member.id, e.target.checked)}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{member.name}</span>
                {isAttending && (
                  <select
                    value={formData.attendees.find(a => a.id === member.id)?.present ? 'present' : 'absent'}
                    onChange={(e) => handleAttendeeChange(member.id, e.target.value === 'present')}
                    className="ml-2 text-sm rounded-md border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Agenda</label>
        <textarea
          name="agenda"
          value={formData.agenda}
          onChange={handleChange}
          rows={4}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Minutes</label>
        <textarea
          name="minutes"
          value={formData.minutes}
          onChange={handleChange}
          rows={6}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Decisions</label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={newDecision}
            onChange={(e) => setNewDecision(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            placeholder="Add a decision"
          />
          <button
            type="button"
            onClick={addDecision}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
          >
            Add
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {formData.decisions.map((decision, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
              <span className="text-sm text-gray-700">{decision}</span>
              <button
                type="button"
                onClick={() => removeDecision(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : meeting ? 'Update Meeting' : 'Create Meeting'}
        </button>
      </div>
    </form>
  );
} 