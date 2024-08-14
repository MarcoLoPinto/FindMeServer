const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const sharp = require('sharp')

const mongooseModels = require('../../database/mongooseModels')
const { middlewareFirebaseAuth, middlewareServerAuth } = require('../../middewares/firebaseAuth')
const { getAccessibleUserData } = require('../data/routesData')

/*
here "/" means "/api/auth"
*/

router.get('/me', middlewareFirebaseAuth, middlewareServerAuth, asyncHandler(async (req, res)=>{
    res.status(200).json(getAccessibleUserData(req.user))
}))

router.post('/authentication', middlewareFirebaseAuth, middlewareServerAuth, asyncHandler(async (req, res)=>{
    const { username, nickname } = req.body
    const user = req.user
    const token = req.firebaseToken

    if(username && nickname && !user) { // register part

        const photo_size = parseInt(process.env.USER_SIZE)
        const user_profile_image = await sharp( 'user_default_picture.jpg' ).resize(photo_size,photo_size).toBuffer().catch((e)=>{
            res.status(500)
            throw new Error(`Error in processing data`)
        })

        const newUser = await mongooseModels.User.create({
            username, nickname, token: token, user_profile_image
        }).catch((e) => {
            data = mongooseModels.f.errorModelHandler(e)
            res.status(data.code)
            throw new Error(data.message) 
        })
        if(!newUser){
            res.status(400)
            throw new Error('Invalid user data') 
        } else {
            res.status(200).json(getAccessibleUserData(newUser))
        }
        
    } else if(!!user){ // login part

        res.status(200).json(getAccessibleUserData(user))

    } else { // user does not exists, need to go to register!
        res.status(302).json({redirect: "register"})
    }
    
}))

// router.post('/register', asyncHandler(async (req, res)=>{
//     const { username, nickname, token } = req.body
//     if(!username || !nickname || !token){
//         res.status(400)
//         throw new Error('Please add all fields') 
//     }

//     // check if user already exists
//     const userExists = await mongooseModels.User.findOne({username})
//     if(userExists){
//         res.status(400)
//         throw new Error('User already exists') 
//     }

//     // TODO: check if necessary to hash for security reasons! Hash firebase token 
//     const salt = await bcrypt.genSalt(12)
//     const tokenHashed = await bcrypt.hash(token, salt)

//     // create user
//     const user = await mongooseModels.User.create({
//         username, nickname, token: tokenHashed
//     }).catch((e) => {
//         data = mongooseModels.f.errorModelHandler(e)
//         res.status(data.code)
//         throw new Error(data.message) 
//     })
//     if(!user){
//         res.status(400)
//         throw new Error('Invalid user data') 
//     } else {
//         res.status(200).json(getAccessibleUserData(user))
//     }

// }))

// router.post('/login', asyncHandler(async (req, res)=>{
//     const { token } = req.body
//     if(!token){
//         res.status(400)
//         throw new Error('Please add all fields') 
//     }
//     // check if user already exists

//     // TODO: check if necessary to hash for security reasons! Hash firebase token 
//     const salt = await bcrypt.genSalt(12)
//     const tokenHashed = await bcrypt.hash(token, salt)

//     const userExists = await mongooseModels.User.findOne({token:tokenHashed})
//     if(!userExists){
//         res.status(400)
//         throw new Error('The login session is not correct') 
//     } else {
//         res.status(200).json(getAccessibleUserData(userExists))
//     }

// }))

module.exports = router