import { useState } from "react";
import { Search, TrendingUp, Calendar, MoreVertical, Plus } from "lucide-react";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { AddStudentDrawer } from "@/components/add-student-drawer";
import type { Student } from "@/types/student";

const mockStudents: Student[] = [
  {
    id: "1",
    name: "Julian Thorne",
    course: "Advanced Calculus",
    status: "active",
    performanceScore: 94,
    lastActive: "2h ago",
  },
  {
    id: "2",
    name: "Elena Rossi",
    course: "Modern Literature",
    status: "warning",
    performanceScore: 88,
    lastActive: "Yesterday",
  },
  {
    id: "3",
    name: "Marcus Kane",
    course: "Quantum Physics",
    status: "active",
    performanceScore: 91,
    lastActive: "4h ago",
    initials: "MK",
  },
  {
    id: "4",
    name: "David Chen",
    course: "Economics 101",
    status: "inactive",
    performanceScore: 76,
    lastActive: "3 days ago",
  },
];

const filters = [
  "All Students",
  "Mathematics",
  "Literature",
  "Physics",
  "Economics",
];

function EditorialHeader() {
  return (
    <section className="mb-8">
      <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-tight">
        Student
        <br />
        <span className="text-primary">Directory</span>
      </h2>
      <p className="font-body text-on-surface-variant mt-2 text-lg">
        Managing {mockStudents.length} active scholars this term.
      </p>
    </section>
  );
}

function SearchInput() {
  return (
    <div className="relative mb-10">
      <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
      <input
        type="text"
        placeholder="Search by name or course..."
        className="w-full pl-8 pr-4 py-3 bg-surface-container-low border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all font-body text-on-surface placeholder-outline text-lg outline-none"
      />
    </div>
  );
}

function FilterChips() {
  const [activeFilter, setActiveFilter] = useState("All Students");

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-6">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => setActiveFilter(filter)}
          className={cn(
            "px-6 py-2 rounded-full font-label text-sm font-semibold whitespace-nowrap transition-colors",
            activeFilter === filter
              ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
              : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function StudentCard({ student }: { student: Student }) {
  const getStatusColor = (status: Student["status"]) => {
    switch (status) {
      case "active":
        return "bg-emerald-500";
      case "warning":
        return "bg-amber-500";
      case "inactive":
        return "bg-outline-variant";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div
      className={cn(
        "bg-surface-container-lowest p-6 rounded-xl ambient-shadow flex gap-5 items-start",
        student.status === "inactive" && "opacity-70"
      )}
    >
      <div className="relative">
        {student.image ? (
          <img
            src={student.image}
            alt={student.name}
            className="w-20 h-20 rounded-lg object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-headline font-bold text-2xl">
            {student.initials || getInitials(student.name)}
          </div>
        )}
        <div
          className={cn(
            "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface-container-lowest",
            getStatusColor(student.status)
          )}
        />
      </div>
      <div className="flex-1">
        <h3 className="font-headline font-bold text-xl text-on-surface leading-none">
          {student.name}
        </h3>
        <p className="font-body text-primary text-sm font-semibold mt-1">
          {student.course}
        </p>
        <div className="flex items-center gap-4 mt-4 text-xs font-label text-outline uppercase tracking-widest">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {student.performanceScore}%
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {student.lastActive}
          </span>
        </div>
      </div>
      <button className="text-outline hover:text-primary transition-colors">
        <MoreVertical className="w-5 h-5" />
      </button>
    </div>
  );
}

function AddStudentFAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-28 right-6 w-14 h-14 btn-gradient text-on-primary rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform z-40"
    >
      <Plus className="size-6" />
    </button>
  );
}

export function StudentScreen() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div>
      <EditorialHeader />
      <SearchInput />
      <FilterChips />
      <div className="space-y-6">
        {mockStudents.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
      <AddStudentFAB onClick={() => setIsDrawerOpen(true)} />
      <AddStudentDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#fdf7fe",
            color: "#34313a",
            border: "1px solid #e7e0ec",
          },
        }}
      />
    </div>
  );
}
