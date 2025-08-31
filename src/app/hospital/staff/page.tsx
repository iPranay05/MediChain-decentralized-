'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { FaUserMd, FaUserNurse, FaUser, FaEdit, FaTrash } from 'react-icons/fa';

interface Staff {
  id: number;
  name: string;
  role: string;
  specialization: string;
  email: string;
  phone: string;
  joinDate: string;
  status: 'active' | 'on-leave' | 'inactive';
}

const initialStaff: Staff[] = [
  {
    id: 1,
    name: 'Dr. Rajesh Kumar',
    role: 'Doctor',
    specialization: 'Cardiology',
    email: 'rajesh.kumar@medichain.com',
    phone: '9876543210',
    joinDate: '2024-01-15',
    status: 'active'
  },
  {
    id: 2,
    name: 'Dr. Priya Sharma',
    role: 'Doctor',
    specialization: 'Pediatrics',
    email: 'priya.sharma@medichain.com',
    phone: '9876543211',
    joinDate: '2024-02-01',
    status: 'active'
  },
  {
    id: 3,
    name: 'Nurse Anita Patel',
    role: 'Nurse',
    specialization: 'General Care',
    email: 'anita.patel@medichain.com',
    phone: '9876543212',
    joinDate: '2024-01-20',
    status: 'active'
  },
  {
    id: 4,
    name: 'Dr. Suresh Reddy',
    role: 'Doctor',
    specialization: 'Orthopedics',
    email: 'suresh.reddy@medichain.com',
    phone: '9876543213',
    joinDate: '2024-02-15',
    status: 'on-leave'
  },
  {
    id: 5,
    name: 'Nurse Meera Singh',
    role: 'Nurse',
    specialization: 'ICU',
    email: 'meera.singh@medichain.com',
    phone: '9876543214',
    joinDate: '2024-01-25',
    status: 'active'
  }
];

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role.toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status: Staff['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on-leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'doctor':
        return <FaUserMd className="w-5 h-5 text-blue-600" />;
      case 'nurse':
        return <FaUserNurse className="w-5 h-5 text-pink-600" />;
      default:
        return <FaUser className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Staff Management</h1>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Add New Staff
            </button>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or specialization..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="doctor">Doctors</option>
                <option value="nurse">Nurses</option>
              </select>
            </div>
          </div>

          {/* Staff List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStaff.map((member) => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getRoleIcon(member.role)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.role} - {member.specialization}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                      <div className="text-sm text-gray-500">{member.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.joinDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(member.status)}`}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        <FaEdit className="w-5 h-5" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <FaTrash className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
