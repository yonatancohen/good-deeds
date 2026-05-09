export type UserRole = 'admin' | 'teacher';

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  display_name: string;
  created_at: string;
}

export interface Settings {
  id: string;
  school_name: string;
  current_year: string | null;
  global_goal: number;
}

export interface Class {
  id: string;
  name: string;
  grade: string | null;
  year: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  class_id: string;
  created_at: string;
  // computed
  full_name?: string;
  current_credits?: number;
}

export interface Deed {
  id: string;
  name: string;
  amount: number;
  is_active: boolean;
  created_at: string;
}

export interface CreditEvent {
  id: string;
  student_id: string;
  deed_id: string;
  amount: number;
  note: string | null;
  given_by: string;
  created_at: string;
  // joined
  deed?: Deed;
  given_by_user?: AppUser;
  student?: Student;
}

export interface Gift {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
}

export interface RedemptionRound {
  id: string;
  class_id: string;
  gift_id: string | null;
  note: string | null;
  redeemed_at: string;
  marked_by: string;
  // joined
  class?: Class;
  gift?: Gift;
  marked_by_user?: AppUser;
}

export interface UserClassAccess {
  user_id: string;
  class_id: string;
}

// Derived type for the public page
export interface ClassWithProgress {
  class: Class;
  total: number;
  goal: number;
  students: StudentWithCredits[];
}

export interface StudentWithCredits {
  student: Student;
  credits: number;
}
