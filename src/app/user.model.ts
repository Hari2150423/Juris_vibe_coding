export interface User {
  id: number;
  name: string;
  employeeId: string;
  password?: string; // Make password optional for security
  designation: string;
  location: string;
}
