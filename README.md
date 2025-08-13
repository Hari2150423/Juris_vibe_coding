# Workday Wizard - Roaster Booking Application

A comprehensive Angular-based application for managing employee roaster bookings with admin approval workflow.

## 🚀 Features

### User Features
- **Roaster Date Selection**: Interactive calendar for selecting work dates
- **Draft Management**: Save selections as drafts before submission
- **File Attachments**: Upload image attachments along with date selections
- **Submission Tracking**: Track status of submitted requests (Pending, Approved, Rejected)
- **Professional UI/UX**: Clean interface with modal views and status indicators

### Admin Features (Workday Wizard Dashboard)
- **User Management**: Edit and delete user accounts
- **Approval Workflow**: Approve or reject user submissions with comments
- **Dashboard Analytics**: View statistics and user activity
- **Submission Review**: Review all pending, approved, and rejected submissions
- **File Management**: View attached files from user submissions

### Security Features
- **Role-Based Access**: Separate user and admin interfaces
- **System Administrator Only**: Admin access restricted to System Administrator designation
- **Secure Authentication**: Password-based login system
- **Data Validation**: Input validation and error handling

## 🛠 Technology Stack

- **Frontend**: Angular 17+ (Standalone Components)
- **Backend**: Node.js with Express
- **Database**: JSON file-based storage
- **File Upload**: Multer for image attachments
- **Styling**: Bootstrap + Custom CSS
- **Notifications**: ngx-toastr
- **Icons**: Font Awesome

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- Angular CLI (v17+)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd Roaster_Booking_app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create uploads directory**
   ```bash
   mkdir uploads
   ```

4. **Start the backend server**
   ```bash
   node server.js
   ```
   Server will run on `http://localhost:3001`

5. **Start the Angular development server**
   ```bash
   npm start
   ```
   Application will be available at `http://localhost:4200`

## 🔐 Default Login Credentials

### System Administrator
- **Employee ID**: `jey123`
- **Password**: `jeyisthebest`
- **Designation**: `System Administrator`

### Regular Users
Check `src/assets/db.json` for available user accounts.

## 📱 Usage

### For Users
1. Login with your credentials
2. Select dates on the calendar or upload an image attachment
3. Save as draft or submit for admin approval
4. Track your submission status
5. View approved/rejected submissions with admin comments

### For Administrators
1. Login with System Administrator credentials
2. Access the Workday Wizard dashboard
3. Review pending submissions
4. Approve/reject with comments
5. Manage user accounts (edit/delete)
6. View dashboard analytics

## 🏗 Project Structure

```
Roaster_Booking_app/
├── src/
│   ├── app/
│   │   ├── admin-dashboard/       # Admin interface
│   │   ├── user-dashboard/        # User interface
│   │   │   ├── home-page/         # Main user page
│   │   │   └── calender-ui/       # Calendar component
│   │   ├── login/                 # Authentication
│   │   ├── header/                # App header
│   │   ├── services/              # Data services
│   │   └── models/                # TypeScript models
│   └── assets/
│       └── db.json               # Database file
├── uploads/                      # File uploads
├── server.js                     # Backend server
└── package.json                  # Dependencies
```

## 🌐 API Endpoints

### User Management
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user

### Roaster Management
- `POST /api/save-draft` - Save draft selection
- `POST /api/submit-for-review` - Submit for approval
- `GET /api/get-draft/:employeeId` - Get user draft
- `GET /api/get-submitted/:employeeId` - Get submitted selection
- `GET /api/submitted-selections` - Get all submissions

### File Handling
- `GET /uploads/:filename` - Access uploaded files

## Development Server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## 🚀 Deployment to GitHub

### Step 1: Initialize Git Repository (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### Step 2: Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click "New Repository"
3. Name it "Roaster_Booking_app" or your preferred name
4. Don't initialize with README (since you already have one)
5. Create repository

### Step 3: Connect and Push to GitHub
```bash
git remote add origin https://github.com/yourusername/Roaster_Booking_app.git
git branch -M main
git push -u origin main
```

### Step 4: GitHub Pages Deployment (Optional)
To host on GitHub Pages:
1. Build for production: `ng build --configuration production`
2. Install angular-cli-ghpages: `npm install -g angular-cli-ghpages`
3. Deploy: `npx angular-cli-ghpages --dir=dist/roaster-booking-app`

## 🔧 Configuration

### Environment Variables
Create a `.env` file for production:
```
NODE_ENV=production
PORT=3001
DB_PATH=./src/assets/db.json
UPLOADS_PATH=./uploads
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🐛 Known Issues

- File uploads are stored locally (consider cloud storage for production)
- Database is JSON-based (consider proper database for production)
- No email notifications (can be added for admin approval workflow)

## 🔮 Future Enhancements

- [ ] Email notifications for approvals/rejections
- [ ] Advanced calendar features (recurring dates, time slots)
- [ ] Export functionality (PDF reports, Excel)
- [ ] Advanced user roles and permissions
- [ ] Real-time notifications
- [ ] Mobile app development
- [ ] Integration with external calendar systems

---

**Workday Wizard** - Making roaster management magical! ✨

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
