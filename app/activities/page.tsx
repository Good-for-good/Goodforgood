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
  
  // Handle Firestore Timestamp
  if (date && typeof date === 'object' && 'toDate' in date) {
    return date.toDate().toLocaleDateString();
  }
  
  // Handle regular Date objects or ISO strings
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

export default function ActivitiesPage() {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
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
          <h1 className="text-3xl font-bold">Activities</h1>
          <p className="text-gray-600 mt-2">
            {upcomingActivities} upcoming • {ongoingActivities} ongoing • {completedActivities} completed
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add Activity
        </button>
      </div>

      {/* Add Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Search
          </button>
          {isSearching && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setIsSearching(false);
                fetchActivities(true);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No activities found. Add your first activity to get started!</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(activity.date)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {activity.startTime} - {activity.endTime}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </div>
                    <div className="text-sm text-gray-500 line-clamp-2">
                      {activity.description}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Organizer: {activity.organizer}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{activity.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{activity.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {activity.currentParticipants || 0}
                      {activity.maxParticipants ? ` / ${activity.maxParticipants}` : ''}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedActivity(activity);
                        setIsParticipantsModalOpen(true);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-900 mt-1"
                    >
                      Manage Participants
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activity.budget && (
                      <div className="text-sm text-gray-900">
                        Budget: {formatAmount(activity.budget)}
                      </div>
                    )}
                    {activity.status === 'completed' && (
                      <>
                        {activity.actualAmount && (
                          <div className="text-sm text-indigo-600 mt-1">
                            Contribution: {formatAmount(activity.actualAmount)}
                          </div>
                        )}
                        {activity.contributionDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(activity.contributionDate)}
                          </div>
                        )}
                        {activity.contributionNotes && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {activity.contributionNotes}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(activity)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      disabled={isDeleting}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(activity)}
                      className="text-red-600 hover:text-red-900"
                      disabled={isDeleting}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Load More Button */}
      {!loading && hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Load More
          </button>
        </div>
      )}

      {loading && (
        <div className="mt-6 text-center">
          <LoadingSpinner />
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Activity"
      >
        <ActivityForm
          onSuccess={handleAddSuccess}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedActivity(null);
        }}
        title="Edit Activity"
      >
        <ActivityForm
          activity={selectedActivity || undefined}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedActivity(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isParticipantsModalOpen}
        onClose={() => setIsParticipantsModalOpen(false)}
        title="Manage Participants"
      >
        {selectedActivity && (
          <ActivityParticipants
            activity={selectedActivity}
            onClose={() => setIsParticipantsModalOpen(false)}
            onUpdate={fetchActivities}
          />
        )}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedActivity(null);
        }}
        title="Delete Activity"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this activity?
            <br />
            <span className="font-semibold">{selectedActivity?.title}</span>
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedActivity(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 