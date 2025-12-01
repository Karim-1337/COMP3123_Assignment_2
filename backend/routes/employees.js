const express = require('express');
const router = express.Router();
const { body, validationResult, query } = require('express-validator');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const Employee = require('../models/Employee');
const fs = require('fs');
const path = require('path');

router.get('/', auth, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ 
      message: 'Server error fetching employees',
      error: error.message 
    });
  }
});

router.get('/search', auth, [
  query('department').optional().trim(),
  query('position').optional().trim(),
], async (req, res) => {
  try {
    const { department, position } = req.query;
    const query = {};

    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }
    if (position) {
      query.position = { $regex: position, $options: 'i' };
    }

    const employees = await Employee.find(query).sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Search employees error:', error);
    res.status(500).json({ 
      message: 'Server error searching employees',
      error: error.message 
    });
  }
});

// GET /api/employees/:id - Get single employee
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(500).json({ 
      message: 'Server error fetching employee',
      error: error.message 
    });
  }
});

router.post('/', auth, upload.single('profilePicture'), [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),
  body('position')
    .trim()
    .notEmpty()
    .withMessage('Position is required'),
  body('phoneNumber')
    .optional()
    .trim(),
  body('salary')
    .optional()
    .isNumeric()
    .withMessage('Salary must be a number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { firstName, lastName, email, phoneNumber, department, position, salary } = req.body;

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    const employeeData = {
      firstName,
      lastName,
      email,
      phoneNumber: phoneNumber || '',
      department,
      position,
      salary: salary ? parseFloat(salary) : 0,
      createdBy: req.user._id,
    };

    if (req.file) {
      employeeData.profilePicture = `/uploads/${req.file.filename}`;
    }

    const employee = new Employee(employeeData);
    await employee.save();

    res.status(201).json({
      message: 'Employee created successfully',
      employee,
    });
  } catch (error) {
    console.error('Create employee error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      message: 'Server error creating employee',
      error: error.message 
    });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', auth, upload.single('profilePicture'), [
  body('firstName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty'),
  body('lastName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('department')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department cannot be empty'),
  body('position')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Position cannot be empty'),
  body('salary')
    .optional()
    .isNumeric()
    .withMessage('Salary must be a number'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (req.body.email && req.body.email !== employee.email) {
      const existingEmployee = await Employee.findOne({ email: req.body.email });
      if (existingEmployee) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ message: 'Employee with this email already exists' });
      }
    }

    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'profilePicture') {
        if (key === 'salary') {
          employee[key] = parseFloat(req.body[key]);
        } else {
          employee[key] = req.body[key];
        }
      }
    });

    if (req.file) {
      if (employee.profilePicture) {
        const oldFilePath = path.join(__dirname, '..', employee.profilePicture);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      employee.profilePicture = `/uploads/${req.file.filename}`;
    }

    await employee.save();

    res.json({
      message: 'Employee updated successfully',
      employee,
    });
  } catch (error) {
    console.error('Update employee error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(500).json({ 
      message: 'Server error updating employee',
      error: error.message 
    });
  }
});

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (employee.profilePicture) {
      const filePath = path.join(__dirname, '..', employee.profilePicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Employee.findByIdAndDelete(req.params.id);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(500).json({ 
      message: 'Server error deleting employee',
      error: error.message 
    });
  }
});

module.exports = router;

