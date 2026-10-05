import React from "react";

export const CheckboxIcon = () => (
  <span
    style={{
      width: 18,
      height: 18,
      borderRadius: 4,
      border: "1.5px solid",
      borderColor: "currentColor",
      backgroundColor: "transparent",
      display: "block",
    }}
  />
);

export const CheckboxCheckedIcon = () => (
  <span
    style={{
      width: 18,
      height: 18,
      borderRadius: 4,
      border: "1.5px solid",
      borderColor: "currentColor",
      backgroundColor: "currentColor",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg
      width={10}
      height={8}
      viewBox="0 0 10 8"
      fill="none"
    >
      <path
        d="M1.5 4.5L4 7L8.5 2"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </span>
);

/** Parent-of-partially-selected-children state — same filled shell as the
 * checked icon, dash instead of a check (module/permission trees, matrix review). */
export const CheckboxIndeterminateIcon = () => (
  <span
    style={{
      width: 18,
      height: 18,
      borderRadius: 4,
      border: "1.5px solid",
      borderColor: "currentColor",
      backgroundColor: "currentColor",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <svg width={10} height={8} viewBox="0 0 10 8" fill="none">
      <path d="M1 4H9" stroke="white" strokeWidth={2} strokeLinecap="round" />
    </svg>
  </span>
);
