import React from 'react';
import { Link } from 'react-router-dom';

function NotFound() {
    return (
        <div>
            <h1 className="color-main">404 - Not Found!</h1>
            <Link to="/" className="color-main">Go Home</Link>
        </div>
    );
}

export default NotFound;