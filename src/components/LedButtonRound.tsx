import React from 'react'

export interface LEDButtonRound {
    on: boolean
    onClick: () => void
    onColor: string
    round?: boolean
    semiTransparent?: boolean
}


export const LEDButtonRound: React.FC<LEDButtonRound> = ({ on, onClick, onColor, round = true, semiTransparent = true }) => {
    return (
        <button style={{
            width: '4rem',
            height: '2rem',
            background: (on && semiTransparent) ? onColor : 'grey',
            borderRadius: round ? '50%' : '0.2rem',
            cursor: 'pointer',
            borderStyle: 'outset',
            borderWidth: '0.2rem',
            borderColor: (on && semiTransparent) ? onColor : 'grey',
            position: 'relative',
        }}
            onClick={onClick}
        >
            <div style={{
                background: 'grey',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                borderRadius: round ? '50%' : '0.2rem',
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
                top: '1rem',
                zIndex: 1,
            }} />

        </button>
    )
}