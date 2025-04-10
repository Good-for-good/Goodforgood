'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import type { Donation } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaSearch } from 'react-icons/fa';

interface DonorSummary {
  name: string;
  totalAmount: number;
  lastDonation: any;
  donationCount: number;
}

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

const ITEMS_PER_PAGE = 10;

export default function DonorsPage() {
  const [donors, setDonors] = useState<DonorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [allDonations, setAllDonations] = useState<Donation[]>([]);

  const processDonations = (donations: Donation[]) => {
    const donorMap = new Map<string, DonorSummary>();
    
    donations.forEach(donation => {
      const existing = donorMap.get(donation.donor) || {
        name: donation.donor,
        totalAmount: 0,
        lastDonation: null,
        donationCount: 0
      };

      existing.totalAmount += donation.amount;
      existing.donationCount += 1;
      
      if (!existing.lastDonation || 
          (donation.date && existing.lastDonation && 
           donation.date.toDate() > existing.lastDonation.toDate())) {
        existing.lastDonation = donation.date;
      }

      donorMap.set(donation.donor, existing);
    });

    return Array.from(donorMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const fetchDonors = async (isNewSearch = false) => {
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
      const donations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));

      if (isNewSearch) {
        setAllDonations(donations);
      } else {
        setAllDonations(prev => [...prev, ...donations]);
      }

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
      
      // Process donations to get donor summaries
      const donorList = processDonations(isNewSearch ? donations : [...allDonations, ...donations]);
      setDonors(donorList);
      setError(null);
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError('Failed to load donors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setCurrentPage(1);
    await fetchDonors(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
      fetchDonors();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading donors...</p>
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

  const totalDonors = donors.length;
  const totalDonations = donors.reduce((sum, donor) => sum + donor.totalAmount, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Donors</h1>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Donors</p>
            <p className="text-2xl font-bold">{totalDonors}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Contributions</p>
            <p className="text-2xl font-bold text-green-600">{formatAmount(totalDonations)}</p>
          </div>
        </div>
      </div>

      {/* Add Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by donor name..."
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
                fetchDonors(true);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {donors.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No donors found. Add donations to see donor information.</p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donor Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Contributions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Number of Donations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Donation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donors.map((donor) => (
                <tr key={donor.name} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {donor.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {formatAmount(donor.totalAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {donor.donationCount} {donor.donationCount === 1 ? 'donation' : 'donations'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(donor.lastDonation)}
                    </div>
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
    </div>
  );
} 