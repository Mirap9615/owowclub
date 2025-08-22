import React from 'react';
import Steamed from './Steamed.jsx'

const NoPermission = () => {
    return (
        <>
            <header className="top-bar-home">
                <Steamed />
                <h1>OWL<sup>2</sup> Club</h1>
            </header>
            <h2>Access Denied</h2>
            <p>You do not have the necessary permission to view this content</p>

        </>
    );
}

export default NoPermission;