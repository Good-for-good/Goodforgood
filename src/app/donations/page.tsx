'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc, updateDoc, limit, startAfter, where } from 'firebase/firestore';
import type { Donation } from '@/types';
import Modal from '@/components/Modal';
import DonationForm from '@/components/DonationForm';
import MemberDonationForm from '@/components/MemberDonationForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaSearch } from 'react-icons/fa';

const ITEMS_PER_PAGE = 10;

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

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DonationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'member'>('all');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMemberDonationModalOpen, setIsMemberDonationModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchDonations = async (isNewSearch = false) => {
    try {
      setLoading(true);
      let q;

      if (searchTerm) {
        // Search query
        q = query(
          collection(db, 'donations'),
          where('donor', '>=', searchTerm),
          where('donor', '<=', searchTerm + '\uf8ff'),
          orderBy('donor'),
          orderBy('date', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        // Regular pagination query
        q = isNewSearch || !lastVisible
          ? query(collection(db, 'donations'), orderBy('date', 'desc'), limit(ITEMS_PER_PAGE))
          : query(
              collection(db, 'donations'),
              orderBy('date', 'desc'),
              startAfter(lastVisible),
              limit(ITEMS_PER_PAGE)
            );
      }

      const querySnapshot = await getDocs(q);
      const donationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[];

      if (isNewSearch) {
        setDonations(donationsData);
      } else {
        setDonations(prev => [...prev, ...donationsData]);
      }

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
      setError(null);
    } catch (err) {
      console.error('Error fetching donations:', err);
      setError('Failed to load donations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations(true);
  }, []);

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchDonations();
  };

  const handleEditClick = (donation: Donation) => {
    setSelectedDonation(donation);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = async () => {
    setIsEditModalOpen(false);
    setSelectedDonation(null);
    await fetchDonations();
  };

  const handleDeleteClick = (donation: Donation) => {
    setSelectedDonation(donation);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedDonation) return;

    setIsDeleting(true);
    try {
      const donationRef = doc(db, 'donations', selectedDonation.id!);
      await deleteDoc(donationRef);
      setIsDeleteModalOpen(false);
      setSelectedDonation(null);
      await fetchDonations();
    } catch (err) {
      console.error('Error deleting donation:', err);
      setError('Failed to delete donation. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddMemberDonation = () => {
    setIsMemberDonationModalOpen(true);
  };

  const handleMemberDonationSuccess = () => {
    setIsMemberDonationModalOpen(false);
    fetchDonations();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setCurrentPage(1);
    await fetchDonations(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
      fetchDonations();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading donations...</p>
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

  const totalDonations = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Donations</h1>
          <p className="text-gray-600 mt-2">
            Total Donations: {formatAmount(totalDonations)}
          </p>
        </div>
        <div className="space-x-4">
          <button 
            onClick={handleAddMemberDonation}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Add Member Donation
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add General Donation
          </button>
        </div>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'all'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Donations
          </button>
          <button
            onClick={() => setActiveTab('member')}
            className={`px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'member'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Member Donations
          </button>
        </nav>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by donor name..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
                fetchDonations(true);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {donations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No donations found. Add your first donation to get started!</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donations
                .filter(donation => 
                  activeTab === 'all' || 
                  (activeTab === 'member' && donation.type === 'member')
                )
                .map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(donation.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {donation.donor}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {formatAmount(donation.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {donation.purpose}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {donation.notes || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(donation)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      disabled={isDeleting}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(donation)}
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

      {/* Load More Button */}
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
        title="Add New Donation"
      >
        <DonationForm
          onSuccess={handleAddSuccess}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDonation(null);
        }}
        title="Edit Donation"
      >
        <DonationForm
          donation={selectedDonation}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedDonation(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isMemberDonationModalOpen}
        onClose={() => setIsMemberDonationModalOpen(false)}
        title="Add Member Donation"
      >
        <MemberDonationForm
          onSuccess={handleMemberDonationSuccess}
          onCancel={() => setIsMemberDonationModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedDonation(null);
        }}
        title="Delete Donation"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this donation?
            <br />
            <span className="font-semibold">{selectedDonation?.donor} - {formatAmount(selectedDonation?.amount || 0)}</span>
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedDonation(null);
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