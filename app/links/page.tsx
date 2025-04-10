'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Link } from '@/types';
import { FaExternalLinkAlt, FaEdit, FaTrash, FaFolder, FaImage, FaCalendarAlt, FaBuilding, FaLink } from 'react-icons/fa';
import LinkForm from '@/components/LinkForm';
import LoadingSpinner from '@/components/LoadingSpinner';

const CATEGORY_ICONS: { [key: string]: JSX.Element } = {
  Documents: <FaFolder className="text-yellow-500" />,
  Media: <FaImage className="text-blue-500" />,
  Events: <FaCalendarAlt className="text-green-500" />,
  Trust: <FaBuilding className="text-purple-500" />,
  Other: <FaLink className="text-gray-500" />
};

export default function LinksPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLinks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'links'));
      const linksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Link[];
      setLinks(linksData);
    } catch (err) {
      setError('Failed to fetch links');
      console.error('Error fetching links:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleDelete = async (linkId: string) => {
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'links', linkId));
      await fetchLinks();
      setShowDeleteModal(false);
    } catch (err) {
      setError('Failed to delete link');
      console.error('Error deleting link:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const categories = ['all', ...new Set(links.map(link => link.category))];
  const filteredLinks = selectedCategory === 'all' 
    ? links 
    : links.filter(link => link.category === selectedCategory);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Important Links</h1>
          <p className="text-sm text-gray-600 mt-1">Quick access to all Good for Good resources</p>
        </div>
        <button
          onClick={() => {
            setSelectedLink(null);
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
        >
          <span className="text-lg">+</span> Add New Link
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {category !== 'all' && CATEGORY_ICONS[category]}
              {category === 'all' ? 'All Links' : category}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLinks.map(link => (
          <div
            key={link.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 border border-gray-100"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-3">
                {CATEGORY_ICONS[link.category]}
                <h3 className="text-lg font-semibold text-gray-800 leading-tight">{link.title}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedLink(link);
                    setShowAddModal(true);
                  }}
                  className="text-gray-400 hover:text-blue-600 transition-colors duration-200"
                  title="Edit Link"
                >
                  <FaEdit size={16} />
                </button>
                <button
                  onClick={() => {
                    setSelectedLink(link);
                    setShowDeleteModal(true);
                  }}
                  className="text-gray-400 hover:text-red-600 transition-colors duration-200"
                  title="Delete Link"
                >
                  <FaTrash size={16} />
                </button>
              </div>
            </div>
            {link.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{link.description}</p>
            )}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {link.category}
              </span>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200"
              >
                Visit Link <FaExternalLinkAlt size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedLink ? 'Edit Link' : 'Add New Link'}
            </h2>
            <LinkForm
              link={selectedLink}
              onSuccess={() => {
                setShowAddModal(false);
                fetchLinks();
              }}
              onCancel={() => setShowAddModal(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Link</h2>
            <p className="mb-4">
              Are you sure you want to delete &quot;{selectedLink.title}&quot;?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedLink.id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 