import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { useUserStore } from "../store/userStore";
import useCourses from "./useCourses";
import type { Course, CreateCourseDTO } from "../interfaces/courseInterface";

export const useCoursesPage = () => {
  const user = useUserStore((s) => s.user);
  const fetchUser = useUserStore((s) => s.fetchUser);
  const { courses, createCourse, fetchCoursesByTeacher } = useCourses();
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(courses);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) fetchUser();
    console.log("fetch users")
  }, []);

  const fetchCourses = useCallback(async () => {
    if (!user) return;

    const res = await fetchCoursesByTeacher(user.id);
    if (res.state === "error") {
      message.error(res.message);
      return;
    }
  }, [fetchCoursesByTeacher, user?.id]);

  useEffect(() => {
    if (user?.id) fetchCourses();
  }, [user?.id, fetchCourses]);

  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (lower === "") {
      setFilteredCourses(courses);
      return;
    }

    const words = lower.split(" ");
    const specialChars = /[!@#$%^&*?:{}|<>]/;

    const filterWords = (c: Course, words: string[]) => {
      let match = true;
      for (const word of words) {
        if (!match) return false;
        if (specialChars.test(word)) continue;
        match = match && c.name.toString().toLowerCase().includes(word);
      }
      return match;
    };

    const filtered = courses.filter((c) => filterWords(c, words));
    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  const goToCourse = (id: string) => {
    navigate(`${id}/periods`);
  };

  const goToExams = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`${id}/exams`);
  };

  const goToMaterials = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`${id}/documents`);
  };

  const handleAddCourse = async (values: CreateCourseDTO) => {
    if (!values) {
      message.error("No se pueden enviar datos vacíos");
      return;
    }
    const res = await createCourse(values.name);
    if (res.state === "error") {
      message.error(res.message);
      return;
    }
    message.success(res.message);
  };

  return {
    user,
    modalOpen,
    setModalOpen,
    searchTerm,
    setSearchTerm,
    filteredCourses,
    handleAddCourse,
    goToCourse,
    goToExams,
    goToMaterials,
  };
};
