"use client";
import SectionDashboard from "@/components/SectionDashboard";
import {
  Bot, LayoutGrid, Sparkles, Languages, FileSearch, Palette, ChefHat,
  Megaphone, Receipt, NotebookPen, FileCheck2, Mic, Code2, GitPullRequest,
  Mail, Hash, MoreHorizontal,
} from "lucide-react";

const ITEMS = [
  { label: "AI Tool Library", icon: LayoutGrid, href: "/ai-tools/library" },
  { label: "Syna AI Studio", icon: Sparkles, href: "/ai-tools/syna-studio" },
  { label: "Website Translator", icon: Languages, href: "/ai-tools/website-translator" },
  { label: "Contract Reader", icon: FileSearch, href: "/ai-tools/contract-reader" },
  { label: "Room Designer", icon: Palette, href: "/ai-tools/room-designer" },
  { label: "Recipe Generator", icon: ChefHat, href: "/ai-tools/recipe-generator" },
  { label: "Marketing Planner", icon: Megaphone, href: "/ai-tools/marketing-planner" },
  { label: "Invoice Generator", icon: Receipt, href: "/ai-tools/invoice-generator" },
  { label: "Meeting Notes", icon: NotebookPen, href: "/ai-tools/meeting-notes" },
  { label: "Resume Reviewer", icon: FileCheck2, href: "/ai-tools/resume-reviewer" },
  { label: "Interview Practice", icon: Mic, href: "/ai-tools/interview-practice" },
  { label: "Code Explainer", icon: Code2, href: "/ai-tools/code-explainer" },
  { label: "Code Reviewer", icon: GitPullRequest, href: "/ai-tools/code-reviewer" },
  { label: "Email Writer", icon: Mail, href: "/ai-tools/email-writer" },
  { label: "Social Media Caption Generator", icon: Hash, href: "/ai-tools/caption-generator" },
  { label: "More AI tools", icon: MoreHorizontal, href: "/ai-tools/library" },
];

export default function AiToolsPage() {
  return (
    <SectionDashboard
      title="AI Tools"
      icon={Bot}
      description="Every AI-powered tool in one place."
      items={ITEMS}
    />
  );
}