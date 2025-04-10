'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import type { Meeting } from '@/types';
import Modal from '@/components/Modal';
import MeetingForm from '@/components/MeetingForm';
import { format } from 'date-fns';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');

  const fetchMeetings = async () => {
    try {
      const meetingsRef = collection(db, 'meetings');
      const q = query(meetingsRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const meetingData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date : null,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : null,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : null,
        } as Meeting;
      });
      setMeetings(meetingData);
      setError(null);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Failed to load meetings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchMeetings();
  };

  const handleEditClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedMeeting(null);
    fetchMeetings();
  };

  const handleViewDetails = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedMeeting) return;

    try {
      const meetingRef = doc(db, 'meetings', selectedMeeting.id!);
      await deleteDoc(meetingRef);
      setIsDeleteModalOpen(false);
      setSelectedMeeting(null);
      fetchMeetings();
    } catch (err) {
      console.error('Error deleting meeting:', err);
      setError('Failed to delete meeting. Please try again.');
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    const matchesSearch = searchTerm === '' || 
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.agenda.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.attendees.some(attendee => 
        attendee.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meetings...</p>
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
          <h1 className="text-3xl font-bold">Minutes of Meeting</h1>
          <p className="text-gray-600 mt-2">
            Manage and track all meeting minutes
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
        >
          New Meeting
        </button>
      </div>

      {/* Filters and Search */}
      <div className="mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by title, agenda, or attendees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>

      {filteredMeetings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No meetings found. Create your first meeting to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                    <p className="text-sm text-gray-600">
                      {meeting.date instanceof Timestamp ? 
                        format(meeting.date.toDate(), 'PPP') : 'Date not set'} | {meeting.startTime} - {meeting.endTime}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{meeting.location}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Attendees</h4>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {meeting.attendees.map((attendee) => (
                      <span
                        key={attendee.id}
                        className={`px-2 py-1 text-xs rounded-full ${
                          attendee.present
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {attendee.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => handleViewDetails(meeting)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleEditClick(meeting)}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(meeting)}
                    className="text-red-600 hover:text-red-700"
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
        title="New Meeting"
      >
        <MeetingForm
          onSuccess={handleAddSuccess}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMeeting(null);
        }}
        title="Edit Meeting"
      >
        <MeetingForm
          meeting={selectedMeeting}
          onSuccess={handleEditSuccess}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedMeeting(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedMeeting(null);
        }}
        title="Meeting Details"
      >
        {selectedMeeting && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedMeeting.title}</h3>
              <p className="text-sm text-gray-600">
                {selectedMeeting.date instanceof Timestamp ? 
                  format(selectedMeeting.date.toDate(), 'PPP') : 'Date not set'} | {selectedMeeting.startTime} - {selectedMeeting.endTime}
              </p>
              <p className="text-sm text-gray-600">{selectedMeeting.location}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Attendees</h4>
              <div className="flex flex-wrap gap-2">
                {selectedMeeting.attendees.map((attendee) => (
                  <span
                    key={attendee.id}
                    className={`px-2 py-1 text-xs rounded-full ${
                      attendee.present
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {attendee.name}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Agenda</h4>
              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                {selectedMeeting.agenda}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Minutes</h4>
              <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                {selectedMeeting.minutes}
              </div>
            </div>

            {selectedMeeting.decisions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Decisions Made</h4>
                <div className="space-y-2">
                  {selectedMeeting.decisions.map((decision, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      {decision}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedMeeting.attachments && selectedMeeting.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Attachments</h4>
                <div className="space-y-2">
                  {selectedMeeting.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        {attachment.name}
                      </a>
                      <span className="text-xs text-gray-500">({attachment.type})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-4">
              {selectedMeeting.createdAt && (
                <p>Created: {format(selectedMeeting.createdAt.toDate(), 'PPp')}</p>
              )}
              {selectedMeeting.updatedAt && (
                <p>Last updated: {format(selectedMeeting.updatedAt.toDate(), 'PPp')}</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMeeting(null);
        }}
        title="Delete Meeting"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this meeting?
            <br />
            <span className="font-semibold">{selectedMeeting?.title}</span>
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedMeeting(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 