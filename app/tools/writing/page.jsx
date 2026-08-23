"use client";
import SectionDashboard from "@/components/SectionDashboard";
import {
  PenLine, Mail, FileText, Sparkles, SpellCheck, AlignLeft, Wand2,
} from "lucide-react";

const ITEMS = [
  { label: "Article Writer", icon: PenLine, href: "/tools/writing/article-writer" },
  { label: "Email Writer", icon: Mail, href: "/tools/writing/email-writer" },
  { label: "Essay Helper", icon: FileText, href: "/tools/writing/essay-helper" },
  { label: "Writing Assistant", icon: Sparkles, href: "/tools/writing/assistant" },
  { label: "Grammar Tools", icon: SpellCheck, href: "/tools/writing/grammar" },
  { label: "Summarizer", icon: AlignLeft, href: "/tools/writing/summarizer" },
  { label: "Content Generator", icon: Wand2, href: "/tools/writing/content-generator" },
];

export default function WritingPage() {
  return (
    <SectionDashboard
      title="Writing"
      icon={PenLine}
      description="Draft, polish, and generate writing of any kind."
      items={ITEMS}
    />
  );
}
