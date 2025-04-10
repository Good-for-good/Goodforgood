'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { Donation } from '@/types';

interface DonationFormProps {
  donation?: Donation | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DonationForm({ donation, onSuccess, onCancel }: DonationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    donor: '',
    amount: '',
    purpose: '',
    notes: ''
  });

  useEffect(() => {
    if (donation) {
      setFormData({
        donor: donation.donor,
        amount: donation.amount.toString(),
        purpose: donation.purpose,
        notes: donation.notes || ''
      });
    }
  }, [donation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const donationData = {
        donor: formData.donor,
        amount: parseInt(formData.amount),
        purpose: formData.purpose,
        notes: formData.notes || null
      };

      if (donation?.id) {
        // Update existing donation
        const donationRef = doc(db, 'donations', donation.id);
        await updateDoc(donationRef, donationData);
      } else {
        // Add new donation
        const donationsRef = collection(db, 'donations');
        await addDoc(donationsRef, {
          ...donationData,
          date: serverTimestamp()
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving donation:', err);
      setError('Failed to save donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const purposeOptions = [
    'General Fund',
    'Education',
    'Healthcare',
    'Food Distribution',
    'Infrastructure',
    'Emergency Relief',
    'Other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="donor" className="block text-sm font-medium text-gray-700">
          Donor Name *
        </label>
        <input
          type="text"
          id="donor"
          name="donor"
          value={formData.donor}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount (₹) *
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
          min="1"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
          Purpose *
        </label>
        <select
          id="purpose"
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">Select a purpose</option>
          {purposeOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : donation ? 'Update Donation' : 'Add Donation'}
        </button>
      </div>
    </form>
  );
} 