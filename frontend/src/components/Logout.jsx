import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Logout() {
    const navigate = useNavigate();

    useEffect(() => {
        // Clear all auth-related items from localStorage
        localStorage.removeItem('userId');
        localStorage.removeItem('customerId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isAuthenticated');
        
        // Redirect to login page
        navigate('/login');
    }, [navigate]);

    // This component doesn't render anything as it immediately redirects
    return null;
}

export default Logout;