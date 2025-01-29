import React, { ReactNode } from "react";
import { BORDER_RADIUS, COLORS, FONTSIZE, PADDING } from "../StyleConstants";

export interface PanelProps {
  heading?: ReactNode;
  children: ReactNode;
  color?: string;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  heading,
  color = COLORS.background_colorful,
}) => {
  return (
    <div
      style={{
        borderRadius: BORDER_RADIUS,
        background: color,
        padding: "0.3rem",
        display: "flex",
        flexDirection: "column",
        gap: PADDING.small,
      }}
    >
      {heading && (
        <div style={{ textAlign: "center", fontWeight: "bold" }}>{heading}</div>
      )}
      <div
        style={{
          border: `0.1rem solid ${COLORS.primary}`,
          borderRadius: BORDER_RADIUS,
          background: COLORS.background,
          padding: PADDING.medium,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export interface MinimizablePanelProps extends PanelProps {
  startExpanded: boolean;
}

export const MinimizablePanel: React.FC<MinimizablePanelProps> = ({
  children,
  heading,
  color = COLORS.background_colorful,
  startExpanded,
}) => {
  const [expanded, setExpanded] = React.useState(startExpanded);
  return (
    <div
      style={{
        borderRadius: BORDER_RADIUS,
        background: color,
        padding: "0.3rem",
        display: "flex",
        flexDirection: "column",
        gap: PADDING.small,
      }}
    >
      <div
        onClick={() => setExpanded((prev) => !prev)}
        style={{ cursor: "pointer" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            paddingLeft: PADDING.small,
            paddingRight: PADDING.small,
          }}
        >
          <div style={{ textAlign: "center", fontWeight: "bold", flexGrow: 1 }}>
            {heading}
          </div>
          <div
            style={{ fontSize: FONTSIZE.small, textDecoration: "underline" }}
          >
            {expanded ? "minimize" : "expand"}
          </div>
        </div>
      </div>
      {
        <div
          style={{
            border: `0.1rem solid ${COLORS.primary}`,
            borderRadius: BORDER_RADIUS,
            background: COLORS.background,
            padding: PADDING.medium,
            display: expanded ? "block" : "none",
          }}
        >
          {children}
        </div>
      }
    </div>
  );
};
