import SectionDashboard from "@/components/SectionDashboard";
import { Wrench, Sparkles, Calculator, RefreshCw, CalendarCheck } from "lucide-react";

const ITEMS = [
  { label: "Useful AI Tools", icon: Sparkles, href: "/tools/home/ai-tools" },
  { label: "Calculators", icon: Calculator, href: "/tools/home/calculators" },
  { label: "Converters", icon: RefreshCw, href: "/tools/home/converters" },
  { label: "Planners", icon: CalendarCheck, href: "/tools/home/planners" },
  { label: "Other Utilities", icon: Wrench, href: "/tools/home/utilities" },
];

export default function HomeToolsPage() {
  return (
    <SectionDashboard
      title="Home Tools"
      icon={Wrench}
      description="Everyday utilities for daily life."
      items={ITEMS}
    />
  );
}