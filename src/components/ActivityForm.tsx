'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Activity } from '@/types';

interface ActivityFormProps {
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
}

const ACTIVITY_CATEGORIES = [
  'Meeting',
  'Workshop',
  'Training',
  'Social Event',
  'Fundraiser',
  'Community Service',
  'Other'
];

const ACTIVITY_STATUS = [
  'upcoming',
  'ongoing',
  'completed',
  'cancelled'
] as const;

export default function ActivityForm({ activity, onSuccess, onCancel }: ActivityFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContributionFields, setShowContributionFields] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    category: 'Meeting',
    status: 'upcoming',
    organizer: '',
    maxParticipants: '',
    budget: '',
    actualAmount: '',
    contributionNotes: '',
    notes: ''
  });

  useEffect(() => {
    if (activity) {
      const date = activity.date?.toDate?.() || new Date(activity.date);
      setFormData({
        title: activity.title || '',
        description: activity.description || '',
        date: date.toISOString().split('T')[0],
        startTime: activity.startTime || '',
        endTime: activity.endTime || '',
        location: activity.location || '',
        category: activity.category || 'Meeting',
        status: activity.status || 'upcoming',
        organizer: activity.organizer || '',
        maxParticipants: activity.maxParticipants?.toString() || '',
        budget: activity.budget?.toString() || '',
        actualAmount: activity.actualAmount?.toString() || '',
        contributionNotes: activity.contributionNotes || '',
        notes: activity.notes || ''
      });
      setShowContributionFields(activity.status === 'completed');
    }
  }, [activity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setFormData(prev => ({
      ...prev,
      status: newStatus
    }));
    setShowContributionFields(newStatus === 'completed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const activityData: any = {
        title: formData.title,
        description: formData.description,
        date: new Date(formData.date),
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        category: formData.category,
        status: formData.status,
        organizer: formData.organizer,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        currentParticipants: activity?.currentParticipants || 0,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        notes: formData.notes,
        updatedAt: serverTimestamp()
      };

      // Add contribution details if activity is completed
      if (formData.status === 'completed') {
        activityData.actualAmount = formData.actualAmount ? parseFloat(formData.actualAmount) : null;
        activityData.contributionDate = serverTimestamp();
        activityData.contributionNotes = formData.contributionNotes;
      }

      if (activity?.id) {
        const activityRef = doc(db, 'activities', activity.id);
        await updateDoc(activityRef, activityData);
      } else {
        const activitiesRef = collection(db, 'activities');
        activityData.createdAt = serverTimestamp();
        await addDoc(activitiesRef, activityData);
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving activity:', err);
      setError('Failed to save activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="organizer" className="block text-sm font-medium text-gray-700">
            Organizer *
          </label>
          <input
            type="text"
            id="organizer"
            name="organizer"
            required
            value={formData.organizer}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            value={formData.date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            required
            value={formData.location}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
            Start Time *
          </label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            required
            value={formData.startTime}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
            End Time *
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            required
            value={formData.endTime}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            id="category"
            name="category"
            required
            value={formData.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {ACTIVITY_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status *
          </label>
          <select
            id="status"
            name="status"
            required
            value={formData.status}
            onChange={handleStatusChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {ACTIVITY_STATUS.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700">
            Maximum Participants
          </label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            min="0"
            value={formData.maxParticipants}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700">
            Budget (₹)
          </label>
          <input
            type="number"
            id="budget"
            name="budget"
            min="0"
            step="0.01"
            value={formData.budget}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Additional Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          value={formData.notes}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      {showContributionFields && (
        <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
          <h4 className="text-lg font-medium text-gray-900">Contribution Details</h4>
          
          <div>
            <label htmlFor="actualAmount" className="block text-sm font-medium text-gray-700">
              Actual Amount Spent (₹)
            </label>
            <input
              type="number"
              id="actualAmount"
              name="actualAmount"
              min="0"
              step="0.01"
              value={formData.actualAmount}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {formData.budget && (
              <p className="mt-1 text-sm text-gray-500">
                Budgeted amount: ₹{parseFloat(formData.budget).toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contributionNotes" className="block text-sm font-medium text-gray-700">
              Contribution Notes
            </label>
            <textarea
              id="contributionNotes"
              name="contributionNotes"
              rows={2}
              value={formData.contributionNotes}
              onChange={handleChange}
              placeholder="Add any notes about the contribution/expenses"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Saving...' : activity ? 'Update Activity' : 'Create Activity'}
        </button>
      </div>
    </form>
  );
} 