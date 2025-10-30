import type React from "react";
import {
  Activity,
  ServerCog,
  Archive,
  BookOpen,
  Bot,
  Brain,
  CircleDot,
  Compass,
  FilePlus2,
  Files,
  FolderGit2,
  Globe2,
  LayoutDashboard,
  Map,
  MessageSquareText,
  PanelRight,
  Search,
  Settings,
  Share2,
  Sparkles,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Cinematic view of every VibeOS system.",
  },
  {
    label: "Ingest",
    href: "/ingest",
    icon: FilePlus2,
    description: "Convert raw signals into structured context.",
  },
  {
    label: "Corpus",
    href: "/corpus",
    icon: Files,
    description: "Manage captured chats and knowledge bases.",
  },
  {
    label: "Knowledge",
    href: "/knowledge",
    icon: Brain,
    description: "Index, publish, and deploy briefed intel.",
  },
  {
    label: "Search",
    href: "/search",
    icon: Search,
    description: "Precision search across corpora and knowledge.",
  },
  {
    label: "Historian",
    href: "/timeline",
    icon: Activity,
    description: "Replay and filter system events in real time.",
  },
  {
    label: "API Manager",
    href: "/api-manager",
    icon: ServerCog,
    description: "Probe feeds and orchestrate service calls.",
  },
  {
    label: "Workroom",
    href: "/workroom",
    icon: PanelRight,
    description: "Plan initiatives with collaborative stickies.",
  },
  {
    label: "MVP",
    href: "/mvp",
    icon: Sparkles,
    description: "Generate briefs for the next minimum vibe product.",
  },
  {
    label: "Prompts",
    href: "/library/prompts",
    icon: MessageSquareText,
    description: "Run and lint reusable prompt stacks.",
  },
  {
    label: "Research",
    href: "/research",
    icon: BookOpen,
    description: "Curate insights, facts, and source leads.",
  },
  {
    label: "Map",
    href: "/play/map",
    icon: Map,
    description: "Spatial sandbox for network experiments.",
  },
  {
    label: "Social",
    href: "/play/social",
    icon: Share2,
    description: "Spin up social assets for the collective.",
  },
];

export const utilityNav: NavItem[] = [
  { label: "Historian", href: "/timeline", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings },
];

export interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  onSelect?: () => void;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  group?: string;
}

export const commandActions: CommandAction[] = [
  {
    id: "route-dashboard",
    label: "Open Dashboard",
    href: "/",
    icon: LayoutDashboard,
    group: "Navigation",
  },
  {
    id: "route-ingest",
    label: "Go to Ingest",
    href: "/ingest",
    icon: FilePlus2,
    group: "Navigation",
  },
  {
    id: "route-corpus",
    label: "Open Corpus",
    href: "/corpus",
    icon: Files,
    group: "Navigation",
  },
  {
    id: "route-knowledge",
    label: "Open Knowledge",
    href: "/knowledge",
    icon: Brain,
    group: "Navigation",
  },
  {
    id: "route-search",
    label: "Search",
    href: "/search",
    icon: Search,
    group: "Navigation",
  },
  {
    id: "route-workroom",
    label: "Open Workroom",
    href: "/workroom",
    icon: PanelRight,
    group: "Navigation",
  },
  {
    id: "route-mvp",
    label: "Launch MVP Brief",
    href: "/mvp",
    icon: Sparkles,
    group: "Navigation",
  },
  {
    id: "route-prompts",
    label: "Prompt Library",
    href: "/library/prompts",
    icon: MessageSquareText,
    group: "Navigation",
  },
  {
    id: "route-research",
    label: "Research Engine",
    href: "/research",
    icon: BookOpen,
    group: "Navigation",
  },
  {
    id: "route-api",
    label: "API Manager",
    href: "/api-manager",
    icon: ServerCog,
    group: "Navigation",
  },
  {
    id: "route-historian",
    label: "Historian Timeline",
    href: "/timeline",
    icon: Activity,
    group: "Navigation",
  },
  {
    id: "route-map",
    label: "Playground Map",
    href: "/play/map",
    icon: Globe2,
    group: "Playgrounds",
  },
  {
    id: "route-social",
    label: "Playground Social",
    href: "/play/social",
    icon: Share2,
    group: "Playgrounds",
  },
  {
    id: "action-upload",
    label: "Upload File",
    icon: FolderGit2,
    group: "Quick Actions",
  },
  {
    id: "action-chat-export",
    label: "Paste Chat Export URL",
    icon: Archive,
    group: "Quick Actions",
  },
  {
    id: "action-index-knowledge",
    label: "Index Knowledge",
    icon: CircleDot,
    group: "Quick Actions",
  },
  {
    id: "action-new-brief",
    label: "New MVP Brief",
    icon: Sparkles,
    group: "Quick Actions",
  },
  {
    id: "action-focus-search",
    label: "Focus Global Search",
    icon: Search,
    group: "System",
  },
  {
    id: "action-toggle-theme",
    label: "Toggle Theme",
    icon: Bot,
    group: "System",
  },
  {
    id: "action-open-api-probe",
    label: "Open API Probe",
    icon: Compass,
    group: "System",
  },
  {
    id: "action-open-feed",
    label: "Open Feed Monitor",
    icon: Share2,
    group: "System",
  },
];
