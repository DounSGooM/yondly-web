import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
    const adminKey = localStorage.getItem('YONDLY_ADMIN_KEY');

    if (!adminKey) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default PrivateRoute;
