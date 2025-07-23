const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

exports.createEvent = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { latitude, longitude, eventname, image, eventId, duration, eventDescription } = data;

  // Validate the data.
  if (!latitude || !longitude || !eventname || !image || !eventId || !duration || !eventDescription) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with all the required fields."
    );
  }

  const eventRef = db.collection("events").doc(eventId);

  await eventRef.set({
    latitude,
    longitude,
    eventname,
    image,
    eventId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    duration,
    eventDescription,
    createdBy: context.auth.uid,
  });

  return { message: "Event created successfully", eventId };
});

exports.deleteOldEvents = functions.pubsub.schedule("every 5 minutes").onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  const query = db.collection("events").where("createdAt", "<", new admin.firestore.Timestamp(now.seconds - 24 * 60 * 60, 0));

  const snapshot = await query.get();
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    const event = doc.data();
    const eventEndTime = event.createdAt.toMillis() + event.duration;
    if (now.toMillis() > eventEndTime) {
      batch.delete(doc.ref);
    }
  });

  await batch.commit();
  console.log("Deleted old events.");
  return null;
});
