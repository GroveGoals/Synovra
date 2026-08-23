import SectionDashboard from "@/components/SectionDashboard";
import {
  GraduationCap, BookOpen, CalendarCheck, Layers, HelpCircle,
  NotebookPen, TrendingUp, Users, ClipboardList,
} from "lucide-react";

const ITEMS = [
  { label: "Homework Helper", icon: BookOpen, href: "/tools/school/homework-helper" },
  { label: "Study Planner", icon: CalendarCheck, href: "/tools/school/study-planner" },
  { label: "Flashcards", icon: Layers, href: "/tools/school/flashcards" },
  { label: "Quiz Generator", icon: HelpCircle, href: "/tools/school/quiz-generator" },
  { label: "Notes", icon: NotebookPen, href: "/tools/school/notes" },
  { label: "Study Progress", icon: TrendingUp, href: "/tools/school/study-progress" },
  { label: "Study Rooms", icon: Users, href: "/tools/school/study-rooms" },
  { label: "AI Tutor", icon: GraduationCap, href: "/tools/school/ai-tutor" },
  { label: "Assignments", icon: ClipboardList, href: "/tools/school/assignments" },
];

export default function SchoolPage() {
  return (
    <SectionDashboard
      title="School"
      icon={GraduationCap}
      description="Homework, studying, and everything class-related."
      items={ITEMS}
    />
  );
}