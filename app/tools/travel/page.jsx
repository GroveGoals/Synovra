"use client";
import SectionDashboard from "@/components/SectionDashboard";
import { Plane, Map, CalendarDays, Compass, Luggage } from "lucide-react";

const ITEMS = [
  { label: "Trip Planner", icon: Map, href: "/tools/travel/trip-planner" },
  { label: "Itinerary Builder", icon: CalendarDays, href: "/tools/travel/itinerary-builder" },
  { label: "Destination Research", icon: Compass, href: "/tools/travel/destination-research" },
  { label: "Packing Planner", icon: Luggage, href: "/tools/travel/packing-planner" },
  { label: "Travel Assistant", icon: Plane, href: "/tools/travel/assistant" },
];

export default function TravelPage() {
  return (
    <SectionDashboard
      title="Travel"
      icon={Plane}
      description="Plan trips from idea to itinerary."
      items={ITEMS}
    />
  );
}
