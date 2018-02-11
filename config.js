const config = {
    apiKey: "AIzaSyCGewbN9ebe44aAyWZE789REJ-GVu3JV94",
    authDomain: "qupital-meeting-room-booking.firebaseapp.com",
    databaseURL: "https://qupital-meeting-room-booking.firebaseio.com",
    projectId: "qupital-meeting-room-booking",
    storageBucket: "qupital-meeting-room-booking.appspot.com",
    messagingSenderId: "448092595480"
};
firebase.initializeApp(config);

// remove old record
firebase.database().ref().child('booking').orderByChild("date").endAt(moment().startOf('week').subtract(1, 'w').valueOf())
.on("child_added", function(snapshot) {
    firebase.database().ref().child('booking').child(snapshot.key).remove()
})
