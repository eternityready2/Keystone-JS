// admin/config.tsx

import { jsx } from '@keystone-ui/core';

function CustomLogo () {
    return <h3 style={{
        color: 'white',
        backgroundColor: 'black',
        padding: '10px',
        borderRadius: '5px',
        display: 'inline-block'
    }}>ETERNITY<span style={{color: '#E53935'}}>READY</span></h3>
}

export const components = {
    Logo: CustomLogo
}