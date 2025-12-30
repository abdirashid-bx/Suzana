import React from 'react';
import { FiSearch } from 'react-icons/fi';
import './DataTable.css';

const DataTable = ({ columns, data, isLoading, emptyMessage = 'No data found' }) => {
    if (isLoading) {
        return (
            <div className="table-loading">
                <div className="spinner"></div>
                <p>Loading data...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="empty-state">
                <FiSearch className="empty-icon" />
                <h3>No records found</h3>
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={col.key || index}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={row._id || rowIndex}>
                            {columns.map((col, colIndex) => (
                                <td key={`${rowIndex}-${colIndex}`}>
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
