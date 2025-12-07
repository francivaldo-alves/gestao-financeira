import React from 'react';

const SkeletonCard = ({ height = '100px', className = '' }) => {
    return (
        <div className={`skeleton-card ${className}`} style={{ height }}>
            <div className="skeleton-shimmer"></div>
        </div>
    );
};

export const SkeletonSummaryCards = () => {
    return (
        <div className="row g-3 mb-4">
            <div className="col-md-4">
                <SkeletonCard height="120px" />
            </div>
            <div className="col-md-4">
                <SkeletonCard height="120px" />
            </div>
            <div className="col-md-4">
                <SkeletonCard height="120px" />
            </div>
        </div>
    );
};

export const SkeletonTransactionList = () => {
    return (
        <div className="skeleton-transaction-list">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-transaction-item mb-3">
                    <div className="d-flex align-items-center gap-3">
                        <SkeletonCard height="50px" className="flex-shrink-0" style={{ width: '50px', borderRadius: '50%' }} />
                        <div className="flex-grow-1">
                            <SkeletonCard height="20px" className="mb-2" style={{ width: '60%' }} />
                            <SkeletonCard height="15px" style={{ width: '40%' }} />
                        </div>
                        <SkeletonCard height="30px" style={{ width: '100px' }} />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SkeletonCard;
