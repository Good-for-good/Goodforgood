'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import type { Member } from '@/types';
import Modal from '@/components/Modal';
import MemberForm from '@/components/MemberForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaSearch, FaUserCircle, FaEdit, FaTrash } from 'react-icons/fa';

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

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchMembers = async (isNewSearch = false) => {
    try {
      setLoading(true);
      let q;

      if (searchTerm) {
        // Search query
        q = query(
          collection(db, 'members'),
          where('name', '>=', searchTerm),
          where('name', '<=', searchTerm + '\uf8ff'),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        // Regular pagination query
        q = isNewSearch || !lastVisible
          ? query(collection(db, 'members'), orderBy('name'), limit(ITEMS_PER_PAGE))
          : query(
              collection(db, 'members'),
              orderBy('name'),
              startAfter(lastVisible),
              limit(ITEMS_PER_PAGE)
            );
      }

      const querySnapshot = await getDocs(q);
      const membersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Member[];

      if (isNewSearch) {
        setMembers(membersData);
      } else {
        setMembers(prev => [...prev, ...membersData]);
      }

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
    } catch (err) {
      setError('Failed to fetch members');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(true);
  }, []);

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchMembers(true);
  };

  const handleEditClick = (member: Member) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedMember(null);
    fetchMembers(true);
  };

  const handleDeleteClick = (member: Member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedMember) return;

    setIsDeleting(true);
    try {
      const memberRef = doc(db, 'members', selectedMember.id!);
      await deleteDoc(memberRef);
      setIsDeleteModalOpen(false);
      setSelectedMember(null);
      await fetchMembers(true);
    } catch (err) {
      console.error('Error deleting member:', err);
      setError('Failed to delete member. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setCurrentPage(1);
    await fetchMembers(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
      fetchMembers();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading members...</p>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Members</h1>
          <p className="text-sm text-gray-600 mt-1">Manage Good for Good trust members</p>
        </div>
        <button
          onClick={() => {
            setSelectedMember(null);
            setIsAddModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
        >
          <span className="text-lg">+</span> Add Member
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
              placeholder="Search members by name..."
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
              onClick={(e) => {
                e.preventDefault();
                setSearchTerm('');
                setIsSearching(false);
                fetchMembers(true);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {members.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No members found. Add your first member to get started!</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 text-gray-400">
                          <FaUserCircle size={24} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{member.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(member.joinDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setIsEditModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                        title="Edit Member"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Member"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        title="Add New Member"
      >
        <MemberForm
          member={selectedMember}
          onSuccess={handleAddSuccess}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMember(null);
        }}
        title="Edit Member"
      >
        <MemberForm
          member={selectedMember}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedMember(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMember(null);
        }}
        title="Delete Member"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this member?
            <br />
            <span className="font-semibold">{selectedMember?.name}</span>
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedMember(null);
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