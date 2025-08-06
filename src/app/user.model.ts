export interface User {
  id: number;
  employeeId: string;
  password?: string; // Make password optional for security
  designation: string;
  location: string;
}
