export default {
  title: "Classes",
  description: "Managing {{count}} active classes this term.",
  status: {
    active: "Active",
  },
  students: "{{count}} students",
  hours: "{{hours}} hours",
  enrolledStudents: "Enrolled Students",
  schedule: "{{days}}",
  addButton: "Add Class",
  empty: {
    description: "No classes yet. Create your first class to get started!",
    createButton: "Create Class",
  },
  error: {
    title: "Failed to load classes",
    retry: "Try Again",
  },
  form: {
    addTitle: "Add New Class",
    submit: "Create Class",
    cancel: "Cancel",
    name: {
      label: "Class Name",
      caption: "Required",
      placeholder: "e.g. Advanced Calculus",
    },
    totalHours: {
      label: "Total Hours",
      caption: "Required",
      placeholder: "e.g. 30",
    },
    students: {
      label: "Students",
      caption: "Optional",
      placeholder: "Select students",
      selectedCount: "{{count}} students selected",
    },
  },
  selector: {
    title: "Select Students",
    searchPlaceholder: "Search students...",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    selectedCount: "{{count}} selected",
    done: "Done ({{count}})",
    noResults: "No students found",
    noStudents: "No students available",
  },
  toast: {
    createSuccess: "Class created successfully",
    createError: "Failed to create class",
    updateSuccess: "Class updated successfully",
    updateError: "Failed to update class",
    deleteSuccess: "Class deleted successfully",
    deleteError: "Failed to delete class",
  },
} as const;
