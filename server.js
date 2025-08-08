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

// Save selected dates endpoint
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database path: ${DB_PATH}`);
});
