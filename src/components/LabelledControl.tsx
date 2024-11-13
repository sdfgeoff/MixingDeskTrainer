import React from 'react'
import { FONTSIZE } from '../StyleConstants'

export interface LabelledControlProps {
    label: string
    children: React.ReactNode
}

export const LabelledControl: React.FC<LabelledControlProps> = ({ label, children }) => {
    return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div>{children}</div>
            <div style={{fontWeight: 'normal', fontSize: FONTSIZE.small}}>{label}</div>
        </div>
    )
}