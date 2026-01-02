import { useState, useEffect } from 'react';
import { FiDollarSign, FiCheckCircle, FiAlertCircle, FiTrendingUp, FiCreditCard } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { feesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './FinancePage.css';
import ConfirmModal from '../../components/common/ConfirmModal';
import ReceiptModal from '../../components/finance/ReceiptModal';

const FinancePage = () => {
    const { canManageFees } = useAuth();
    const [summary, setSummary] = useState(null);
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('outstanding');
    const [payingId, setPayingId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmPayload, setConfirmPayload] = useState({ feeId: null, amount: 0, studentName: '' });
    const [receiptFee, setReceiptFee] = useState(null);

    useEffect(() => {
        fetchData();
    }, [filter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [summaryRes, feesRes] = await Promise.all([
                feesAPI.getSummary(),
                feesAPI.getAll({ status: filter !== 'all' ? filter : undefined })
            ]);
            setSummary(summaryRes.data.summary);
            setFees(feesRes.data.fees || []);
        } catch (error) {
            toast.error('Failed to fetch fee data');
        } finally {
            setLoading(false);
        }
    };

    const openPayConfirm = (feeId, amount, studentName) => {
        setConfirmPayload({ feeId, amount, studentName });
        setConfirmOpen(true);
    };

    const handleConfirmPay = async () => {
        const { feeId, amount, studentName } = confirmPayload;
        try {
            setPayingId(feeId);
            await feesAPI.pay(feeId, { paymentMethod: 'cash' });
            toast.success('Payment recorded successfully!');
            fetchData();
            setConfirmOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to process payment');
        } finally {
            setPayingId(null);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading finance data...</p>
            </div>
        );
    }

    return (
        <div className="finance-page">
            <div className="page-header">
                <h1>Finance Management</h1>
            </div>

            {/* Summary Cards */}
            <div className="finance-summary">
                <div className="summary-card collected">
                    <div className="summary-icon">
                        <FiCheckCircle />
                    </div>
                    <div className="summary-content">
                        <span className="summary-value">{formatCurrency(summary?.totalCollected || 0)}</span>
                        <span className="summary-label">Total Collected</span>
                    </div>
                </div>

                <div className="summary-card outstanding">
                    <div className="summary-icon">
                        <FiAlertCircle />
                    </div>
                    <div className="summary-content">
                        <span className="summary-value">{formatCurrency(summary?.totalOutstanding || 0)}</span>
                        <span className="summary-label">Outstanding</span>
                    </div>
                </div>

                <div className="summary-card expected">
                    <div className="summary-icon">
                        <FiTrendingUp />
                    </div>
                    <div className="summary-content">
                        <span className="summary-value">{formatCurrency(summary?.totalExpected || 0)}</span>
                        <span className="summary-label">Total Expected</span>
                    </div>
                </div>

                <div className="summary-card rate">
                    <div className="summary-icon">
                        <FiDollarSign />
                    </div>
                    <div className="summary-content">
                        <span className="summary-value">{summary?.collectionRate || 0}%</span>
                        <span className="summary-label">Collection Rate</span>
                    </div>
                </div>
            </div>

            {/* Fee List */}
            <div className="card">
                <div className="card-header">
                    <h3>Fee Records</h3>
                    <div className="filter-tabs">
                        <button
                            className={`tab ${filter === 'outstanding' ? 'active' : ''}`}
                            onClick={() => setFilter('outstanding')}
                        >
                            Outstanding
                        </button>
                        <button
                            className={`tab ${filter === 'paid' ? 'active' : ''}`}
                            onClick={() => setFilter('paid')}
                        >
                            Paid
                        </button>
                        <button
                            className={`tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                    </div>
                </div>
                <div className="card-body">
                    {fees.length > 0 ? (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Grade</th>
                                        <th>Amount</th>
                                        <th>Billing Type</th>
                                        <th>Status</th>
                                        {filter === 'paid' && <th>Receipt No</th>}
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fees.map((fee) => (
                                        <tr key={fee._id}>
                                            <td>
                                                <div className="student-cell">
                                                    <span className="name">{fee.student?.fullName}</span>
                                                    <span className="admission">{fee.student?.admissionNo}</span>
                                                </div>
                                            </td>
                                            <td>{fee.student?.grade?.name}</td>
                                            <td className="amount">{formatCurrency(fee.amount)}</td>
                                            <td className="capitalize">{fee.billingType}</td>
                                            <td>
                                                <span className={`badge badge-${fee.status === 'paid' ? 'success' : 'warning'}`}>
                                                    {fee.status}
                                                </span>
                                            </td>
                                            {filter === 'paid' && <td className="receipt">{fee.receiptNo}</td>}
                                            <td>
                                                {fee.status === 'outstanding' ? (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => openPayConfirm(fee._id, fee.amount, fee.student?.fullName)}
                                                        disabled={payingId === fee._id}
                                                    >
                                                        {payingId === fee._id ? (
                                                            <span className="spinner"></span>
                                                        ) : (
                                                            <><FiCreditCard /> Pay</>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-sm btn-ghost"
                                                        onClick={() => setReceiptFee(fee)}
                                                    >
                                                        Print Receipt
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <FiDollarSign className="empty-icon" />
                            <p>No fee records found</p>
                        </div>
                    )}
                </div>
            </div>
            <ConfirmModal
                open={confirmOpen}
                title="Confirm Payment"
                message={
                    `Confirm payment of KES ${confirmPayload.amount.toLocaleString()} for ${confirmPayload.studentName}?`
                }
                onConfirm={handleConfirmPay}
                onCancel={() => setConfirmOpen(false)}
                confirmText="Confirm"
                cancelText="Cancel"
                loading={payingId === confirmPayload.feeId}
            />

            <ReceiptModal
                isOpen={!!receiptFee}
                data={receiptFee}
                onClose={() => setReceiptFee(null)}
            />
        </div>
    );
};

export default FinancePage;
