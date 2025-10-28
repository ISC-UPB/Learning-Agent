import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Clase } from "../interfaces/claseInterface";
import useClasses from "./useClasses";
import { useUserStore } from "../store/userStore";

export const useStudentClasses = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredClasses, setFilteredClasses] = useState<Clase[]>([]);
  const user = useUserStore((s) => s.user);
  const fetchUser = useUserStore((s) => s.fetchUser);
  const { classes, fetchClassesByStudent } = useClasses();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!user) return;
    fetchClassesByStudent(user.id);
  }, [user]);

  useEffect(() => {
    const lower = searchTerm.trim().toLowerCase();
    if (lower === "") {
      setFilteredClasses(classes);
      return;
    }

    const words = lower.split(" ");
    const specialChars = /[!@#$%^&*?:{}|<>]/;

    const filterWords = (c: Clase, words: string[]) => {
      let match = true;
      for (const word of words) {
        if (!match) return false;
        if (specialChars.test(word)) continue;
        match = match && c.name.toString().toLowerCase().includes(word);
      }
      return match;
    };

    const filtered = classes.filter((c) => filterWords(c, words));
    setFilteredClasses(filtered);
  }, [searchTerm, classes]);

  const goToReinforcement = (id: string) => {
    navigate(`/student/classes/${id}/reinforcement`);
  };

  return {
    searchTerm,
    setSearchTerm,
    filteredClasses,
    user,
    classes,
    goToReinforcement,
  };
};