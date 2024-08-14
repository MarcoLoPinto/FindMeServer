/* ################# IMPORTS ################# */

const colors = require('colors') // for colors in chat
const path = require('path') // for directory paths
const dotenv = require('dotenv').config({path: './config/.env'}) // .env reader
const express = require('express') // express
const connectDB = require('./database/db') // database

/* ################# SERVER SETUP ################# */

connectDB() // connect to database

const app = express()
app.use(express.json({limit: '5mb'})) // for handling POST json data received from client
app.use(express.urlencoded({ extended: false, limit: '5mb' }))

/* ################# SERVER ROUTES ################# */

// app.use('/api/admin', require('./routes/api/admin'))
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/main', require('./routes/api/main'))

if(process.env.NODE_ENV == 'development'){
    app.use('/api/test', require('./routes/api/test'))
    console.log(`${'[SERVER]'.magenta} ${'development mode!'.red}`)
}

app.use(require('./middewares/middlewareError')) // handle error, if in development it will print the stack

/* ################# SERVER CONNECTION ################# */

// open the server connection
const ip = process.env.IP || '0.0.0.0'
const port = process.env.PORT || 3000
app.listen(port, ip, ()=>{
    console.log(`${'[SERVER]'.magenta} Server started at ${ip}:${port}`)
})