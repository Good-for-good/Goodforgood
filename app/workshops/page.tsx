'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import type { WorkshopResource } from '@/types';
import Modal from '@/components/Modal';
import WorkshopResourceForm from '@/components/WorkshopResourceForm';

export default function WorkshopsPage() {
  const [resources, setResources] = useState<WorkshopResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<WorkshopResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'member' | 'external'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchResources = async () => {
    try {
      const resourcesRef = collection(db, 'workshopResources');
      const q = query(resourcesRef, orderBy('name'));
      const snapshot = await getDocs(q);
      const resourceData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
        } as WorkshopResource;
      });
      setResources(resourceData);
      setError(null);
    } catch (err) {
      console.error('Error fetching workshop resources:', err);
      setError('Failed to load workshop resources. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchResources();
  };

  const handleEditClick = (resource: WorkshopResource) => {
    setSelectedResource(resource);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedResource(null);
    fetchResources();
  };

  const handleDeleteClick = (resource: WorkshopResource) => {
    setSelectedResource(resource);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedResource) return;

    setIsDeleting(true);
    try {
      const resourceRef = doc(db, 'workshopResources', selectedResource.id!);
      await deleteDoc(resourceRef);
      setIsDeleteModalOpen(false);
      setSelectedResource(null);
      await fetchResources();
    } catch (err) {
      console.error('Error deleting workshop resource:', err);
      setError('Failed to delete workshop resource. Please try again later.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesType = filterType === 'all' || resource.type === filterType;
    const matchesSearch = searchTerm === '' || 
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.expertise.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workshop resources...</p>
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
          <h1 className="text-3xl font-bold">Workshop Resources</h1>
          <p className="text-gray-600 mt-2">
            Manage potential workshop leaders and their specializations
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
        >
          Add Resource
        </button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, specialization, or expertise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-md ${
              filterType === 'all' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('member')}
            className={`px-4 py-2 rounded-md ${
              filterType === 'member' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setFilterType('external')}
            className={`px-4 py-2 rounded-md ${
              filterType === 'external' 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            External
          </button>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No workshop resources found. Add your first resource to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
                    <p className="text-sm text-gray-600">{resource.specialization}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    resource.type === 'member' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {resource.type}
                  </span>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Expertise</h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {resource.expertise.map((exp, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Reference</h4>
                  <p className="text-sm text-gray-600">
                    {resource.reference.name}
                    {resource.reference.relationship && ` (${resource.reference.relationship})`}
                  </p>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Contact</h4>
                  <p className="text-sm text-gray-600">{resource.contactDetails.email}</p>
                  <p className="text-sm text-gray-600">{resource.contactDetails.phone}</p>
                  {resource.contactDetails.address && (
                    <p className="text-sm text-gray-600">{resource.contactDetails.address}</p>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => handleEditClick(resource)}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={() => handleDeleteClick(resource)}
                    className="text-red-600 hover:text-red-700"
                    disabled={isDeleting}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Workshop Resource"
      >
        <WorkshopResourceForm
          onSuccess={handleAddSuccess}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedResource(null);
        }}
        title="Edit Workshop Resource"
      >
        <WorkshopResourceForm
          resource={selectedResource}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedResource(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedResource(null);
        }}
        title="Delete Workshop Resource"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this workshop resource?
            <br />
            <span className="font-semibold">{selectedResource?.name}</span>
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedResource(null);
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