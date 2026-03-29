import { AddStudentDrawer } from "@/components/students/add-student-drawer";
import { Button } from "@/components/ui/button";
import { useStudents } from "@/hooks/queries/use-students";
import { showToast } from "@/components/ui/toast";
import type { Student } from "@/types/student";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

function EditorialHeader({ count }: { count: number }) {
  return (
    <section className="mb-8">
      <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-tight">
        Student
        <br />
        <span className="text-primary">Directory</span>
      </h2>
      <p className="font-body text-on-surface-variant mt-2 text-lg">
        Managing {count} active scholars this term.
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
        placeholder="Search by name..."
        className="w-full pl-8 pr-4 py-3 bg-surface-container-low border-b-2 border-transparent focus:border-primary focus:ring-0 transition-all font-body text-on-surface placeholder-outline text-lg outline-none"
      />
    </div>
  );
}

function StudentCard({ student }: { student: Student }) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl ambient-shadow flex gap-5 items-center">
      <div className="w-20 h-20 rounded-lg bg-surface-container-high flex items-center justify-center text-primary font-headline font-bold text-2xl">
        {getInitials(student.name)}
      </div>
      <div className="flex-1">
        <h3 className="font-headline font-bold text-xl text-on-surface leading-none">
          {student.name}
        </h3>
        <p className="font-body text-primary text-sm font-semibold mt-1">
          Grade {student.grade}
        </p>
      </div>
    </div>
  );
}

function AddStudentFAB({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="gradient"
      size="icon"
      onClick={onClick}
      leftIcon={Plus}
      className="fixed bottom-28 right-6 z-40"
    />
  );
}

export function StudentScreen() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { data: students, isLoading } = useStudents();

  return (
    <div>
      <EditorialHeader count={students?.length ?? 0} />
      <SearchInput />
      {isLoading ? (
        <div className="text-center py-8 text-on-surface-variant">
          Loading students...
        </div>
      ) : (
        <div className="space-y-6">
          {students?.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
      <AddStudentFAB onClick={() => setIsDrawerOpen(true)} />
      <AddStudentDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
    </div>
  );
}
