require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { connectDB, getDB } = require('./db');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function buildToken(user) {
  return jwt.sign(
    { sub: String(user._id), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, and password are required' });
    }

    const users = getDB().collection('users');
    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await users.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const doc = {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      createdAt: new Date()
    };

    const result = await users.insertOne(doc);
    const user = { ...doc, _id: result.insertedId };
    const token = buildToken(user);

    return res.status(201).json({
      message: 'Registered successfully',
      token,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const users = getDB().collection('users');
    const user = await users.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = buildToken(user);
    return res.json({
      message: 'Logged in successfully',
      token,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const users = getDB().collection('users');
    const user = await users.findOne(
      { _id: new ObjectId(req.user.sub) },
      { projection: { passwordHash: 0 } }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: { id: String(user._id), name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching profile' });
  }
});

app.get('/api/admin/stats', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const users = getDB().collection('users');
    const totalUsers = await users.countDocuments();
    const admins = await users.countDocuments({ role: 'admin' });

    return res.json({ totalUsers, admins, requestedBy: req.user.email });
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching admin stats' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error('Missing MONGODB_URI or JWT_SECRET in environment.');
  }

  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
