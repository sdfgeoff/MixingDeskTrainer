import React from 'react'
import { FONTSIZE } from '../StyleConstants'

export interface LabelledControlProps {
    label: React.ReactNode
    children: React.ReactNode
    position?: 'bottom' | 'top' 
}

export const LabelledControl: React.FC<LabelledControlProps> = ({ label, children, position='bottom' }) => {
    return (
        <div style={{display: 'flex', flexDirection: position === 'bottom' ? 'column' : 'column-reverse', alignItems: 'center'}}>
            <div>{children}</div>
            <div style={{fontWeight: 'normal', fontSize: FONTSIZE.small}}>{label}</div>
        </div>
    )
}