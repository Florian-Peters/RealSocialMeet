const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const admin = require('firebase-admin');

var serviceAccount = require("./real-social-meet-firebase-adminsdk-d0v9e-ecabf53aa0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const userLocationData = [];
const socketToUsernameMap = new Map();
const usernameToSocketMap = new Map();
let eventLocations = []; // Definiere eventLocations global

const getUsernameSocketId = (username) => {
  for (const [socketId, name] of socketToUsernameMap.entries()) {
    if (name === username) {
      return socketId;
    }
  }
  return null;
};

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('confirmPurchase', async (data) => {
    console.log(`Received confirmPurchase with data: ${JSON.stringify(data)}`);
    await addEventLocation(data);

    setTimeout(() => {
      removeEventLocation(data.eventId);
    }, data.duration);
  });

  socket.on('updateLocation', (data) => {
    if (!data.gpsEnabled) {
      // Entferne den Benutzer, wenn GPS deaktiviert ist
      const index = userLocationData.findIndex((user) => user.username === data.username);
      if (index !== -1) {
        userLocationData.splice(index, 1);
        io.emit('updateLocation', userLocationData);
      }
      return;
    }

    const updatedUser = {
      latitude: data.latitude,
      longitude: data.longitude,
      username: data.username,
      image: data.image,
      duration: data.duration, // Hier die duration hinzufügen
      gpsEnabled: data.gpsEnabled // Sicherstellen, dass gpsEnabled übergeben wird
    };

    const existingUser = userLocationData.find((user) => user.username === data.username);
    if (existingUser) {
      Object.assign(existingUser, updatedUser);
    } else {
      userLocationData.push(updatedUser);
    }

    socketToUsernameMap.set(socket.id, data.username);
    usernameToSocketMap.set(data.username, socket.id);

    io.emit('updateLocation', userLocationData);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    const username = socketToUsernameMap.get(socket.id);
    const index = userLocationData.findIndex((user) => user.username === username);
    if (index !== -1) {
      userLocationData.splice(index, 1);
      io.emit('updateLocation', userLocationData);
    }
    socketToUsernameMap.delete(socket.id);
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'));
    }
  },
});

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file in request.' });
  }

  const latitude = parseFloat(req.body.latitude);
  const longitude = parseFloat(req.body.longitude);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ message: 'Latitude and longitude are required and cannot be null.' });
  }

  const { eventId } = req.body;

  addEventLocation({
    latitude: latitude,
    longitude: longitude,
    eventname: req.body.eventname,
    image: `http://192.168.178.55:3001/uploads/${req.file.filename}`,
    eventId: eventId,
  });

  res.status(200).json({
    message: 'Image uploaded successfully',
    eventId: eventId,
    imagePath: `http://192.168.178.55:3001/uploads/${req.file.filename}`,
  });
});

const addEventLocation = async (data) => {
  console.log(data);

  // Überprüfen Sie, ob data und data.duration definiert sind
  if (!data || typeof data.duration === 'undefined') {
    return;
  }
  const docRef = db.collection('eventLocations').doc(data.eventId);
  await docRef.set({
    latitude: data.latitude,
    longitude: data.longitude,
    eventname: data.eventname,
    image: data.image,
    eventId: data.eventId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    duration: data.duration,
    eventDescription: data.eventDescription,
  });

  eventLocations.push({
    latitude: data.latitude,
    longitude: data.longitude,
    eventname: data.eventname,
    image: data.image,
    eventId: data.eventId,
    createdAt: new Date(),
    duration: data.duration,
    eventDescription: data.eventDescription,
  });

  io.emit('updateEventLocations', eventLocations);
};

const removeEventLocation = async (eventId) => {
  console.log(`Removing event with eventId: ${eventId}`);

  const docRef = db.collection('eventLocations').doc(eventId);
  await docRef.delete();

  eventLocations = eventLocations.filter((event) => event.eventId !== eventId);
  
  io.emit('eventEnded', { eventId: eventId });
  io.emit('updateEventLocations', eventLocations);
};

const deleteOldEvents = async () => {
  const currentTime = admin.firestore.Timestamp.now().toMillis();
  const eventsRef = db.collection('eventLocations');
  const snapshot = await eventsRef.get();

  const batch = admin.firestore().batch();
  snapshot.forEach(doc => {
    const data = doc.data();
    const eventStartTime = data.createdAt.toMillis();
    const eventEndTime = eventStartTime + data.duration;

    if (currentTime > eventEndTime) {
      batch.delete(doc.ref);
    }
  });

  await batch.commit();
  console.log('Deleted old events');
};

setInterval(async () => {
  const eventLocationsRef = db.collection('eventLocations');
  const snapshot = await eventLocationsRef.get();
  eventLocations = [];
  snapshot.forEach(doc => {
    eventLocations.push(doc.data());
  });
  io.emit('updateEventLocations', eventLocations);
  console.log('Sent updateEventLocations:', eventLocations);

  await deleteOldEvents();
}, 10 * 1000);

setInterval(async () => {
  const eventLocationsRef = db.collection('eventLocations');
  const snapshot = await eventLocationsRef.get();
  eventLocations = [];
  snapshot.forEach(doc => {
    eventLocations.push(doc.data());
  });
  io.emit('updateEventLocations', eventLocations);
  console.log('Sent updateEventLocations:', eventLocations);

}, 1 * 10 * 1000);

server.listen(3001, () => {
  console.log('Server is running on port 3001');
});
