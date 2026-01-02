import React, { useState } from 'react';
import { FiPrinter, FiX, FiDownload } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import './ReceiptModal.css';

const ReceiptModal = ({ isOpen, onClose, data }) => {
    const [downloading, setDownloading] = useState(false);

    if (!isOpen || !data) return null;

    const {
        receiptNo,
        amount,
        student,
        billingType,
        status,
        paidDate,
        updatedAt,
        paymentMethod,
        paidAmount,
        balance
    } = data;

    const formatDate = (dateString) => {
        return new Date(dateString || Date.now()).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        const element = document.getElementById('printable-receipt');
        if (!element) return;

        try {
            setDownloading(true);
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

            // Calculate dimensions to fit on page while maintaining aspect ratio
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10; // Top padding

            // But simpler: force width to PDF width (minus margins usually)
            // My CSS width is 210mm, so it should match PDF width exactly effectively.
            const finalImgWidth = pdfWidth;
            const finalImgHeight = (imgHeight * finalImgWidth) / imgWidth;

            pdf.addImage(imgData, 'PNG', 0, 0, finalImgWidth, finalImgHeight);
            pdf.save(`Receipt-${receiptNo || 'draft'}.pdf`);
            toast.success('Receipt downloaded');
        } catch (error) {
            console.error('PDF generation failed', error);
            toast.error('Failed to generate PDF');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="receipt-modal-overlay">
            <div className="receipt-modal-content">
                <div className="receipt-actions-top">
                    <h2 className="modal-title">Receipt Preview</h2>
                    <div className="action-buttons">
                        <button onClick={handleDownload} className="modern-btn download-btn" disabled={downloading}>
                            {downloading ? <span className="spinner-sm"></span> : <FiDownload />}
                            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
                        </button>
                        <button onClick={onClose} className="modern-btn close-btn">
                            <FiX /> Close
                        </button>
                    </div>
                </div>

                <div className="receipt-paper" id="printable-receipt">
                    <div className="receipt-header">
                        <div className="header-left">
                            <img src="/logo.jpg" alt="Logo" className="receipt-logo" />
                            <div className="school-info">
                                <h2>Suzana Education Center</h2>
                                <p>Excellence in Education</p>
                                <p>PO Box 456, Garissa</p>
                                <p>Tel: +254 700 000 000</p>
                            </div>
                        </div>
                        <div className="header-right">
                            <h1 className="receipt-title">RECEIPT</h1>
                            <div className="receipt-meta">
                                <p><strong>Receipt No:</strong> {receiptNo || 'N/A'}</p>
                                <p><strong>Date:</strong> {formatDate(paidDate || updatedAt)}</p>
                                <p><strong>Status:</strong> <span style={{ textTransform: 'uppercase' }}>{status}</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="receipt-body">
                        <div className="info-grid">
                            <div className="info-group">
                                <label>Received From</label>
                                <p>{student?.fullName}</p>
                            </div>
                            <div className="info-group">
                                <label>Admission No</label>
                                <p>{student?.admissionNo}</p>
                            </div>
                            <div className="info-group">
                                <label>Grade / Class</label>
                                <p>{student?.grade?.name}</p>
                            </div>
                            <div className="info-group">
                                <label>Payment Method</label>
                                <p style={{ textTransform: 'capitalize' }}>{paymentMethod ? paymentMethod.replace('_', ' ') : 'Cash'}</p>
                            </div>
                        </div>

                        <div className="payment-details">
                            <div className="detail-row">
                                <span>Description</span>
                                <span style={{ textTransform: 'capitalize' }}>{billingType} Fee</span>
                            </div>
                            <div className="detail-row">
                                <span>Total Amount</span>
                                <span>{formatCurrency(amount)}</span>
                            </div>
                            <div className="detail-row total">
                                <span>AMOUNT PAID</span>
                                <span>{formatCurrency(paidAmount || amount)}</span>
                            </div>
                            {balance > 0 && (
                                <div className="detail-row balance">
                                    <span>Balance Due</span>
                                    <span>{formatCurrency(balance)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="receipt-footer">
                        <div className="signature-section">
                            <div className="sign-line">Authorized Signature</div>
                            <div className="sign-line">Parent/Guardian Signature</div>
                        </div>
                        <p className="thank-you">Thank you for choosing Suzana Education Center!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
