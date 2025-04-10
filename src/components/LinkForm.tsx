'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Link } from '@/types';
import { FaFolder, FaImage, FaCalendarAlt, FaBuilding, FaLink } from 'react-icons/fa';

interface LinkFormProps {
  link?: Link | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const DEFAULT_CATEGORIES = [
  'Documents',
  'Media',
  'Events',
  'Trust',
  'Other'
] as const;

const CATEGORY_ICONS: { [key: string]: JSX.Element } = {
  Documents: <FaFolder className="text-yellow-500" />,
  Media: <FaImage className="text-blue-500" />,
  Events: <FaCalendarAlt className="text-green-500" />,
  Trust: <FaBuilding className="text-purple-500" />,
  Other: <FaLink className="text-gray-500" />
};

export default function LinkForm({ link, onSuccess, onCancel }: LinkFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: 'Documents',
    description: '',
  });

  useEffect(() => {
    if (link) {
      setFormData({
        title: link.title,
        url: link.url,
        category: link.category,
        description: link.description || '',
      });
    }
  }, [link]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const timestamp = new Date();
      
      if (link) {
        await updateDoc(doc(db, 'links', link.id), {
          ...formData,
          updatedAt: timestamp
        });
      } else {
        await addDoc(collection(db, 'links'), {
          ...formData,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
      
      onSuccess();
    } catch (err) {
      console.error('Error saving link:', err);
      setError('Failed to save link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          placeholder="GG Docs"
        />
      </div>

      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
          URL
        </label>
        <input
          type="url"
          id="url"
          name="url"
          value={formData.url}
          onChange={handleChange}
          required
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          placeholder="https://drive.google.com/..."
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {DEFAULT_CATEGORIES.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, category }))}
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                formData.category === category
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {CATEGORY_ICONS[category]}
              <span className="text-sm font-medium">{category}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          placeholder="Brief description of what this link contains..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : link ? 'Update Link' : 'Add Link'}
        </button>
      </div>
    </form>
  );
} 