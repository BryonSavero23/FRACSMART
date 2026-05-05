import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Student, Teacher } from '../lib/supabase';

interface AuthContextType {
  student: Student | null;
  teacher: Teacher | null;
  isLoading: boolean;
  loginStudent: (name: string, classCode: string) => Promise<{ success: boolean; isNewStudent?: boolean; error?: string }>;
  loginTeacher: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateStudentScore: (points: number) => Promise<void>;
  incrementSessions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [student, setStudent] = useState<Student | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedStudentId = localStorage.getItem('fracsmart_student_id');
    const savedTeacherId = localStorage.getItem('fracsmart_teacher_id');

    if (savedStudentId) {
      fetchStudent(savedStudentId);
    } else if (savedTeacherId) {
      fetchTeacher(savedTeacherId);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchStudent = async (id: string) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setStudent(data);
    }
    setIsLoading(false);
  };

  const fetchTeacher = async (id: string) => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (data) {
      setTeacher(data);
    }
    setIsLoading(false);
  };

  const loginStudent = async (name: string, classCode: string): Promise<{ success: boolean; isNewStudent?: boolean; error?: string }> => {
    const { data: classCodeData, error: classCodeError } = await supabase
      .from('class_codes')
      .select('code')
      .eq('code', classCode.toUpperCase())
      .maybeSingle();

    if (!classCodeData) {
      return { success: false, error: 'Invalid class code. Please check with your teacher.' };
    }

    const { data: existingStudent, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('name', name.trim())
      .eq('class_code', classCode.toUpperCase())
      .maybeSingle();

    if (existingStudent) {
      setStudent(existingStudent);
      localStorage.setItem('fracsmart_student_id', existingStudent.id);
      return { success: true, isNewStudent: false };
    }

    const { data: newStudent, error: insertError } = await supabase
      .from('students')
      .insert({
        name: name.trim(),
        class_code: classCode.toUpperCase(),
      })
      .select()
      .single();

    if (insertError || !newStudent) {
      return { success: false, error: 'Could not create your account. Please try again.' };
    }

    setStudent(newStudent);
    localStorage.setItem('fracsmart_student_id', newStudent.id);
    return { success: true, isNewStudent: true };
  };

  const loginTeacher = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('username', username.toLowerCase())
      .eq('password_hash', password)
      .maybeSingle();

    if (!data) {
      return { success: false, error: 'Invalid username or password.' };
    }

    setTeacher(data);
    localStorage.setItem('fracsmart_teacher_id', data.id);
    return { success: true };
  };

  const logout = () => {
    setStudent(null);
    setTeacher(null);
    localStorage.removeItem('fracsmart_student_id');
    localStorage.removeItem('fracsmart_teacher_id');
  };

  const updateStudentScore = async (points: number) => {
    if (!student) return;

    const newScore = student.total_score + points;
    const { error } = await supabase
      .from('students')
      .update({ total_score: newScore })
      .eq('id', student.id);

    if (!error) {
      setStudent(prev => prev ? { ...prev, total_score: newScore } : prev);
    }
  };

  const incrementSessions = async () => {
    if (!student) return;

    const newCount = student.sessions_completed + 1;
    const { error } = await supabase
      .from('students')
      .update({ sessions_completed: newCount })
      .eq('id', student.id);

    if (!error) {
      setStudent(prev => prev ? { ...prev, sessions_completed: newCount } : prev);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        teacher,
        isLoading,
        loginStudent,
        loginTeacher,
        logout,
        updateStudentScore,
        incrementSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
