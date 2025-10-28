import apiClient from "../api/apiClient";
import type { CreateAttendanceInterface } from "../interfaces/attendanceInterface";

export const attendanceService = {
    //Endpoints GET
    async getAbsencesByClass(classId: string, teacherId: string) {
        try {
            const response = await apiClient.get(
                `/academic/absences/classes/${classId}`, 
                {params: { teacherId }}
            );
            return response.data;
        } catch (error) {
            console.error("Failed to fetch student absences by class", error);
            throw error;
        }
    },

    async getStudentAbsencesInfo(classId: string, teacherId: string, studentId: string){
        try {
            const response = await apiClient.get(
                `/academic/students/${studentId}/absences/dates`,
                {params: {teacherId, classId}}
            );
            return response.data
        } catch (error) {
            console.error(`Failed to get absences info for student ${studentId}`, error);
            throw error;
        }
    },

    //Endpoints POST
    async saveAttendanceList(classId: string, attendanceData: Omit<CreateAttendanceInterface, "classId">) {
        try {
            const response = await apiClient.post(`/academic/attendance/${classId}`, attendanceData);
            return response.data;
        } catch (error) {
            console.error("Failed to enroll student in class", error);
            throw error;
        }
    },

}