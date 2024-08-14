const mongoose = require('mongoose')

function errorModelHandler(e){
    if(e.code && e.code == 11000){
        const field = Object.keys(e.keyValue)
        return {code:400,message:`${field} already exists`}
    }
    else if(e.name === 'ValidationError'){
        console.log(e)
        let em = Object.values(e.errors).map(el => el.message)
        em = em.join("\n")
        return {code:400,message:em}
    }
    return {code:500,message:"An unknown error has occurred"}
}
/* ---------------------------------------------------------------------------------------- */
const adminSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please insert your name'],
        unique: [true, 'Admin already exists'],
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    }
}, {
    timestamps: true,
})
let Admin = mongoose.model('Admin', adminSchema)
/* ---------------------------------------------------------------------------------------- */
const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please insert your name'],
        unique: [true, 'User already exists'],
    },
    nickname: {
        type: String,
        required: [true, 'Please insert your name'],
        unique: false,
    },
    token: {
        type: String,
        required: true,
        unique: [true, 'User session already saved!'],
    },
    user_profile_image: {
        type: Buffer, // casted to MongoDB's BSON type: binData
        required: [true, 'Please add your image profile!']
    },
    voted_num: {
        type: Number,
        default: 0
    },
    voted_distance_mean: {
        type: Number,
        default: 0.0
    },
}, {
    timestamps: true,
})
let User = mongoose.model('User', userSchema)
/* ---------------------------------------------------------------------------------------- */
const imagePostSchema = mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: [true, 'Please give also the user id!']
    },
    photo: {
        type: Buffer, // casted to MongoDB's BSON type: binData
        required: [true, 'Please upload the photo for the post'],
    },
    geoLocationData: {
        type: mongoose.Mixed,
        required: [true, 'Please give also the coordinates of your current position!'],
        latitude: {
            type: mongoose.Decimal128,
            required: [true, 'Please give also the coordinates of your current position!'],
        },
        longitude: {
            type: mongoose.Decimal128,
            required: [true, 'Please give also the coordinates of your current position!'],
        }
    },
    caption: {
        type: String,
        required: false,
        unique: false,
    },
    scores: [{
        type: mongoose.Mixed,
        user_id: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
        latitude: {
            type: mongoose.Decimal128,
            required: [true, 'Please give also the coordinates of guessed position!'],
        },
        longitude: {
            type: mongoose.Decimal128,
            required: [true, 'Please give also the coordinates of guessed position!'],
        }
    }],
    placesAround: [{type: String}]
}, {
    timestamps: true,
})
let ImagePost = mongoose.model('ImagePost', imagePostSchema)
/* ---------------------------------------------------------------------------------------- */
module.exports = { 
    Admin, User, ImagePost,
    f: {
        errorModelHandler
    }

}