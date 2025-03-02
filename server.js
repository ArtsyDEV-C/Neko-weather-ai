const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./db');
const User = require('./models/User');
const City = require('./models/City');
const dotenv = require('dotenv');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sendMessageToOpenAI } = require('./chatbot');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

// Serve static files
app.use(express.static('public'));

// Routes
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send('User already exists');
    }
    const newUser = new User({ username, password });
    await newUser.save();
    res.status(201).send('User registered');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Error registering user');
  }
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).send(info.message);
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.send('Logged in');
    });
  })(req, res, next);
});

app.post('/cities', async (req, res) => {
  try {
    if (!req.isAuthenticated()) return res.status(401).send('Not authenticated');

    const { city } = req.body;
    const newCity = new City({ name: city, userId: req.user.id });
    await newCity.save();
    res.status(201).send('City saved');
  } catch (error) {
    console.error('Error saving city:', error);
    res.status(500).send('Error saving city');
  }
});

app.post('/chatbot', async (req, res) => {
    const { message } = req.body;
    try {
        const response = await sendMessageToOpenAI(message);
        res.send({ response });
    } catch (error) {
        console.error('Error communicating with OpenAI:', error);
        res.status(500).send('Error communicating with chat bot');
    }
});

app.get('/weather', async (req, res) => {
    const { lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.send(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).send('Error fetching weather data');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});