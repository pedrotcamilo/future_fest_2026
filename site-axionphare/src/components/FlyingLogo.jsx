import React from 'react';
import axionphareWhite from '../assets/axionphare-white.png';
import './scss/FlyingLogo.scss';

function FlyingLogo({ hidden }) {
    return (
        <>
            <img src={axionphareWhite} className={`logo ${hidden ? 'logo--hidden' : ''}`} />
        </>
    )
}

export default FlyingLogo;