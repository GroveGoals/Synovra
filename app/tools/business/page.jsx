"use client";
import SectionDashboard from "@/components/SectionDashboard";
import {
  Briefcase, LayoutDashboard, CalendarRange, Megaphone, Receipt,
  FileText, FolderKanban, NotebookPen, Users,
} from "lucide-react";

const ITEMS = [
  { label: "Business Dashboard", icon: LayoutDashboard, href: "/tools/business/dashboard" },
  { label: "Business Planner", icon: CalendarRange, href: "/tools/business/planner" },
  { label: "Marketing Tools", icon: Megaphone, href: "/tools/business/marketing" },
  { label: "Invoice Tools", icon: Receipt, href: "/tools/business/invoices" },
  { label: "Business Documents", icon: FileText, href: "/tools/business/documents" },
  { label: "Projects", icon: FolderKanban, href: "/tools/business/projects" },
  { label: "Client Notes", icon: NotebookPen, href: "/tools/business/client-notes" },
  { label: "Team Collaboration", icon: Users, href: "/tools/business/team" },
];

export default function BusinessPage() {
  return (
    <SectionDashboard
      title="Business"
      icon={Briefcase}
      description="Run and grow your business in one place."
      items={ITEMS}
    />
  );
}
import SectionDashboard from "@/components/SectionDashboard";
import {
  Briefcase, LayoutDashboard, CalendarRange, Megaphone, Receipt,
  FileText, FolderKanban, NotebookPen, Users,
} from "lucide-react";

const ITEMS = [
  { label: "Business Dashboard", icon: LayoutDashboard, href: "/tools/business/dashboard" },
  { label: "Business Planner", icon: CalendarRange, href: "/tools/business/planner" },
  { label: "Marketing Tools", icon: Megaphone, href: "/tools/business/marketing" },
  { label: "Invoice Tools", icon: Receipt, href: "/tools/business/invoices" },
  { label: "Business Documents", icon: FileText, href: "/tools/business/documents" },
  { label: "Projects", icon: FolderKanban, href: "/tools/business/projects" },
  { label: "Client Notes", icon: NotebookPen, href: "/tools/business/client-notes" },
  { label: "Team Collaboration", icon: Users, href: "/tools/business/team" },
];

export default function BusinessPage() {
  return (
    <SectionDashboard
      title="Business"
      icon={Briefcase}
      description="Run and grow your business in one place."
      items={ITEMS}
    />
  );
}