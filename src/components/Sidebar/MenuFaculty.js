"use client";

export default function MenuFaculty({ handleNavigation }) {
  const faculties = [
    "Economics and Business",
    "Medicine",
    "Engineering",
    "Social and Political Science",
    "Computer Science",
    "Law",
    "Health Science",
    "University Courses",
    "All Course",
  ];

  return (
    <ul className="w-80 mt-2 overflow-y-auto">
      {faculties.map((faculty, index) => (
        <li key={index}>
          <button
            onClick={() => handleNavigation(`/galat/${faculty.toLowerCase().replace(/\s+/g, "-")}`)}
            className="w-full py-3 px-6 text-left text-sm border-b border-gray-700 hover:bg-gray-800 uppercase"
          >
            {faculty}
          </button>
        </li>
      ))}
    </ul>
  );
}
