import React from 'react';
import './scss/AdvertisingText.scss';

function AdvertisingText() {

    //const lang = navigator.language;
    const lang = "pt-BR";

    switch(lang) {
        case "pt-BR":
            return (
                <>
                    <h1 className='title'>O <b>sistema completo</b> para gerenciar estoque, produção e compras da sua <b>farmácia de maniupulação.</b></h1>
                </>
            );

        default:
            return (
                <>
                    <h1 className='title'><b>The complete system</b> for managing inventory, production and purchasing for your <b>compounding pharmacy.</b></h1>
                </>
            )
    }
}

export default AdvertisingText;