import React, { ReactNode } from 'react'
import { BORDER_RADIUS, COLORS, PADDING } from '../StyleConstants'

export interface PanelProps {
    heading?: ReactNode
    children: ReactNode
}

export const Panel: React.FC<PanelProps> = ({ children, heading }) => {
    return (
        <div style={{ borderRadius: BORDER_RADIUS, background: COLORS.background_colorful, padding: PADDING.small, display: 'flex', flexDirection: 'column', gap: PADDING.small }}>
            {heading && <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{heading}</div>}
            <div style={{ border: `0.2rem solid ${COLORS.primary}`, borderRadius: BORDER_RADIUS, background: COLORS.background, padding: PADDING.medium }}>
                {children}
            </div>
        </div>
    )
}