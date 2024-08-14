// firebase
const firebase = require('firebase-admin')
const firebaseServiceAccount = require("../config/findme-firebase-adminsdk.json")
firebase.initializeApp({
    credential: firebase.credential.cert(firebaseServiceAccount)
})

module.exports = firebase