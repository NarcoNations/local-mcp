import type { SVGProps } from "react";

export type IconName =
  | "dashboard"
  | "ingest"
  | "corpus"
  | "knowledge"
  | "search"
  | "historian"
  | "api"
  | "workroom"
  | "mvp"
  | "prompts"
  | "research"
  | "map"
  | "social"
  | "settings";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

const paths: Record<IconName, string> = {
  dashboard: "M3 4.5h7v6.5H3Zm11 0h7V11H14ZM3 14h7v7H3Zm11 0h7v7H14Z",
  ingest: "M5 4h14v2H5Zm0 12h6v5H5Zm8 0h6v5h-6Zm0-10h6v8h-6Zm-8 0h6v8H5Z",
  corpus: "M5 5.5a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 5.5V20l-6-3-6 3Z",
  knowledge: "M6 4h12v2H6Zm-2 4h16v2H4Zm2 4h12v2H6Zm-2 4h16v2H4Z",
  search: "M14.5 4a6.5 6.5 0 1 1-4.243 11.243l-4.62 4.62-1.414-1.414 4.62-4.62A6.5 6.5 0 0 1 14.5 4Z",
  historian: "M12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6V4Zm1 4h-2v5l4.5 2.5 1-1.732L13 12V8Z",
  api: "M5 12h4v2H7v2h2v2H5zm10 0h4v2h-2v2h2v2h-4zm-6-6h2v12h-2zm4 0h2v12h-2z",
  workroom: "M4 5h16v4H4Zm0 6h7v9H4Zm9 0h7v5h-7zm0 7h7v2h-7z",
  mvp: "M5 5h6l1 3 1-3h6l-3.5 14h-7z",
  prompts: "M6 4h12v2H6zm0 4h12v2H6zm0 4h7v2H6zm0 4h12v2H6z",
  research: "M6 4h12v2H6zm-1 4h14v2H5zm2 4h10v2H7zm2 4h6v2H9z",
  map: "M5 6.5 10 4l4 2.5 5-2.5v13L14 19l-4-2.5-5 2.5Z",
  social: "M7 8a4 4 0 1 1 4 4A4 4 0 0 1 7 8Zm11 7a5 5 0 0 0-10 0v3h10Zm-12 0a6.98 6.98 0 0 0-3 5v2h5v-5a7 7 0 0 1 2.257-5.19A5.5 5.5 0 0 0 6 15Z",
  settings: "M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm8.5 3-.707 1.224.707 1.224-1.414 2.45-1.414-.33-.964.964.33 1.414-2.45 1.414-1.224-.707L12 20.5l-1.224.707-2.45-1.414.33-1.414-.964-.964-1.414.33-1.414-2.45.707-1.224L3.5 11.5l1.224-2.45-.707-1.224 1.414-2.45 1.414.33.964-.964-.33-1.414L11.5 3.5l1.224.707L14 3.5l2.45 1.414-.33 1.414.964.964 1.414-.33 1.414 2.45Z",
};

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path fill="currentColor" d={paths[name]} />
    </svg>
  );
}
