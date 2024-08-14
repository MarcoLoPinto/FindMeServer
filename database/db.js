const mongoose = require('mongoose')
const mongooseModels = require('./mongooseModels')
const bcrypt = require('bcryptjs')

const setupDatabase = async (ADMIN_USER,ADMIN_PASS) => {
    // check if admin already exists
    const adminExists = await mongooseModels.Admin.findOne({name:ADMIN_USER})
    if(adminExists){
        console.log(`${'[DB]'.yellow} ${'Admin already exists, stopping setup'}`)
        return
    }
    // hash password
    const salt = await bcrypt.genSalt(12)
    const passwordHashed = await bcrypt.hash(ADMIN_PASS, salt)
    // create admin
    const user = await mongooseModels.Admin.create({
        name:ADMIN_USER, password:passwordHashed,
    }).catch((e) => {
        data = mongooseModels.f.errorModelHandler(e)
        console.log(`${'[DB]'.yellow} ${data.message.yellow}`)
        return
    })
    if(!user){
        console.log(`${'[DB]'.yellow} ${'Invalid admin data creation'.red}`)
        return
    }
    // here on to setup monsters ecc.
    console.log(`${'[DB]'.yellow} ${'First setup executed'.green}`)
}

const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI)

        console.log(`${'[DB]'.yellow} MongoDB Connected, host: ${`${conn.connection.host}`.cyan}`)
        await setupDatabase(process.env.ADMIN_USER, process.env.ADMIN_PASS) // setup done only first time
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

module.exports = connectDB