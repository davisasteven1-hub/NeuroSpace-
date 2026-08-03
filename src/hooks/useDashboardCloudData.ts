import { useEffect, useState } from 'react';
import { TABLES } from '../constants/database';
import { loadSnapshotOrCreate } from '../services/cloudDataService';
import { fetchDashboardFiles, fetchDashboardNotes } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import type { Semester } from '../types/gpa';
import type { Note, UploadedFile } from '../types/notes';

interface DashboardCloudData {
  semesters: Semester[];
  notes: Note[];
  files: UploadedFile[];
  loading: boolean;
}

export function useDashboardCloudData(): DashboardCloudData {
  const [data, setData] = useState<DashboardCloudData>({ semesters: [], notes: [], files: [], loading: true });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setData({ semesters: [], notes: [], files: [], loading: false }); return; }
    void Promise.all([
      loadSnapshotOrCreate(TABLES.USER_GPA, 'data', user.id, { semesters: [], predictedCourses: [], creditsRequired: 120 }),
      fetchDashboardNotes(user.id),
      fetchDashboardFiles(user.id),
    ])
      .then(([gpaData, notes, files]) => setData({ semesters: gpaData?.semesters ?? [], notes, files, loading: false }))
      .catch((error: unknown) => {
        console.error(error);
        setData((current) => ({ ...current, loading: false }));
      });
  }, [user]);

  return data;
}
