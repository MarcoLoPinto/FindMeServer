const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const mongooseModels = require('../../database/mongooseModels')
const bcrypt = require('bcryptjs')
const sharp = require('sharp')
const { middlewareFirebaseAuth, middlewareServerAuth } = require('../../middewares/firebaseAuth')

// here "/" means from the root directoy of routes to here, so "/api/test"


const middlewareTest = asyncHandler(async (req, res, next)=>{
    next()
})


// GET request
router.get('/', asyncHandler(async (req, res)=>{
    let data = 'GET request'
    console.log('GET data:',data)
    res.status(200).json(data)
}))

// POST (SET) request
router.post('/', asyncHandler(async (req, res)=>{
    res.status(200).json('POST request')
}))

// region dummy requests

// endregion

router.post('/change_img_to_path', middlewareFirebaseAuth, middlewareServerAuth, asyncHandler(async (req, res)=>{
    const photo_bytes = req.body.path
    const photo_size = parseInt(process.env.USER_SIZE)

    const photo = await sharp( photo_bytes ).resize(photo_size,photo_size).toBuffer().catch((e)=>{
        res.status(500)
        throw new Error(`Error in processing data`)
    })

    req.user.user_profile_image = photo
    req.user.save().catch((e)=>{
        res.status(500)
        throw new Error(`Error in saving data`)
    })

    res.status(200).json({})
}))

router.post('/change_img_to_default', middlewareFirebaseAuth, middlewareServerAuth, asyncHandler(async (req, res)=>{
    const photo_bytes = 'user_default_picture.jpg'
    const photo_size = parseInt(process.env.USER_SIZE)

    const photo = await sharp( photo_bytes ).resize(photo_size,photo_size).toBuffer().catch((e)=>{
        res.status(500)
        throw new Error(`Error in processing data`)
    })

    req.user.user_profile_image = photo
    req.user.save().catch((e)=>{
        res.status(500)
        throw new Error(`Error in saving data`)
    })

    res.status(200).json({})
}))

module.exports = router