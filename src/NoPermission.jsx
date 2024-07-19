import React from 'react';
import Steamed from './Steamed.jsx'

const NoPermission = () => {
    return (
        <>
            <Steamed />
            <h2>Access Denied</h2>
            <p>You do not have the necessary permission to view this content</p>

        </>
    );
}

export default NoPermission;