import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';

const envFilePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
dotenv.config({ path: envFilePath });

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL || '',
  'https://alin679.github.io'
].filter(Boolean);

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

const carSchema = new mongoose.Schema(
  {
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    price: { type: Number, required: true },
    mileage: { type: Number, required: true },
    fuel: { type: String, required: true, trim: true },
    transmission: { type: String, required: true, trim: true },
    bodyType: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Car = mongoose.models.Car || mongoose.model('Car', carSchema);

const demoCars = [
  {
    make: 'BMW',
    model: 'Seria 3',
    year: 2022,
    price: 28900,
    mileage: 18000,
    fuel: 'Diesel',
    transmission: 'Automată',
    bodyType: 'Sedan',
    image: 'https://images.unsplash.com/photo-1549399542-7e15f1b79f3f?auto=format&fit=crop&w=1200&q=80',
    featured: true,
  },
  {
    make: 'Audi',
    model: 'Q5',
    year: 2021,
    price: 33900,
    mileage: 22000,
    fuel: 'Hybrid',
    transmission: 'Automată',
    bodyType: 'SUV',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    featured: true,
  },
  {
    make: 'Volkswagen',
    model: 'Golf',
    year: 2020,
    price: 17900,
    mileage: 41000,
    fuel: 'Benzină',
    transmission: 'Manuală',
    bodyType: 'Hatchback',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80',
    featured: false,
  },
  {
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    price: 42900,
    mileage: 9000,
    fuel: 'Electric',
    transmission: 'Automată',
    bodyType: 'Sedan',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80',
    featured: true,
  },
];

const ensureSeedData = async () => {
  const [carCount, adminCount] = await Promise.all([Car.countDocuments(), User.countDocuments({ role: 'admin' })]);

  if (carCount === 0) {
    await Car.insertMany(demoCars);
  }

  if (adminCount === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await User.create({
      name: process.env.ADMIN_NAME || 'Admin VeoCars',
      email: process.env.ADMIN_EMAIL.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
    });
    console.log('✅ Cont admin implicit creat');
  }
};

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'dev_secret_key', { expiresIn: '7d' });
};

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token lipsă' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key');
    const user = await User.findById(payload.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Utilizator invalid' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalid sau expirat' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acces interzis' });
  }

  next();
};

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/car_sales');
    console.log('✅ MongoDB conectat');
  } catch (error) {
    console.warn('⚠️ MongoDB nu este disponibil acum. Serverul pornește fără bază de date.');
    console.warn(error.message);
  }
};

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server rula cu succes' });
});

app.get('/api/cars', async (req, res) => {
  const { search = '', fuel = 'all', bodyType = 'all' } = req.query;
  const normalizedSearch = search.toString().trim().toLowerCase();

  try {
    const storedCars = await Car.find().sort({ createdAt: -1 });
    const sourceCars = storedCars.length ? storedCars : demoCars;

    const filteredCars = sourceCars.filter((car) => {
    const matchesSearch =
      !normalizedSearch ||
      `${car.make} ${car.model}`.toLowerCase().includes(normalizedSearch) ||
      String(car.year).includes(normalizedSearch);

    const matchesFuel = fuel === 'all' || car.fuel.toLowerCase() === fuel.toString().toLowerCase();
    const matchesBodyType = bodyType === 'all' || car.bodyType.toLowerCase() === bodyType.toString().toLowerCase();

    return matchesSearch && matchesFuel && matchesBodyType;
    });

    res.json({
      items: filteredCars,
      total: filteredCars.length,
      filters: {
        search,
        fuel,
        bodyType,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Nu am putut încărca mașinile' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nume, email și parolă sunt obligatorii' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Există deja un cont cu acest email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = createToken(user._id.toString());

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Nu am putut crea contul' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email și parolă sunt obligatorii' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Date de autentificare incorecte' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Date de autentificare incorecte' });
    }

    const token = createToken(user._id.toString());

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Autentificarea a eșuat' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/admin/cars', authMiddleware, adminMiddleware, async (req, res) => {
  const cars = await Car.find().sort({ createdAt: -1 });
  res.json({ items: cars, total: cars.length });
});

app.post('/api/admin/cars', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const createdCar = await Car.create(req.body);
    res.status(201).json({ car: createdCar });
  } catch (error) {
    res.status(400).json({ message: 'Nu am putut salva mașina' });
  }
});

app.get('/api/cars/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Mașina nu a fost găsită' });
    }
    res.json({ car });
  } catch (error) {
    res.status(500).json({ message: 'Nu am putut încărca mașina' });
  }
});

app.put('/api/admin/cars/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updatedCar = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedCar) {
      return res.status(404).json({ message: 'Mașina nu a fost găsită' });
    }
    res.json({ car: updatedCar });
  } catch (error) {
    res.status(400).json({ message: 'Nu am putut actualiza mașina' });
  }
});

app.delete('/api/admin/cars/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deletedCar = await Car.findByIdAndDelete(req.params.id);
    if (!deletedCar) {
      return res.status(404).json({ message: 'Mașina nu a fost găsită' });
    }
    res.json({ message: 'Mașina a fost ștearsă', car: deletedCar });
  } catch (error) {
    res.status(500).json({ message: 'Nu am putut șterge mașina' });
  }
});

// Start Server
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Server rula pe http://localhost:${PORT}`);
    });
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      await ensureSeedData();
    }
  } catch (error) {
    console.error('❌ Eroare start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
