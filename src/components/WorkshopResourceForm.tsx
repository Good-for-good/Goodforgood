import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { WorkshopResource } from '@/types';

interface WorkshopResourceFormProps {
  resource?: WorkshopResource | null;
  onSuccess: () => void;
  onCancel: () => void;
}

type FormData = Omit<WorkshopResource, 'id' | 'createdAt' | 'updatedAt'>;

export default function WorkshopResourceForm({ resource, onSuccess, onCancel }: WorkshopResourceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    specialization: '',
    type: 'external',
    expertise: [],
    reference: {
      name: '',
      relationship: '',
      contactDetails: {
        email: '',
        phone: ''
      }
    },
    contactDetails: {
      email: '',
      phone: '',
      address: ''
    },
    availability: '',
    previousWorkshops: '',
    notes: '',
    status: 'active'
  });
  const [newExpertise, setNewExpertise] = useState('');

  useEffect(() => {
    if (resource) {
      setFormData({
        name: resource.name,
        specialization: resource.specialization,
        type: resource.type,
        expertise: resource.expertise,
        reference: resource.reference,
        contactDetails: resource.contactDetails,
        availability: resource.availability,
        previousWorkshops: resource.previousWorkshops,
        notes: resource.notes,
        status: resource.status
      });
    }
  }, [resource]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [_, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        reference: {
          ...prev.reference,
          [field]: value
        }
      }));
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [_, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        contactDetails: {
          ...prev.contactDetails,
          [field]: value
        }
      }));
    }
  };

  const addExpertise = () => {
    if (newExpertise.trim()) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()]
      }));
      setNewExpertise('');
    }
  };

  const removeExpertise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!resource) {
        await addDoc(collection(db, 'workshopResources'), {
          name: formData.name,
          specialization: formData.specialization,
          type: formData.type,
          expertise: formData.expertise,
          reference: formData.reference,
          contactDetails: formData.contactDetails,
          availability: formData.availability,
          previousWorkshops: formData.previousWorkshops,
          notes: formData.notes,
          status: formData.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        const resourceRef = doc(db, 'workshopResources', resource.id!);
        await updateDoc(resourceRef, {
          name: formData.name,
          specialization: formData.specialization,
          type: formData.type,
          expertise: formData.expertise,
          reference: formData.reference,
          contactDetails: formData.contactDetails,
          availability: formData.availability,
          previousWorkshops: formData.previousWorkshops,
          notes: formData.notes,
          status: formData.status,
          updatedAt: serverTimestamp()
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving workshop resource:', err);
      setError('Failed to save workshop resource. Please try again.');
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
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Specialization</label>
        <input
          type="text"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        >
          <option value="member">Member</option>
          <option value="external">External</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Expertise</label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={newExpertise}
            onChange={(e) => setNewExpertise(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
            placeholder="Add expertise"
          />
          <button
            type="button"
            onClick={addExpertise}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
          >
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.expertise.map((exp, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
            >
              {exp}
              <button
                type="button"
                onClick={() => removeExpertise(index)}
                className="ml-1 inline-flex items-center p-0.5 hover:bg-yellow-200 rounded-full"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Reference Information</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Reference Name</label>
          <input
            type="text"
            name="reference.name"
            value={formData.reference.name}
            onChange={handleReferenceChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Relationship</label>
          <input
            type="text"
            name="reference.relationship"
            value={formData.reference.relationship}
            onChange={handleReferenceChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Contact Details</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="contactDetails.email"
            value={formData.contactDetails.email}
            onChange={handleContactChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            name="contactDetails.phone"
            value={formData.contactDetails.phone}
            onChange={handleContactChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input
            type="text"
            name="contactDetails.address"
            value={formData.contactDetails.address}
            onChange={handleContactChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Availability</label>
        <input
          type="text"
          name="availability"
          value={formData.availability}
          onChange={handleChange}
          placeholder="e.g., Weekends, Evenings"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Previous Workshops</label>
        <textarea
          name="previousWorkshops"
          value={formData.previousWorkshops}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
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
          {loading ? 'Saving...' : resource ? 'Update Resource' : 'Add Resource'}
        </button>
      </div>
    </form>
  );
} 