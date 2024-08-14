const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const mongooseModels = require('../../database/mongooseModels')
const { middlewareFirebaseAuth, middlewareServerAuth } = require('../../middewares/firebaseAuth')
const sharp = require('sharp') // Image Processing
const distanceCalculator = require('gps-distance')

// here "/" means from the root directoy of routes to here, so "/api/main"

router.get('/get_photo_cards/:filter', middlewareFirebaseAuth, middlewareServerAuth, asyncHandler(async (req, res)=>{
    let filter = req.params.filter || ''
    let imagesList = undefined
    const MAX_NUMBER = 10
    if(filter == 'voted'){
        imagesList = await mongooseModels.ImagePost
            .find()
            .where("scores.user_id").in([req.user._id])
            .sort({ createdAt: -1 })
            .limit(MAX_NUMBER)
            .populate('user_id')
            .populate({
                path: 'scores.user_id',
                model: 'User',
            })
            // .select("-photo") // DEBUG
    } 
    else if(filter == 'mine') {
        imagesList = await mongooseModels.ImagePost
            .find({user_id: req.user._id})
            .sort({ createdAt: -1 })
            .limit(MAX_NUMBER)
            .populate('user_id')
            .populate({
                path: 'scores.user_id',
                model: 'User',
            })
            // .select("-photo") // DEBUG
    } 
    else { // filter == "explore"
        imagesList = await mongooseModels.ImagePost
            .find()
            .where("scores.user_id").nin([req.user._id])
            .where("user_id").ne(req.user._id)
            .sort({ createdAt: -1 })
            .limit(MAX_NUMBER)
            .populate('user_id')
            .populate({
                path: 'scores.user_id',
                model: 'User',
            })
            // .select("-photo") // DEBUG
    }

    imagesList = imagesList.map((imagePost) => {
        const {username, nickname, user_profile_image, voted_num, voted_distance_mean} = imagePost.user_id
        
        let imagePostDoc = {...imagePost._doc}
        let {user_id, ...result} = imagePostDoc // I'm excluding superficial values

        const ref_lat = imagePost.geoLocationData.latitude
        const ref_lon = imagePost.geoLocationData.longitude

        result.scores = result.scores.map((score) => {
            const {latitude, longitude} = score
            let distance = distanceCalculator([[latitude,longitude],[ref_lat,ref_lon]])
            return {
                nickname: score.user_id.nickname, 
                username: score.user_id.username, 
                // user_profile_image: score.user_id.user_profile_image, // maybe too big
                distance: distance}
        })

        return {
            ...result,
            username,
            nickname,
            user_profile_image,
            voted_num, 
            voted_distance_mean
        }
    })
    
    res.status(200).json(imagesList)
}))

router.post('/post_photo_card', middlewareFirebaseAuth, middlewareServerAuth, asyncHandler(async (req, res)=>{
    const {username, nickname} = req.user
    const {geoLocationData, caption} = req.body
    const photo_bytes = req.body['photo']['data']
    const photo_size = parseInt(process.env.PHOTO_SIZE)

    // making the photo smaller (1024x1024 if client didn't do it)
    const photo = await sharp( new Buffer.from(photo_bytes) ).resize(photo_size,photo_size).toBuffer().catch((e)=>{
        res.status(500)
        throw new Error(`Error in processing data`)
    })

    var placesAround = []
    // placesAround = ["ICOT, Lazio, Italy",
    //     "Planetario Livio Gratton, Lazio, Italy",
    //     "Clinica San Marco, Lazio, Italy",
    //     'Teatro Moderno "Don Armando Alessandrini", Lazio, Italy',
    //     "Ospedale Santa Maria Goretti, Lazio, Italy",
    //     "Museo della Terra Pontina, Lazio, Italy",
    //     "Teatro Gabriele D'Annunzio, Lazio, Italy",
    //     "Museo Mario Valeriani, Lazio, Italy",
    //     "Teatro Armando Cafaro, Lazio, Italy",
    //     "Museo civico Duilio Cambellotti, Lazio, Italy"] // debug

    // getting places around using API external service (if available!)
    try {
        placesAround = await getPlacesAround(geoLocationData.latitude, geoLocationData.longitude)
    } catch (e) {
        console.log(e)
        placesAround = []
    }
    
    // saving the image
    const imagePost = await mongooseModels.ImagePost.create({
        user_id: req.user._id, geoLocationData, photo, caption, placesAround
    }).catch((e)=>{
        data = mongooseModels.f.errorModelHandler(e)
        res.status(data.code)
        throw new Error(data.message)
    })
    if(!imagePost){
        res.status(400)
        throw new Error(`Invalid data`) 
    }

    res.status(200).json({})
}))

router.post('/remove_photo_card', middlewareFirebaseAuth, middlewareServerAuth, asyncHandler(async (req, res)=>{
    const {_id, username, nickname} = req.user
    const loc_id = req.body._id
    const geoLocationData = req.body.geoLocationData
    
    const imagePost = await mongooseModels.ImagePost.findOne({_id:loc_id, username:username}).catch((e)=>{
        data = mongooseModels.f.errorModelHandler(e)
        res.status(data.code)
        throw new Error(data.message)
    })
    if(!imagePost){
        res.status(404)
        throw new Error(`Not found`) 
    }
    
    imagePost.remove().catch((e)=>{
        data = mongooseModels.f.errorModelHandler(e)
        res.status(data.code)
        throw new Error(data.message)
    })

    res.status(200).json(imagePost)
    
}))

router.post('/guess_location', middlewareFirebaseAuth, middlewareServerAuth, asyncHandler(async (req, res)=>{
    const {_id, username, nickname} = req.user
    const loc_id = req.body.photo_card_id
    let geoLocationData = req.body.geoLocationData

    // geoLocationData = {latitude:1.0,longitude:1.0} // DEBUG
    
    const imagePost = await mongooseModels.ImagePost.findOne({_id:loc_id}).catch((e)=>{
        data = mongooseModels.f.errorModelHandler(e)
        res.status(data.code)
        throw new Error(data.message)
    })
    if(!imagePost){
        res.status(404)
        throw new Error(`Not found`) 
    }
    if(!geoLocationData.latitude || !geoLocationData.longitude){
        res.status(403)
        throw new Error(`Not authorized: no location data provided`) 
    }

    for(let score of imagePost.scores){
        if(score.user_id == _id.toString()){
            res.status(403)
            throw new Error(`Not authorized: already voted`) 
        }
    }

    imagePost.scores.push({user_id:_id, latitude:geoLocationData.latitude, longitude:geoLocationData.longitude})
    imagePost.save().catch((e)=>{
        data = mongooseModels.f.errorModelHandler(e)
        res.status(data.code)
        throw new Error(data.message)
    })

    // compute user score
    let {voted_num, voted_distance_mean} = req.user
    let {latitude, longitude} = imagePost.geoLocationData
    let distance = distanceCalculator([[geoLocationData.latitude,geoLocationData.longitude],[latitude,longitude]])
    let new_distance_mean = (voted_num*voted_distance_mean + distance)/(voted_num+1)
    req.user.voted_num += 1
    req.user.voted_distance_mean = new_distance_mean
    req.user.save().catch((e)=>{
        data = mongooseModels.f.errorModelHandler(e)
        res.status(data.code)
        throw new Error(data.message)
    })

    res.status(200).json(imagePost)
}))

router.post('/update_user_profile_image', middlewareFirebaseAuth, middlewareServerAuth, asyncHandler(async (req, res)=>{
    const photo_bytes = req.body['data']
    const photo_size = parseInt(process.env.USER_SIZE)

    const photo = await sharp( new Buffer.from(photo_bytes) ).resize(photo_size,photo_size).toBuffer().catch((e)=>{
        res.status(500)
        throw new Error(`Error in processing data`)
    })

    req.user.user_profile_image = photo
    req.user.save().catch((e)=>{
        res.status(500)
        throw new Error(`Error in saving data`)
    })

    res.status(200).json(req.user)
}))

router.get('/global_scores', middlewareFirebaseAuth, middlewareServerAuth, asyncHandler(async (req, res)=>{
    const MAX_NUMBER = 50 // top 50 best players

    let bestPlayers = await mongooseModels.User
        .find()
        .where("voted_num").gt(0)
        .sort({ voted_distance_mean: -1 })
        .limit(MAX_NUMBER)
        .catch((e)=>{
            data = mongooseModels.f.errorModelHandler(e)
            res.status(data.code)
            throw new Error(data.message)
        })
    
    res.status(200).json(bestPlayers)
}))

// region compainion functions

async function getPlacesAround(latitude, longitude) { // TODO: url injections
    const DISTANCE = 5000
    const NUM_PLACES = 10
    let categories = ["entertainment.museum","education.university","entertainment.culture","healthcare.hospital"]
    let url = `https://api.geoapify.com/v2/places?categories=${categories.join(",")}&filter=circle:${longitude},${latitude},${DISTANCE}&bias=proximity:${longitude},${latitude}&limit=${NUM_PLACES}&apiKey=${process.env.GEOAPIFY_PLACES_API}`

    let response = await fetch(url, {method: 'GET', headers: {accept: 'application/json'}})
    if(!response.ok) throw new Error(response.statusText)
    let response_decoded = await response.json().catch((e)=>{ throw new Error(e) })

    let results = []
    for (let feature of response_decoded["features"]) {
        results.push(feature["properties"]["name"]+", "+feature["properties"]["state"]+", "+feature["properties"]["country"])
    }

    return results
}

// endregion

module.exports = router


// Deprecated:
/*
router.get('/get_location_scores/:loc_id', middlewareFirebaseAuth, middlewareServerAuth, asyncHandler(async (req, res)=>{
    const loc_id = req.params.loc_id
    
    const imagePost = await mongooseModels.ImagePost.findOne({_id:loc_id}).catch((e)=>{
        data = mongooseModels.f.errorModelHandler(e)
        res.status(data.code)
        throw new Error(data.message)
    })
    if(!imagePost){
        res.status(404)
        throw new Error(`Not found`) 
    }

    const ref_lat = imagePost.geoLocationData.latitude
    const ref_lon = imagePost.geoLocationData.longitude
    
    let scores_users = []

    for(let score of imagePost.scores){

        const {latitude, longitude, user_id} = score
        let distance = ((ref_lat-latitude)**2 + (ref_lon-longitude)**2)**(1/2)

        const score_user = await mongooseModels.User.findOne({_id:user_id}).catch((e)=>{
            data = mongooseModels.f.errorModelHandler(e)
            res.status(data.code)
            throw new Error(data.message)
        })

        scores_users.push({user:score_user.nickname, distance})

    }

    scores_users.sort((a, b) => (a.distance > b.distance) ? 1 : -1)

    res.status(200).json(scores_users)
}))

router.post('/get_places_around', asyncHandler(async (req, res)=>{
    const {latitude, longitude} = req.body
    try {
        let result = await getPlacesAround(latitude, longitude)
        res.status(200).json({"places":result})
    } catch (e) {
        res.status(500)
        throw new Error(e)
    }
}))

router.get('/update_test', asyncHandler(async (req, res)=>{

    let places = ["ICOT, Lazio, Italy",
        "Planetario Livio Gratton, Lazio, Italy",
        "Clinica San Marco, Lazio, Italy",
        'Teatro Moderno "Don Armando Alessandrini", Lazio, Italy',
        "Ospedale Santa Maria Goretti, Lazio, Italy",
        "Museo della Terra Pontina, Lazio, Italy",
        "Teatro Gabriele D'Annunzio, Lazio, Italy",
        "Museo Mario Valeriani, Lazio, Italy",
        "Teatro Armando Cafaro, Lazio, Italy",
        "Museo civico Duilio Cambellotti, Lazio, Italy"]

    let imagePosts = []

    try {
        imagePosts = await mongooseModels.ImagePost
                .updateMany({_id:{$nin:['63d7a56357fce45616cd2b0a']}}, {$set:{placesAround:places}})
    } catch (e) {
        res.status(500)
        throw new Error(e)
    }
    res.status(200).json(imagePosts)

}))

*/