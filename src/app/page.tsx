'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import type { Activity, Member, Donation, Expense } from '@/types';
import Link from 'next/link';

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

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalDonations: 0,
    totalExpenses: 0,
    totalContributions: 0,
    upcomingActivities: 0,
    ongoingActivities: 0,
    completedActivities: 0
  });
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch members statistics
      const membersRef = collection(db, 'members');
      const membersSnapshot = await getDocs(membersRef);
      const totalMembers = membersSnapshot.size;

      // Fetch donations
      const donationsRef = collection(db, 'donations');
      const donationsSnapshot = await getDocs(donationsRef);
      const totalDonations = donationsSnapshot.docs.reduce((sum, doc) => {
        const donation = doc.data();
        return sum + (donation.amount || 0);
      }, 0);

      // Fetch recent donations
      const recentDonationsQuery = query(donationsRef, orderBy('date', 'desc'), limit(5));
      const recentDonationsSnapshot = await getDocs(recentDonationsQuery);
      const recentDonationsData = recentDonationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Donation));

      // Fetch expenses
      const expensesRef = collection(db, 'expenses');
      const expensesSnapshot = await getDocs(expensesRef);
      const totalExpenses = expensesSnapshot.docs.reduce((sum, doc) => {
        const expense = doc.data();
        return sum + (expense.amount || 0);
      }, 0);

      // Fetch recent expenses
      const recentExpensesQuery = query(expensesRef, orderBy('date', 'desc'), limit(5));
      const recentExpensesSnapshot = await getDocs(recentExpensesQuery);
      const recentExpensesData = recentExpensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Expense));

      // Fetch activities
      const activitiesRef = collection(db, 'activities');
      const upcomingQuery = query(activitiesRef, where('status', '==', 'upcoming'));
      const ongoingQuery = query(activitiesRef, where('status', '==', 'ongoing'));
      const completedQuery = query(activitiesRef, where('status', '==', 'completed'));
      const recentQuery = query(activitiesRef, orderBy('date', 'desc'), limit(5));

      const [upcomingSnapshot, ongoingSnapshot, completedSnapshot, recentSnapshot] = await Promise.all([
        getDocs(upcomingQuery),
        getDocs(ongoingQuery),
        getDocs(completedQuery),
        getDocs(recentQuery)
      ]);

      // Calculate total contributions from completed activities
      const totalContributions = completedSnapshot.docs.reduce((sum, doc) => {
        const activity = doc.data();
        return sum + (activity.actualAmount || 0);
      }, 0);

      const recentActivitiesData = recentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Activity));

      setStats({
        totalMembers,
        activeMembers: totalMembers, // You might want to add an 'active' field to members later
        totalDonations,
        totalExpenses,
        totalContributions,
        upcomingActivities: upcomingSnapshot.size,
        ongoingActivities: ongoingSnapshot.size,
        completedActivities: completedSnapshot.size
      });

      setRecentActivities(recentActivitiesData);
      setRecentDonations(recentDonationsData);
      setRecentExpenses(recentExpensesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Members</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalMembers}</p>
          <p className="text-sm text-gray-500 mt-1">Active Members</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Activities</h3>
          <p className="text-3xl font-bold text-indigo-600">
            {stats.upcomingActivities + stats.ongoingActivities}
          </p>
          <div className="text-sm text-gray-500 mt-1">
            <span className="inline-flex items-center">
              <span className="h-2 w-2 rounded-full bg-yellow-400 mr-1"></span>
              {stats.upcomingActivities} upcoming
            </span>
            <span className="mx-2">•</span>
            <span className="inline-flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-400 mr-1"></span>
              {stats.ongoingActivities} ongoing
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed Activities</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.completedActivities}</p>
          <p className="text-sm text-gray-500 mt-1">Total Contributions: {formatAmount(stats.totalContributions)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Overview</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatAmount(stats.totalDonations - stats.totalContributions - stats.totalExpenses)}
          </p>
          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Donations:</span>
              <span className="text-green-600 font-medium">{formatAmount(stats.totalDonations)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Activity Contributions:</span>
              <span className="text-indigo-600 font-medium">-{formatAmount(stats.totalContributions)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Other Expenses:</span>
              <span className="text-red-600 font-medium">-{formatAmount(stats.totalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md mb-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/members"
              className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Add Member
            </Link>

            <Link
              href="/donors"
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Add Donation
            </Link>

            <Link
              href="/expenses"
              className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Add Expense
            </Link>

            <Link
              href="/activities"
              className="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Add Activity
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <Link 
                href="/activities"
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center">No recent activities</p>
            ) : (
              <div className="space-y-4">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-500">{formatDate(activity.date)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      activity.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                      activity.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                      activity.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Financial Activity */}
        <div className="space-y-8">
          {/* Recent Donations */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Recent Donations</h3>
                <Link 
                  href="/donors"
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentDonations.length === 0 ? (
                <p className="text-gray-500 text-center">No recent donations</p>
              ) : (
                <div className="space-y-4">
                  {recentDonations.map(donation => (
                    <div key={donation.id} className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {donation.donor || 'Anonymous'}
                        </h4>
                        <p className="text-sm text-gray-500">{formatDate(donation.date)}</p>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {formatAmount(donation.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
                <Link 
                  href="/expenses"
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentExpenses.length === 0 ? (
                <p className="text-gray-500 text-center">No recent expenses</p>
              ) : (
                <div className="space-y-4">
                  {recentExpenses.map(expense => (
                    <div key={expense.id} className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{expense.description}</h4>
                        <p className="text-sm text-gray-500">{formatDate(expense.date)}</p>
                      </div>
                      <span className="text-sm font-medium text-red-600">
                        {formatAmount(expense.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 