import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import PublicRoute from "./PublicRoute";
import PrivateRoute from "./PrivateRoute";
import RoleRoute from "./RoleRoute";
import AppLayout from "../layouts/AppLayout";
import StudentClasses from "../pages/student/classes/StudentClasses";
import Interview from "../pages/student/reinforcement/interview";
import { Reinforcement } from "../pages/student/reinforcement/reinforcement";
import Test from "../pages/student/reinforcement/test";
import PeriodDetailPage from "../pages/periods-classes/PeriodDetailPage";
import CoursePeriodsPage from "../pages/professor/academic_management/CoursePeriodsPage";
import DashboardPage from "../pages/common/DashboardPage";
import ExamsCreatePage from "../pages/professor/exams/ExamCreatePage";
import ExamManagementPage from "../pages/professor/exams/ExamManagementPage";
import ForgotPasswordPage from "../pages/common/ForgotPassword";
import LoginPage from "../pages/common/login/LoginPage";
import SettingsPage from "../pages/common/SettingsPage";
import CoursesPage from "../pages/courses/CoursesPage";
import UploadDocumentPage from "../pages/common/UploadDocumentPage";
import ProfessorHome from "../pages/professor/dashboard/ProfessorHome";

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />
          {/* <Route path="/register" element={<Register />} /> */}
        </Route>

        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Professor */}
            <Route path="/professor" element={<RoleRoute allowed={["docente"]} />}>
              <Route index element={<ProfessorHome />} />
              <Route path="dashboard" element={<ProfessorHome />} />
              <Route path="exams" element={<ExamManagementPage />} />
              <Route path="exams/create" element={<ExamsCreatePage />} />
              <Route path="academic_management" element={<Navigate to="../courses" replace />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="courses/:courseId/documents" element={<UploadDocumentPage />} />
              <Route path="courses/:courseId/exams" element={<ExamManagementPage />} />
              <Route path="courses/:courseId/periods" element={<CoursePeriodsPage />} />
              <Route path="courses/:courseId/periods/:id" element={<PeriodDetailPage />} />
              <Route path="courses/:courseId/periods/:id/documents" element={<UploadDocumentPage />} />
              <Route path="courses/:courseId/students/documents" element={<UploadDocumentPage />} />
            </Route>

            {/* Students */}
            <Route path="/student" element={<RoleRoute allowed={["estudiante"]} />}>
              <Route path="classes" element={<StudentClasses />} />
              <Route path="classes/:id/reinforcement" element={<Reinforcement />} />
              <Route path="classes/:id/reinforcement/test" element={<Test />} />
              <Route path="classes/:id/reinforcement/interview" element={<Interview />} />
              <Route path="classes/:id/reinforcement/documents" element={<UploadDocumentPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
