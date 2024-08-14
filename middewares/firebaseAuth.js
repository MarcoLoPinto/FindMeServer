const asyncHandler = require('express-async-handler')
const jwt = require('jsonwebtoken')
const mongooseModels = require('../database/mongooseModels')
const firebase = require('../firebase/firebase')
const bcrypt = require('bcryptjs')

const middlewareFirebaseAuth = asyncHandler(async (req, res, next) => {
    let token = undefined

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){ // req.headers.authtoken
        try {
            token = req.headers.authorization.split(' ')[1]
            // console.log(token) // DEBUG
            let decodeValue  = await firebase.auth().verifyIdToken(token)

            if(decodeValue){
                req.firebaseResponse = decodeValue
                req.firebaseToken = decodeValue.uid
                // console.log('[Firebase] Success! response from firebase:', decodeValue)
                next() // go to next route
            } else {
                res.status(403)
                throw new Error('Unauthorized')
            }

        } catch (error) {
            res.status(403)
            throw new Error('Unauthorized')
        }

    } 
    if(!token){
        res.status(403)
        throw new Error('Unauthorized, no token provided')
    }
})

const middlewareServerAuth = asyncHandler(async (req, res, next) => {
    const token = req.firebaseToken
    const userExists = await mongooseModels.User.findOne({token:token})
    req.user = userExists
    next()
})

module.exports = {
    middlewareFirebaseAuth, middlewareServerAuth
}