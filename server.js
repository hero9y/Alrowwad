const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Student = require('./models/Student');
const Installment = require('./models/Installment');
const Setting = require('./models/Setting');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB connected successfully');
  
  // Create admin user if not exists
  const adminExists = await User.findOne({ username: 'admin' });
  if (!adminExists) {
    const adminUser = new User({
      username: 'admin',
      password: 'admin',
      verificationCode: '200102'
    });
    await adminUser.save();
    console.log('Admin user created');
  }
  
  // Create default cost setting if not exists
  const costSetting = await Setting.findOne({ name: 'defaultStudentCost' });
  if (!costSetting) {
    const newSetting = new Setting({
      name: 'defaultStudentCost',
      value: 300000
    });
    await newSetting.save();
    console.log('Default cost setting created');
  }
})
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const authenticate = (req, res, next) => {
  // In a real application, verify JWT token
  const token = req.headers.authorization?.split(' ')[1];
  if (token !== 'dummy-token') {
    return res.status(401).json({ message: 'غير مصرح' });
  }
  next();
};

// API Routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ username });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
    
    res.json({ message: 'تم تسجيل الدخول بنجاح', token: 'dummy-token' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

// Dashboard stats
app.get('/api/stats', authenticate, async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const defaultCostSetting = await Setting.findOne({ name: 'defaultStudentCost' });
    const defaultCost = defaultCostSetting ? defaultCostSetting.value : 300000;
    
    // Calculate payment statuses
    const students = await Student.find().populate('installments');
    let fullPayments = 0;
    let partialPayments = 0;
    
    for (const student of students) {
      const totalPaid = student.installments.reduce((sum, inst) => sum + inst.amount, 0);
      if (totalPaid >= defaultCost) {
        fullPayments++;
      } else if (totalPaid > 0) {
        partialPayments++;
      }
    }
    
    const noPayments = totalStudents - (fullPayments + partialPayments);
    
    res.json({
      totalStudents,
      fullPayments,
      partialPayments,
      noPayments
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

// Student routes
app.post('/api/students', authenticate, async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

app.get('/api/students', authenticate, async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    console.error('List students error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

app.delete('/api/students/:id', authenticate, async (req, res极狐) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'الطالب غير موجود' });
    }
    res.json({ message: 'تم حذف الطالب بنجاح' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

// Payment routes
app.post('/api/payments', authenticate, async (req, res) => {
  try {
    const payment = new Installment(req.body);
    await payment.save();
    
    // Add payment to student
    await Student.findByIdAndUpdate(req.body.student, {
      $push: { installments: payment._id }
    });
    
    res.status(201).json(payment);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

app.get('/api/payments', authenticate, async (req, res) => {
  try {
    const payments = await Installment.find().populate('student');
    res.json(payments);
  } catch (error) {
    console.error('List payments error:', error);
    res.status(500).json({ message: 'حدث خطأ في الخادم' });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});