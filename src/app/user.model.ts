export interface User {
  id: number;
  name: string;
  employeeId: string;
  password?: string; // Make password optional for security
  designation: string;
  location: string;
  role?: 'admin' | 'user'; // Add role field
  permissions?: string[]; // Add permissions for admin users
}
