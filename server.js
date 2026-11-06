require("dotenv").config();

const express = require("express");

const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");

const session = require("express-session");

const MongoStore = require("connect-mongo");

const path = require("path");

const app = express();

const PORT = 3000;

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname));

mongoose.connect(process.env.MONGODB_URI)

  .then(() => console.log("MongoDB connected successfully!"))

  .catch(error => console.log("MongoDB error:", error.message));

const User = mongoose.model("User", new mongoose.Schema({

  name: String,

  email: { type: String, unique: true },

  password: String

}));

const Booking = mongoose.model("Booking", new mongoose.Schema({

  student: String,

  lesson: String,

  lessonDate: String

}));

app.use(session({

  secret: process.env.SESSION_SECRET,

  resave: false,

  saveUninitialized: false,

  store: MongoStore.create({

    mongoUrl: process.env.MONGODB_URI

  })

}));

app.post("/api/register", async (req, res) => {

  try {

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });

    if (existing) {

      return res.status(400).json({ message: "Email already registered." });

    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({

      name,

      email,

      password: hashedPassword

    });

    req.session.userId = user._id.toString();

    req.session.userName = user.name;

    res.json({ message: "Registration successful!" });

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

});

app.post("/api/login", async (req, res) => {

  try {

    const user = await User.findOne({ email: req.body.email });

    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {

      return res.status(401).json({ message: "Invalid email or password." });

    }

    req.session.userId = user._id.toString();

    req.session.userName = user.name;

    res.json({ message: "Login successful!" });

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

});

app.get("/api/me", (req, res) => {

  if (!req.session.userId) {

    return res.status(401).json({ message: "Please log in." });

  }

  res.json({ name: req.session.userName });

});

app.post("/api/bookings", async (req, res) => {

  try {

    if (!req.session.userId) {

      return res.status(401).json({ message: "Please log in first." });

    }

    const booking = await Booking.create({

      student: req.session.userId,

      lesson: req.body.lesson,

      lessonDate: req.body.lessonDate

    });

    res.json({ message: "Lesson booked!", booking });

  } catch (error) {

    res.status(500).json({ message: error.message });

  }

});

app.get("/api/bookings", async (req, res) => {

  if (!req.session.userId) {

    return res.status(401).json({ message: "Please log in." });

  }

  const bookings = await Booking.find({

    student: req.session.userId

  });

  res.json(bookings);

});

app.delete("/api/bookings/:id", async (req, res) => {

  if (!req.session.userId) {

    return res.status(401).json({ message: "Please log in." });

  }

  await Booking.deleteOne({

    _id: req.params.id,

    student: req.session.userId

  });

  res.json({ message: "Booking cancelled." });

});

app.post("/api/logout", (req, res) => {

  req.session.destroy(() => {

    res.json({ message: "Logged out." });

  });

});

app.listen(PORT, () => {

  console.log(`Strings Studio running at http://localhost:${PORT}`);

});