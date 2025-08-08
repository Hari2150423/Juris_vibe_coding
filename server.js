const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'src', 'assets', 'db.json');

// Middleware
app.use(cors({
  origin: true, // Allow all origins during development
  credentials: true
}));
app.use(express.json());

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

// Save selected dates as draft
app.post('/api/save-draft', async (req, res) => {
  try {
    const { userId, employeeId, selectedDates, userDesignation, userLocation } = req.body;
    
    if (!selectedDates || !Array.isArray(selectedDates)) {
      return res.status(400).json({ error: 'Selected dates are required and must be an array' });
    }

    const db = await readDatabase();
    if (!db) {
      return res.status(500).json({ error: 'Failed to read database' });
    }

    // Initialize draftSelections array if it doesn't exist
    if (!db.draftSelections) {
      db.draftSelections = [];
    }

    // Find existing draft record for this user
    const existingRecordIndex = db.draftSelections.findIndex(record => 
      record.employeeId === employeeId
    );

    const dateRecord = {
      id: existingRecordIndex >= 0 ? db.draftSelections[existingRecordIndex].id : Date.now(),
      userId: userId,
      employeeId: employeeId,
      userDesignation: userDesignation,
      userLocation: userLocation,
      selectedDates: selectedDates,
      savedAt: new Date().toISOString(),
      status: 'draft',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    };

    if (existingRecordIndex >= 0) {
      // Update existing draft record
      db.draftSelections[existingRecordIndex] = dateRecord;
    } else {
      // Add new draft record
      db.draftSelections.push(dateRecord);
    }

    const success = await writeDatabase(db);
    
    if (success) {
      res.json({ 
        message: 'Draft saved successfully', 
        savedDates: selectedDates.length,
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

    const userRecord = db.draftSelections?.find(record => 
      record.employeeId === employeeId
    );

    if (userRecord) {
      res.json(userRecord);
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database path: ${DB_PATH}`);
});
