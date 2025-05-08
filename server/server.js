const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Sequelize setup
const sequelize = new Sequelize(
  process.env.DB_NAME || 'e-voting',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

//Shareholder Model
const Shareholder = sequelize.define('shareholders', {
  acno: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
  name: DataTypes.STRING,
 
  address: DataTypes.STRING,
  holdings: DataTypes.STRING,
  phone_number: DataTypes.STRING,
  email: DataTypes.STRING,
  chn: DataTypes.STRING,
  rin: DataTypes.STRING,
  hasVoted: { type: Sequelize.BOOLEAN, defaultValue: false, allowNull: false }
}, {
  timestamps: false,
  freezTableName: true
});

// Registered User Model
const RegisteredUser = sequelize.define('registeredusers', {
  name: DataTypes.STRING,
  acno: DataTypes.STRING,
  email: DataTypes.STRING,
  phone_number: DataTypes.STRING,
  registered_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
});

// Verification Token Model
const VerificationToken = sequelize.define('VerificationToken', {
  acno: { type: DataTypes.STRING, allowNull: false },
  token: { type: DataTypes.STRING, allowNull: false },
  email: DataTypes.STRING,
  phone_number: DataTypes.STRING,
  expires_at: { type: DataTypes.DATE, allowNull: false }
}, {
  timestamps: false,
  freezeTableName: true
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Check shareholder route
// app.post('/api/check-shareholder', async (req, res) => {
//   let { name, acno } = req.body;

//   if (!name && !acno) {
//     return res.status(400).json({ error: 'Please provide a name or account number.' });
//   }

//   try {
//     const conditions = [];
//     if (name) conditions.push({ name: { [Op.like]: `%${name}%` } });
//     if (acno) conditions.push({ acno });

//     const match = await Shareholder.findOne({ where: { [Op.or]: conditions } });

//     if (match) {
//       return res.json({
//         status: 'found',
//         shareholder: {
//           name: match.name,
//           acno: match.acno,
//           email: match.email,
//           phone_number: match.phone_number,
//         }
//       });
//     } else {
//       return res.json({ status: 'fail', message: '❌ Name not found or details do not match.' });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Internal server error.' });
//   }
// });

// Updated check-shareholder route
app.post('/api/check-shareholder', async (req, res) => {
  const { searchTerm } = req.body;

  if (!searchTerm) {
    return res.status(400).json({ error: 'Please provide a search term.' });
  }

  try {
    // Check if searchTerm is numeric (account number)
    const isAccountNumber = /^\d+$/.test(searchTerm);

    if (isAccountNumber) {
      // Exact match for account numbers
      const shareholder = await Shareholder.findOne({ 
        where: { acno: searchTerm } 
      });

      if (shareholder) {
        return res.json({
          status: 'account_match',
          shareholder: {
            name: shareholder.name,
            acno: shareholder.acno,
            email: shareholder.email,
            phone_number: shareholder.phone_number
          }
        });
      }
    }

    // For names, do partial search (randomized)
    const shareholders = await Shareholder.findAll({
      where: {
        name: { [Op.like]: `%${searchTerm}%` }
      },
      order: sequelize.random(), // Randomize name results
      limit: 10
    });

    if (shareholders.length > 0) {
      return res.json({
        status: 'name_matches',
        shareholders: shareholders.map(sh => ({
          name: sh.name,
          acno: sh.acno,
          email: sh.email,
          phone_number: sh.phone_number
        }))
      });
    }

    return res.json({ 
      status: 'not_found', 
      message: 'No matching shareholders found.' 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Send confirmation link via email
app.post('/api/send-confirmation', async (req, res) => {
  const { acno, email, phone_number } = req.body;

  try {
    const shareholder = await Shareholder.findOne({ where: { acno } });
    if (!shareholder) return res.status(404).json({ message: 'Shareholder not found' });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await VerificationToken.create({ acno, token, email, phone_number, expires_at: expiresAt });

    const confirmUrl = `http://localhost:3001/api/confirm/${token}`;

    await transporter.sendMail({
      from: 'E-Voting Portal <your@email.com>',
      to: shareholder.email,
      subject: 'Confirm Your Registration',
      html: `
        <h2>🗳️ E-Voting Registration</h2>
        <p>Hello ${shareholder.name},</p>
        <p>Click the button below to confirm your registration:</p>
        <a href="${confirmUrl}" style="background-color:#1075bf;padding:12px 20px;color:#fff;text-decoration:none;border-radius:5px;">
          ✅ Confirm Registration
        </a>
        <p>If you didn’t request this, just ignore this email.</p>
      `
    });

    res.json({ message: '✅ Confirmation sent to email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send confirmation.' });
  }
});

// Confirm registration
app.get('/api/confirm/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const pending = await VerificationToken.findOne({ where: { token } });

    if (!pending || new Date(pending.expires_at) < new Date()) {
      return res.status(400).send('❌ Invalid or expired token.');
    }

    // Fetch full shareholder details
    const shareholder = await Shareholder.findOne({ where: { acno: pending.acno } });

    if (!shareholder) {
      return res.status(404).send('❌ Shareholder not found.');
    }

    await RegisteredUser.create({
      name: shareholder.name,
      acno: shareholder.acno,
      email: shareholder.email,
      phone_number: shareholder.phone_number,
      registered_at: new Date()
    });

    await pending.destroy();

    // Send follow-up email
    await transporter.sendMail({
      from: '"E-Voting Portal" <your@email.com>',
      to: shareholder.email,
      subject: '✅ Successfully Registered for Voting',
      html: `
        <h2>🎉 Hello ${shareholder.name},</h2>
        <p>You have successfully registered for the upcoming e-voting session.</p>
        <p>✅ Your account is now active.</p>
        <h3>🗳️ Voting Instructions:</h3>
        <ul>
          <li>Visit the <a href="http://yourdomain.com/e-voting">E-Voting Portal</a></li>
          <li>Login using your registered email address: <strong>${shareholder.email}</strong></li> or <br> phone Number:<strong>${shareholder.phone_number}</strong>
          <li>Follow the prompts to cast your vote</li>
        </ul>
        <p>Thank you for participating!</p>
      `
    });

    res.redirect('http://yourdomain.com/success');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Start server
const PORT = process.env.PORT || 3001;
sequelize.sync().then(() => {
  console.log('✅ Database synced');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
