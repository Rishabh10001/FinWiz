// // server.js - Corrected Version

// // 1. Import Dependencies
// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const helmet = require('helmet');
// const nodemailer = require('nodemailer'); // Import Nodemailer
// const path = require('path');

// // 2. Initialize App and Middleware
// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(cors());
// app.use(helmet());
// app.use(express.json());

// // 3. Connect to MongoDB
// mongoose.connect(process.env.DATABASE_URL)
//     .then(() => console.log('Successfully connected to MongoDB Atlas!'))
//     .catch(err => {
//         console.error('Initial Database Connection Error:', err);
//         process.exit(1);
//     });

// // 4. Nodemailer Transporter Setup
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
// });

// console.log('Nodemailer configured for user:', process.env.EMAIL_USER);


// // 5. Define Schemas and Models
// const userSchema = new mongoose.Schema({
//     fullName: { type: String, required: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     password: { type: String, required: true }
// });
// const User = mongoose.model('User', userSchema);

// const transactionSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
//     description: { type: String, required: true, trim: true },
//     amount: { type: Number, required: true },
//     date: { type: Date, required: true },
//     type: { type: String, required: true, enum: ['income', 'expense'] },
//     category: { type: String, required: true, trim: true },
// });
// const Transaction = mongoose.model('Transaction', transactionSchema);

// const budgetSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     category: { type: String, required: true, trim: true },
//     limit: { type: Number, required: true }
// });
// budgetSchema.index({ userId: 1, category: 1 }, { unique: true });
// const Budget = mongoose.model('Budget', budgetSchema);

// // 6. Authentication Middleware
// const authMiddleware = (req, res, next) => {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ message: 'Authorization token required' });
//     }
//     const token = authHeader.split(' ')[1];
//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.userId = decoded.userId;
//         next();
//     } catch (error) {
//         return res.status(401).json({ message: 'Invalid or expired token' });
//     }
// };

// // 7. API Routes

// // --- Public Contact Route ---
// app.post('/api/contact', async (req, res) => {
//     try {
//         const { name, email, subject, message } = req.body;
//         if (!name || !email || !subject || !message) {
//             return res.status(400).json({ message: 'All fields are required.' });
//         }

//         const mailOptions = {
//             from: `"${name}" <${process.env.EMAIL_USER}>`,
//             to: process.env.EMAIL_USER,
//             replyTo: email,
//             subject: `FinWiz Contact Form: ${subject}`,
//             html: `
//                 <h2>New Message from FinWiz Contact Form</h2>
//                 <p><strong>Name:</strong> ${name}</p>
//                 <p><strong>Email:</strong> ${email}</p>
//                 <p><strong>Subject:</strong> ${subject}</p>
//                 <hr>
//                 <p><strong>Message:</strong></p>
//                 <p>${message.replace(/\n/g, '<br>')}</p>
//             `
//         };

//         await transporter.sendMail(mailOptions);
//         res.status(200).json({ message: 'Message sent successfully!' });

//     } catch (error) {
//         console.error('Error sending contact email:', error);
//         res.status(500).json({ message: 'Failed to send message.' });
//     }
// });


// // --- Authentication Routes ---
// app.post('/api/auth/signup', async (req, res) => {
//     try {
//         const { fullName, email, password, confirmPassword } = req.body;
        
//         if (!fullName || !email || !password) {
//             return res.status(400).json({ message: 'All fields are required.' });
//         }
//         if (password !== confirmPassword) {
//             return res.status(400).json({ message: 'Passwords do not match.' });
//         }
//         if (password.length < 6) {
//             return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
//         }
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(409).json({ message: 'Email already in use.' });
//         }
//         const hashedPassword = await bcrypt.hash(password, 12);
//         const user = new User({ fullName, email, password: hashedPassword });
//         await user.save();
//         res.status(201).json({ message: 'User created successfully. Please log in.' });
//     } catch (error) {
//         res.status(500).json({ message: 'Error signing up', error: error.message });
//     }
// });

// app.post('/api/auth/signin', async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(401).json({ message: 'Invalid email or password' });
//         }
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ message: 'Invalid email or password' });
//         }
//         const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
//         res.status(200).json({ token, userEmail: user.email, fullName: user.fullName });
//     } catch (error) {
//         res.status(500).json({ message: 'Error signing in', error: error.message });
//     }
// });

// // --- Protected Data Routes ---
// const dataRouter = express.Router();
// dataRouter.use(authMiddleware);

// dataRouter.get('/data', async (req, res) => {
//     try {
//         const [transactions, budgets] = await Promise.all([
//             Transaction.find({ userId: req.userId }).sort({ date: -1 }),
//             Budget.find({ userId: req.userId }).sort({ category: 1 })
//         ]);
//         res.json({ transactions, budgets });
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching data', error: error.message });
//     }
// });

// // --- Transaction CRUD ---
// dataRouter.post('/transactions', async (req, res) => {
//     try {
//         const newTransaction = new Transaction({ ...req.body, userId: req.userId });
//         await newTransaction.save();
//         res.status(201).json(newTransaction);
//     } catch (error) {
//         res.status(400).json({ message: 'Error creating transaction', error: error.message });
//     }
// });

// dataRouter.put('/transactions/:id', async (req, res) => {
//     try {
//         const updatedTransaction = await Transaction.findOneAndUpdate(
//             { _id: req.params.id, userId: req.userId },
//             req.body,
//             { new: true, runValidators: true }
//         );
//         if (!updatedTransaction) return res.status(404).json({ message: 'Transaction not found' });
//         res.json(updatedTransaction);
//     } catch (error) {
//         res.status(400).json({ message: 'Error updating transaction', error: error.message });
//     }
// });

// dataRouter.delete('/transactions/:id', async (req, res) => {
//     try {
//         const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
//         if (!deleted) return res.status(404).json({ message: 'Transaction not found' });
//         res.status(204).send();
//     } catch (error) {
//         res.status(500).json({ message: 'Error deleting transaction', error: error.message });
//     }
// });

// // --- Budget CRUD ---
// dataRouter.post('/budgets', async (req, res) => {
//     try {
//         const { category, limit } = req.body;
//         const existingBudget = await Budget.findOne({ category, userId: req.userId });
//         if (existingBudget) {
//             return res.status(409).json({ message: `A budget for '${category}' already exists.` });
//         }
//         const newBudget = new Budget({ category, limit, userId: req.userId });
//         await newBudget.save();
//         res.status(201).json(newBudget);
//     } catch (error) {
//         res.status(400).json({ message: 'Error creating budget', error: error.message });
//     }
// });

// dataRouter.put('/budgets/:id', async (req, res) => {
//     try {
//         const { limit } = req.body;
//         const budget = await Budget.findOneAndUpdate(
//             { _id: req.params.id, userId: req.userId },
//             { limit: limit },
//             { new: true, runValidators: true }
//         );
//         if (!budget) return res.status(404).json({ message: 'Budget not found' });
//         res.json(budget);
//     } catch (error) {
//         res.status(400).json({ message: 'Error updating budget', error: error.message });
//     }
// });


// dataRouter.delete('/budgets/:id', async (req, res) => {
//     try {
//         const deleted = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId });
//         if (!deleted) return res.status(404).json({ message: 'Budget not found' });
//         res.status(204).send();
//     } catch (error) {
//         res.status(500).json({ message: 'Error deleting budget', error: error.message });
//     }
// });

// ///////////////////////////////////
// app.use('/api', dataRouter);

// app.use(express.static(path.join(__dirname)));
// app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'index.html'));
// });
// ////////////////////////////////////
// // 8. Start Server
// app.listen(PORT, () => {
//     console.log(`Backend server is running on http://localhost:${PORT}`);
// });






// server.js - Corrected and Updated for Deployment

// 1. Import Dependencies
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const nodemailer = require('nodemailer');
const path = require('path');

// 2. Initialize App and Middleware
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

// 3. Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL)
    .then(() => console.log('Successfully connected to MongoDB Atlas!'))
    .catch(err => {
        console.error('Initial Database Connection Error:', err);
        process.exit(1);
    });

// 4. Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

console.log('Nodemailer configured for user:', process.env.EMAIL_USER);


// 5. Define Schemas and Models
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    type: { type: String, required: true, enum: ['income', 'expense'] },
    category: { type: String, required: true, trim: true },
});
const Transaction = mongoose.model('Transaction', transactionSchema);

const budgetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true, trim: true },
    limit: { type: Number, required: true }
});
budgetSchema.index({ userId: 1, category: 1 }, { unique: true });
const Budget = mongoose.model('Budget', budgetSchema);

// 6. Authentication Middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// 7. API Routes

// --- Public Routes ---
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const mailOptions = {
            from: `"${name}" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: `FinWiz Contact Form: ${subject}`,
            html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>Message: ${message}</p>`
        };
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending contact email:', error);
        res.status(500).json({ message: 'Failed to send message.' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword } = req.body;
        if (!fullName || !email || !password) return res.status(400).json({ message: 'All fields are required.' });
        if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match.' });
        if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(409).json({ message: 'Email already in use.' });
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ fullName, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User created successfully. Please log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Error signing up', error: error.message });
    }
});

app.post('/api/auth/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: 'Invalid email or password' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({ token, userEmail: user.email, fullName: user.fullName });
    } catch (error) {
        res.status(500).json({ message: 'Error signing in', error: error.message });
    }
});

// --- Protected Routes ---
const dataRouter = express.Router();
dataRouter.use(authMiddleware);

dataRouter.get('/data', async (req, res) => {
    try {
        const [transactions, budgets] = await Promise.all([
            Transaction.find({ userId: req.userId }).sort({ date: -1 }),
            Budget.find({ userId: req.userId }).sort({ category: 1 })
        ]);
        res.json({ transactions, budgets });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching data', error: error.message });
    }
});

dataRouter.post('/transactions', async (req, res) => {
    try {
        const newTransaction = new Transaction({ ...req.body, userId: req.userId });
        await newTransaction.save();
        res.status(201).json(newTransaction);
    } catch (error) {
        res.status(400).json({ message: 'Error creating transaction', error: error.message });
    }
});

dataRouter.put('/transactions/:id', async (req, res) => {
    try {
        const updatedTransaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedTransaction) return res.status(404).json({ message: 'Transaction not found' });
        res.json(updatedTransaction);
    } catch (error) {
        res.status(400).json({ message: 'Error updating transaction', error: error.message });
    }
});

dataRouter.delete('/transactions/:id', async (req, res) => {
    try {
        const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!deleted) return res.status(404).json({ message: 'Transaction not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting transaction', error: error.message });
    }
});

dataRouter.post('/budgets', async (req, res) => {
    try {
        const { category, limit } = req.body;
        const newBudget = new Budget({ category, limit, userId: req.userId });
        await newBudget.save();
        res.status(201).json(newBudget);
    } catch (error) {
        // Handle cases where a budget for that category already exists
        if (error.code === 11000) {
             return res.status(409).json({ message: `A budget for '${category}' already exists.` });
        }
        res.status(400).json({ message: 'Error creating budget', error: error.message });
    }
});

dataRouter.put('/budgets/:id', async (req, res) => {
    try {
        const { limit } = req.body;
        const budget = await Budget.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { limit: limit },
            { new: true, runValidators: true }
        );
        if (!budget) return res.status(404).json({ message: 'Budget not found' });
        res.json(budget);
    } catch (error) {
        res.status(400).json({ message: 'Error updating budget', error: error.message });
    }
});

dataRouter.delete('/budgets/:id', async (req, res) => {
    try {
        const deleted = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!deleted) return res.status(404).json({ message: 'Budget not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting budget', error: error.message });
    }
});

app.use('/api', dataRouter);

// --- 7a. Serve Frontend ---
// This must be after all API routes
app.use(express.static(path.join(__dirname)));
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'index.html'));
});

// 8. Start Server
app.listen(PORT, () => {
    console.log(`Backend server is running on port: ${PORT}`);
});