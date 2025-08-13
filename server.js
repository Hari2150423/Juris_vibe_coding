const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'src', 'assets', 'db.json');
const UPLOADS_PATH = path.join(__dirname, 'uploads');

// Multer config for image uploads only
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_PATH);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(new Error('Only image files (PNG, JPEG, JPG) are allowed!'), false);
  }
};
const upload = multer({ storage: storage, fileFilter: imageFileFilter });

// Middleware
app.use(cors({
  origin: true, // Allow all origins during development
  credentials: true
}));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_PATH));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Read database
async function readDatabase() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return null;
  }
}

// Write to database
async function writeDatabase(data) {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    console.log('Database updated successfully');
    return true;
  } catch (error) {
    console.error('Error writing to database:', error);
    return false;
  }
}

// Save selected dates as draft (with optional image attachment)
app.post('/api/save-draft', upload.single('attachment'), async (req, res) => {
  try {
    const { userId, employeeId, selectedDates, userDesignation, userLocation } = req.body;
    let parsedDates = selectedDates;
    if (typeof selectedDates === 'string') {
      try { parsedDates = JSON.parse(selectedDates); } catch { parsedDates = []; }
    }
    if (!parsedDates || !Array.isArray(parsedDates)) {
      parsedDates = []; // Default to empty array if not provided
    }
    
    // Check if we have either dates or an attachment
    if (parsedDates.length === 0 && !req.file) {
      return res.status(400).json({ error: 'Either selected dates or an attachment is required' });
    }
    const db = await readDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }
    if (!db.draftSelections) {
      db.draftSelections = [];
    }
    
    // Remove ALL existing drafts for this user to prevent duplicates
    db.draftSelections = db.draftSelections.filter(record => record.employeeId !== employeeId);
    
    const dateRecord = {
      id: Date.now(), // Always generate new ID
      userId: userId,
      employeeId: employeeId,
      userDesignation: userDesignation,
      userLocation: userLocation,
      selectedDates: parsedDates,
      savedAt: new Date().toISOString(),
      status: 'draft',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      attachment: req.file ? req.file.filename : undefined
    };
    
    // Add the new draft
    db.draftSelections.push(dateRecord);
    const success = await writeDatabase(db);
    if (success) {
      res.json({ 
        message: 'Draft saved successfully', 
        savedDates: parsedDates.length,
        record: dateRecord
      });
    } else {
      res.status(500).json({ error: 'Failed to save draft to database' });
    }
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit draft for review
app.post('/api/submit-for-review', async (req, res) => {
  try {
    const { employeeId } = req.body;
    
    const db = await readDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    // Find draft record for this user
    const draftIndex = db.draftSelections?.findIndex(record => 
      record.employeeId === employeeId
    );

    if (draftIndex === -1 || !db.draftSelections) {
      return res.status(404).json({ error: 'No draft found for this user' });
    }

    const draftRecord = db.draftSelections[draftIndex];

    // Initialize submittedSelections array if it doesn't exist
    if (!db.submittedSelections) {
      db.submittedSelections = [];
    }

    // Create submitted record
    const submittedRecord = {
      ...draftRecord,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    // Add to submitted selections
    db.submittedSelections.push(submittedRecord);

    // Remove from draft selections
    db.draftSelections.splice(draftIndex, 1);

    const success = await writeDatabase(db);
    
    if (success) {
      res.json({ 
        message: 'Selection submitted for review successfully', 
        record: submittedRecord
      });
    } else {
      res.status(500).json({ error: 'Failed to submit selection' });
    }

  } catch (error) {
    console.error('Error submitting for review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get draft dates for a user
app.get('/api/get-draft/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const db = await readDatabase();
    
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    // Find all drafts for this user and get the most recent one
    const userRecords = db.draftSelections?.filter(record => 
      record.employeeId === employeeId
    );

    if (userRecords && userRecords.length > 0) {
      // Sort by savedAt timestamp and get the most recent
      const latestRecord = userRecords.sort((a, b) => 
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      )[0];
      
      res.json(latestRecord);
    } else {
      res.json({ message: 'No draft found for this user', selectedDates: [] });
    }

  } catch (error) {
    console.error('Error getting draft:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get submitted dates for a user
app.get('/api/get-submitted/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const db = await readDatabase();
    
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    const userRecord = db.submittedSelections?.find(record => 
      record.employeeId === employeeId
    );

    if (userRecord) {
      res.json(userRecord);
    } else {
      res.json({ message: 'No submitted selection found for this user', selectedDates: [] });
    }

  } catch (error) {
    console.error('Error getting submitted selection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all submitted selections (for admin)
app.get('/api/submitted-selections', async (req, res) => {
  try {
    const db = await readDatabase();
    
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    res.json(db.submittedSelections || []);

  } catch (error) {
    console.error('Error getting submitted selections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve selection (admin)
app.post('/api/approve-selection', async (req, res) => {
  try {
    const { selectionId, adminComment } = req.body;
    
    const db = await readDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    // Find submitted selection
    const submissionIndex = db.submittedSelections?.findIndex(record => 
      record.id === selectionId
    );

    if (submissionIndex === -1 || !db.submittedSelections) {
      return res.status(404).json({ error: 'Submitted selection not found' });
    }

    const submission = db.submittedSelections[submissionIndex];

    // Update status and add admin details
    submission.status = 'approved';
    submission.adminComment = adminComment;
    submission.reviewedAt = new Date().toISOString();

    // Initialize approvedSelections if it doesn't exist
    if (!db.approvedSelections) {
      db.approvedSelections = [];
    }

    // Move to approved selections
    db.approvedSelections.push(submission);

    // Remove from submitted selections
    db.submittedSelections.splice(submissionIndex, 1);

    const success = await writeDatabase(db);
    
    if (success) {
      res.json({ message: 'Selection approved successfully' });
    } else {
      res.status(500).json({ error: 'Failed to approve selection' });
    }

  } catch (error) {
    console.error('Error approving selection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject selection (admin)
app.post('/api/reject-selection', async (req, res) => {
  try {
    const { selectionId, adminComment } = req.body;
    
    const db = await readDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    // Find submitted selection
    const submissionIndex = db.submittedSelections?.findIndex(record => 
      record.id === selectionId
    );

    if (submissionIndex === -1 || !db.submittedSelections) {
      return res.status(404).json({ error: 'Submitted selection not found' });
    }

    const submission = db.submittedSelections[submissionIndex];

    // Update status and add admin details
    submission.status = 'rejected';
    submission.adminComment = adminComment;
    submission.reviewedAt = new Date().toISOString();

    const success = await writeDatabase(db);
    
    if (success) {
      res.json({ message: 'Selection rejected successfully' });
    } else {
      res.status(500).json({ error: 'Failed to reject selection' });
    }

  } catch (error) {
    console.error('Error rejecting selection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Legacy endpoint - Save selected dates endpoint (kept for backward compatibility)
app.post('/api/save-dates', async (req, res) => {
  try {
    const { userId, employeeId, selectedDates, userDesignation, userLocation } = req.body;
    
    if (!selectedDates || !Array.isArray(selectedDates)) {
      return res.status(400).json({ error: 'Selected dates are required and must be an array' });
    }

    const db = await readDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    // Initialize selectedDates array if it doesn't exist
    if (!db.selectedDates) {
      db.selectedDates = [];
    }

    // Find existing record for this user
    const existingRecordIndex = db.selectedDates.findIndex(record => 
      record.employeeId === employeeId
    );

    const dateRecord = {
      id: existingRecordIndex >= 0 ? db.selectedDates[existingRecordIndex].id : Date.now(),
      userId: userId,
      employeeId: employeeId,
      userDesignation: userDesignation,
      userLocation: userLocation,
      selectedDates: selectedDates,
      savedAt: new Date().toISOString(),
      month: new Date().getMonth() + 1, // Current month
      year: new Date().getFullYear() // Current year
    };

    if (existingRecordIndex >= 0) {
      // Update existing record
      db.selectedDates[existingRecordIndex] = dateRecord;
    } else {
      // Add new record
      db.selectedDates.push(dateRecord);
    }

    const success = await writeDatabase(db);
    
    if (success) {
      res.json({ 
        message: 'Selected dates saved successfully', 
        savedDates: selectedDates.length,
        record: dateRecord
      });
    } else {
      res.status(500).json({ error: 'Failed to save to database' });
    }

  } catch (error) {
    console.error('Error saving dates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get saved dates for a user
app.get('/api/get-dates/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const db = await readDatabase();
    
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    const userRecord = db.selectedDates?.find(record => 
      record.employeeId === employeeId
    );

    if (userRecord) {
      res.json(userRecord);
    } else {
      res.json({ message: 'No saved dates found for this user', selectedDates: [] });
    }

  } catch (error) {
    console.error('Error getting dates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all saved date records (for admin)
app.get('/api/all-saved-dates', async (req, res) => {
  try {
    const db = await readDatabase();
    
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    res.json(db.selectedDates || []);

  } catch (error) {
    console.error('Error getting all dates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users who haven't submitted roster dates (for admin)
app.get('/api/users-not-submitted', async (req, res) => {
  try {
    const db = await readDatabase();
    
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Get all users
    const allUsers = db.users || [];
    
    // Get users who have submitted for current month/year
    const submittedUsers = new Set();
    
    // Check submitted selections
    if (db.submittedSelections) {
      db.submittedSelections
        .filter(submission => submission.month === currentMonth && submission.year === currentYear)
        .forEach(submission => submittedUsers.add(submission.employeeId));
    }
    
    // Check approved selections
    if (db.approvedSelections) {
      db.approvedSelections
        .filter(selection => selection.month === currentMonth && selection.year === currentYear)
        .forEach(selection => submittedUsers.add(selection.employeeId));
    }
    
    // Filter users who haven't submitted
    const usersNotSubmitted = allUsers.filter(user => !submittedUsers.has(user.employeeId));
    
    res.json({
      month: currentMonth,
      year: currentYear,
      totalUsers: allUsers.length,
      submittedCount: submittedUsers.size,
      notSubmittedCount: usersNotSubmitted.length,
      usersNotSubmitted: usersNotSubmitted
    });

  } catch (error) {
    console.error('Error getting users who haven\'t submitted:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all approved selections for a user
app.get('/api/get-approved/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const db = await readDatabase();
    if (!db || !db.approvedSelections) {
      return res.json([]);
    }
    const approved = db.approvedSelections.filter(sel => sel.employeeId === employeeId);
    res.json(approved);
  } catch (error) {
    console.error('Error fetching approved selections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User Management API Endpoints

// Add new user
app.post('/api/users', async (req, res) => {
  try {
    const { name, employeeId, password, designation, location, role = 'user' } = req.body;
    
    // Validate required fields
    if (!name || !employeeId || !password || !designation || !location) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = await readDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    // Ensure users array exists
    if (!db.users) {
      db.users = [];
    }
    if (!db.admins) {
      db.admins = [];
    }

    // Check if employeeId already exists in users or admins
    const existingUser = db.users.find(u => u.employeeId === employeeId);
    const existingAdmin = db.admins.find(a => a.employeeId === employeeId);
    
    if (existingUser || existingAdmin) {
      return res.status(400).json({ error: 'Employee ID already exists' });
    }

    // Generate new ID
    const allIds = [...db.users.map(u => u.id), ...db.admins.map(a => a.id)];
    const newId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;

    const newUser = {
      id: newId,
      name,
      employeeId,
      password,
      designation,
      location,
      role
    };

    // Add to appropriate collection based on role
    if (role === 'admin') {
      newUser.permissions = ['view_all_users', 'manage_bookings'];
      db.admins.push(newUser);
    } else {
      db.users.push(newUser);
    }

    const success = await writeDatabase(db);
    if (success) {
      // Don't send password back
      const { password: _, ...userResponse } = newUser;
      res.status(201).json({ message: 'User created successfully', user: userResponse });
    } else {
      res.status(500).json({ error: 'Failed to save user' });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, employeeId, designation, location, role } = req.body;
    
    const db = await readDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    let userFound = false;
    let userIndex = -1;
    let isAdmin = false;

    // Check in users array first
    userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      userFound = true;
      isAdmin = false;
    } else {
      // Check in admins array
      userIndex = db.admins.findIndex(a => a.id === userId);
      if (userIndex >= 0) {
        userFound = true;
        isAdmin = true;
      }
    }

    if (!userFound) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if new employeeId already exists (excluding current user)
    if (employeeId) {
      const existingUser = db.users.find(u => u.employeeId === employeeId && u.id !== userId);
      const existingAdmin = db.admins.find(a => a.employeeId === employeeId && a.id !== userId);
      
      if (existingUser || existingAdmin) {
        return res.status(400).json({ error: 'Employee ID already exists' });
      }
    }

    const targetArray = isAdmin ? db.admins : db.users;
    const currentUser = targetArray[userIndex];

    // Update user fields
    if (name) currentUser.name = name;
    if (employeeId) currentUser.employeeId = employeeId;
    if (designation) currentUser.designation = designation;
    if (location) currentUser.location = location;

    // Handle role change
    if (role && role !== currentUser.role) {
      // Remove from current array
      targetArray.splice(userIndex, 1);
      
      // Add to appropriate array
      currentUser.role = role;
      if (role === 'admin') {
        if (!currentUser.permissions) {
          currentUser.permissions = ['view_all_users', 'manage_bookings'];
        }
        db.admins.push(currentUser);
      } else {
        delete currentUser.permissions;
        db.users.push(currentUser);
      }
    }

    const success = await writeDatabase(db);
    if (success) {
      const { password: _, ...userResponse } = currentUser;
      res.json({ message: 'User updated successfully', user: userResponse });
    } else {
      res.status(500).json({ error: 'Failed to save user' });
    }
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const db = await readDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    let userFound = false;
    let userIndex = -1;
    let isAdmin = false;
    let deletedUser = null;

    // Check in users array first
    userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      userFound = true;
      isAdmin = false;
      deletedUser = db.users[userIndex];
      db.users.splice(userIndex, 1);
    } else {
      // Check in admins array
      userIndex = db.admins.findIndex(a => a.id === userId);
      if (userIndex >= 0) {
        userFound = true;
        isAdmin = true;
        deletedUser = db.admins[userIndex];
        db.admins.splice(userIndex, 1);
      }
    }

    if (!userFound) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Also remove related data (draft selections, submitted selections, etc.)
    if (db.draftSelections) {
      db.draftSelections = db.draftSelections.filter(d => d.userId !== userId.toString());
    }
    if (db.submittedSelections) {
      db.submittedSelections = db.submittedSelections.filter(s => s.userId !== userId.toString());
    }
    if (db.approvedSelections) {
      db.approvedSelections = db.approvedSelections.filter(a => a.userId !== userId.toString());
    }

    const success = await writeDatabase(db);
    if (success) {
      res.json({ message: 'User and related data deleted successfully', deletedUser: deletedUser.name });
    } else {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database path: ${DB_PATH}`);
});
