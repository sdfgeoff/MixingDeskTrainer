import React from 'react'

export interface LEDButtonRound {
    on: boolean
    onClick: () => void
    onColor: string
    shape?: 'oval' | 'round' | 'rectangle'
    semiTransparent?: boolean
    offColor?: string
}


export const LEDButtonRound: React.FC<LEDButtonRound> = ({ on, onClick, onColor, shape ='oval', semiTransparent = true, offColor = 'grey' }) => {
    const borderRadius = shape === 'oval' || shape === 'round' ? '50%' : '0.2rem'
    return (
        <button style={{
            width: shape=='round' ? '3rem' : '4rem',
            height: shape == 'round' ? '3rem' : '2rem',
            background: (on && semiTransparent) ? onColor : offColor,
            borderRadius: borderRadius,
            cursor: 'pointer',
            borderStyle: 'outset',
            borderWidth: '0.2rem',
            borderColor: (on && semiTransparent) ? onColor : offColor,
            position: 'relative',
        }}
            onClick={onClick}
        >
            <div style={{
                background: on && semiTransparent ? "white" : offColor,
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                borderRadius: borderRadius,
                opacity: 0.5,
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                background: on ? onColor : 'black',
                left: 'calc(50% - 0.25rem)',
                top: '0.25rem',
                zIndex: 1,
            }} />

        </button>
    )
}