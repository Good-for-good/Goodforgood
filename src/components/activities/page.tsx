'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc, limit, startAfter, where } from 'firebase/firestore';
import type { Activity } from '@/types';
import Modal from '@/components/Modal';
import ActivityForm from '@/components/ActivityForm';
import ActivityParticipants from '@/components/ActivityParticipants';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaSearch } from 'react-icons/fa';

const ITEMS_PER_PAGE = 10;

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: any): string {
  if (!date) return 'N/A';
  
  if (date && typeof date === 'object' && 'toDate' in date) {
    return date.toDate().toLocaleDateString();
  }
  
  try {
    return new Date(date).toLocaleDateString();
  } catch (e) {
    return 'Invalid Date';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'upcoming':
      return 'bg-yellow-100 text-yellow-800';
    case 'ongoing':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchActivities = async (isNewSearch = false) => {
    try {
      setLoading(true);
      let q;

      if (searchTerm) {
        // Search query
        q = query(
          collection(db, 'activities'),
          where('title', '>=', searchTerm),
          where('title', '<=', searchTerm + '\uf8ff'),
          orderBy('title'),
          orderBy('date', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        // Regular pagination query
        q = isNewSearch || !lastVisible
          ? query(collection(db, 'activities'), orderBy('date', 'desc'), limit(ITEMS_PER_PAGE))
          : query(
              collection(db, 'activities'),
              orderBy('date', 'desc'),
              startAfter(lastVisible),
              limit(ITEMS_PER_PAGE)
            );
      }

      const querySnapshot = await getDocs(q);
      const activityData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));

      if (isNewSearch) {
        setActivities(activityData);
      } else {
        setActivities(prev => [...prev, ...activityData]);
      }

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
      setError(null);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(true);
  }, []);

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchActivities();
  };

  const handleEditClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedActivity(null);
    fetchActivities();
  };

  const handleDeleteClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedActivity) return;

    setIsDeleting(true);
    try {
      const activityRef = doc(db, 'activities', selectedActivity.id!);
      await deleteDoc(activityRef);
      setIsDeleteModalOpen(false);
      setSelectedActivity(null);
      await fetchActivities();
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError('Failed to delete activity. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setCurrentPage(1);
    await fetchActivities(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
      fetchActivities();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const upcomingActivities = activities.filter(a => a.status === 'upcoming').length;
  const ongoingActivities = activities.filter(a => a.status === 'ongoing').length;
  const completedActivities = activities.filter(a => a.status === 'completed').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Activities</h1>
          <div className="flex gap-4 mt-2">
            <div className="text-sm text-yellow-600">
              Upcoming: {upcomingActivities}
            </div>
            <div className="text-sm text-green-600">
              Ongoing: {ongoingActivities}
            </div>
            <div className="text-sm text-blue-600">
              Completed: {completedActivities}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedActivity(null);
            setIsAddModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
        >
          <span className="text-lg">+</span> Add Activity
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search activities by title..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title & Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participants
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget & Contribution
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(activity.date)}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </div>
                  {activity.description && (
                    <div className="text-sm text-gray-500">
                      {activity.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activity.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {activity.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      setSelectedActivity(activity);
                      setIsParticipantsModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View ({activity.participants?.length || 0})
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>Budget: {formatAmount(activity.budget || 0)}</div>
                  <div>Contribution: {formatAmount(activity.contribution || 0)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditClick(activity)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(activity)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="bg-white text-gray-600 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Add Activity Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Activity">
        <ActivityForm onSuccess={handleAddSuccess} onCancel={() => setIsAddModalOpen(false)} />
      </Modal>

      {/* Edit Activity Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Activity">
        <ActivityForm
          activity={selectedActivity}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Participants Modal */}
      <Modal isOpen={isParticipantsModalOpen} onClose={() => setIsParticipantsModalOpen(false)} title="Manage Participants">
        {selectedActivity && (
          <ActivityParticipants
            activity={selectedActivity}
            onClose={() => setIsParticipantsModalOpen(false)}
            onSuccess={() => {
              setIsParticipantsModalOpen(false);
              fetchActivities();
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Activity">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete this activity? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 