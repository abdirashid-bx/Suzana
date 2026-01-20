import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiFileText, FiAlertTriangle } from 'react-icons/fi';
import api, { staffAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';
import '../students/Students.css'; // Reuse student styles

const StaffList = () => {
    const { canManageStaff, canDelete } = useAuth();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [sortOption, setSortOption] = useState('createdAt-desc');

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState(null);

    useEffect(() => {
        fetchStaff();
    }, [filterRole, sortOption]);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const [sortBy, sortOrder] = sortOption.split('-');
            const response = await staffAPI.getAll({
                role: filterRole,
                search: searchTerm,
                sortBy: sortBy,
                sortOrder: sortOrder
            });
            setStaff(response.data.staff || []);
        } catch (error) {
            toast.error('Failed to fetch staff members');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (staffMember) => {
        setStaffToDelete(staffMember);
        setShowDeleteModal(true);
    };

    const executeDelete = async () => {
        if (!staffToDelete) return;

        try {
            await staffAPI.delete(staffToDelete._id);
            toast.success('Staff member deleted successfully');
            fetchStaff(); // Refresh list
            setShowDeleteModal(false);
            setStaffToDelete(null);
        } catch (error) {
            toast.error('Failed to delete staff member');
        }
    };

    // Filter by search term locally if needed, or trigger API search
    const handleSearch = (e) => {
        e.preventDefault();
        fetchStaff();
    };

    const columns = [
        {
            key: 'photo',
            label: 'Photo',
            render: (row) => (
                <div className="student-avatar-small">
                    {row.photo ? (
                        <img src={`${api.defaults.baseURL.replace('/api', '')}${row.photo}`} alt={row.fullName} />
                    ) : (
                        <div className="avatar-placeholder">{row.fullName.charAt(0)}</div>
                    )}
                </div>
            )
        },
        { key: 'nationalId', label: 'ID Number' },
        {
            key: 'fullName',
            label: 'Name',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.fullName}</div>
                    <div className="text-secondary text-sm">{row.email || row.phone}</div>
                </div>
            )
        },
        {
            key: 'role',
            label: 'Role',
            render: (row) => (
                <span className={`status-badge status-${row.role}`}>
                    {row.role.replace('_', ' ')}
                </span>
            )
        },
        {
            key: 'assignedGrade',
            label: 'Assigned Class',
            render: (row) => row.assignedGrade?.name || '-'
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <div className="table-actions">
                    <Link to={`/staff/${row._id}`} className="btn-icon" title="View Details">
                        <FiFileText />
                    </Link>
                    {canManageStaff() && (
                        <Link to={`/staff/${row._id}/edit`} className="btn-icon" title="Edit">
                            <FiEdit2 />
                        </Link>
                    )}
                    {canDelete() && (
                        <button
                            onClick={() => confirmDelete(row)}
                            className="btn-icon btn-icon-danger"
                            title="Delete"
                        >
                            <FiTrash2 />
                        </button>
                    )}
                </div>
            )
        }
    ];

    // Client-side filtering for instant feedback
    const filteredStaff = staff.filter(person => {
        const searchLower = searchTerm.toLowerCase();
        return (
            person.fullName?.toLowerCase().includes(searchLower) ||
            person.nationalId?.toLowerCase().includes(searchLower) ||
            person.email?.toLowerCase().includes(searchLower) ||
            person.userAccount?.username?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="students-page">
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Staff Management</h1>
                    <span className="count-badge">{filteredStaff.length} staff members</span>
                </div>
                {canManageStaff() && (
                    <Link to="/staff/new" className="btn btn-primary">
                        <FiPlus /> Add Staff
                    </Link>
                )}
            </div>

            <div className="table-card">
                <div className="table-header-controls">
                    <form onSubmit={handleSearch} className="search-form">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </form>
                    <div className="filters">
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Roles</option>
                            <option value="teacher">Teachers</option>
                            <option value="head_teacher">Head Teachers</option>
                            <option value="admin">Admins</option>
                            <option value="support_staff">Support Staff</option>
                        </select>
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="filter-select"
                        >
                            <option value="createdAt-desc">Newest First</option>
                            <option value="createdAt-asc">Oldest First</option>
                            <option value="fullName-asc">Name (A-Z)</option>
                            <option value="fullName-desc">Name (Z-A)</option>
                        </select>
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredStaff}
                    isLoading={loading}
                    emptyMessage="No staff members found"
                />
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-icon">
                            <FiAlertTriangle />
                        </div>
                        <h3 className="modal-title">Delete Staff Member?</h3>
                        <p className="modal-message">
                            Are you sure you want to delete <strong>{staffToDelete?.fullName}</strong>?
                            This action will remove their profile and associated user account.
                            <br /><br />
                            This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-ghost btn-cancel"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setStaffToDelete(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger btn-confirm-delete"
                                onClick={executeDelete}
                            >
                                Delete Staff
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffList;
