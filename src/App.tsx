import React, { useState } from 'react';
import EQTrainer from './pages/EQTrainer';
import Intro from './pages/Intro';
import { BORDER_RADIUS, COLORS, FONTSIZE, PADDING } from './StyleConstants';


const PAGES = [
  {
    key: 'intro',
    name: 'Intro',
    component: Intro
  },
  {
    key: 'eqtrainer',
    name: 'EQ Trainer',
    component: EQTrainer
  },
]

const GITHUB_LOGO = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTgiIGhlaWdodD0iOTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00OC44NTQgMEMyMS44MzkgMCAwIDIyIDAgNDkuMjE3YzAgMjEuNzU2IDEzLjk5MyA0MC4xNzIgMzMuNDA1IDQ2LjY5IDIuNDI3LjQ5IDMuMzE2LTEuMDU5IDMuMzE2LTIuMzYyIDAtMS4xNDEtLjA4LTUuMDUyLS4wOC05LjEyNy0xMy41OSAyLjkzNC0xNi40Mi01Ljg2Ny0xNi40Mi01Ljg2Ny0yLjE4NC01LjcwNC01LjQyLTcuMTctNS40Mi03LjE3LTQuNDQ4LTMuMDE1LjMyNC0zLjAxNS4zMjQtMy4wMTUgNC45MzQuMzI2IDcuNTIzIDUuMDUyIDcuNTIzIDUuMDUyIDQuMzY3IDcuNDk2IDExLjQwNCA1LjM3OCAxNC4yMzUgNC4wNzQuNDA0LTMuMTc4IDEuNjk5LTUuMzc4IDMuMDc0LTYuNi0xMC44MzktMS4xNDEtMjIuMjQzLTUuMzc4LTIyLjI0My0yNC4yODMgMC01LjM3OCAxLjk0LTkuNzc4IDUuMDE0LTEzLjItLjQ4NS0xLjIyMi0yLjE4NC02LjI3NS40ODYtMTMuMDM4IDAgMCA0LjEyNS0xLjMwNCAxMy40MjYgNS4wNTJhNDYuOTcgNDYuOTcgMCAwIDEgMTIuMjE0LTEuNjNjNC4xMjUgMCA4LjMzLjU3MSAxMi4yMTMgMS42MyA5LjMwMi02LjM1NiAxMy40MjctNS4wNTIgMTMuNDI3LTUuMDUyIDIuNjcgNi43NjMuOTcgMTEuODE2LjQ4NSAxMy4wMzggMy4xNTUgMy40MjIgNS4wMTUgNy44MjIgNS4wMTUgMTMuMiAwIDE4LjkwNS0xMS40MDQgMjMuMDYtMjIuMzI0IDI0LjI4MyAxLjc4IDEuNTQ4IDMuMzE2IDQuNDgxIDMuMzE2IDkuMTI2IDAgNi42LS4wOCAxMS44OTctLjA4IDEzLjUyNiAwIDEuMzA0Ljg5IDIuODUzIDMuMzE2IDIuMzY0IDE5LjQxMi02LjUyIDMzLjQwNS0yNC45MzUgMzMuNDA1LTQ2LjY5MUM5Ny43MDcgMjIgNzUuNzg4IDAgNDguODU0IDB6IiBmaWxsPSIjZmZmIi8+PC9zdmc+"



function App() {
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.slice(1);
    return PAGES.some(p => p.key === hash) ? hash : 'intro';
  });

  React.useEffect(() => {
    window.location.hash = page;
  }, [page]);


  const pageInfo = PAGES.find((pageInfo) => pageInfo.key === page);


  return (
    <div style={{ background: COLORS.background, color: COLORS.text, display: 'flex', flexDirection: 'column' }}>
      <div>
        <div style={{ display: 'flex', gap: PADDING.small, paddingLeft: PADDING.medium, paddingRight: PADDING.medium, paddingTop: PADDING.small, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: PADDING.small, alignSelf: "flex-end" }}>
            {PAGES.map((p) => (
              <button style={{
                color: p === pageInfo ? COLORS.background : COLORS.text,
                backgroundColor: p === pageInfo ? COLORS.primary : COLORS.interact_color,
                padding: PADDING.small, fontSize: FONTSIZE.medium, fontWeight: 'bold', borderTopRightRadius: BORDER_RADIUS, borderTopLeftRadius: BORDER_RADIUS, borderBottom: 'none'
              }} key={p.key} onClick={() => setPage(p.key)}>{p.name}</button>
            ))}
          </div>
          <div style={{ flexGrow: 1, textAlign: 'center' }}>
            <h1>{pageInfo?.name}</h1>
          </div>
          <div>
            <a href="https://github.com/sdfgeoff/MixingDeskTrainer">View on <img style={{ height: '1em' }} alt="" src={GITHUB_LOGO} /></a>
          </div>
        </div>
        <hr style={{ padding: 0, margin: 0, borderColor: COLORS.interact_color, borderWidth: '2px' }} />
      </div>
      <div>
        {pageInfo &&
          React.createElement(pageInfo.component)
        }
      </div>
    </div>
  );
}



export default App;