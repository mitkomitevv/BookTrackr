import { useContext } from 'react';
import { Navigate } from 'react-router';
import UserContext from '../../contexts/UserContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { isAuthenticated, isAdmin } = useContext(UserContext);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
