<img src="https://github.com/MarcoLoPinto/FindMe/blob/main/readme/titlelogo.png" style="width: 100%; max-width: 600px;">
FindMe server made in Node.js. Share your adventures with people around the globe!

The FindMe Server acts as the backbone for the FindMe app, handling all backend functionalities including user management, photo uploads, location processing, and scoring computations. This repository contains all the necessary code and instructions to set up and run the server on a Node.js environment, ensuring a smooth and robust service for app users.

## Setup

1. After cloning the repository, install the dependencies:
```bash
npm install
```
2. Create a .env in the config/ folder and add all necessary environment variables to it:
```bash
NODE_ENV = development # leave it as it is
PORT = 3000 # leave it as it is
MONGO_URI = YOUR_MONGODB_COLLECTION_URI
MONGO_USERNAME = YOUR_MONGODB_USERNAME
MONGO_PASSWORD = YOUR_MONGODB_PASSWORD
JWT_SECRET = A_JWT_SECRET
ADMIN_USER = YOUR_ADMIN_USERNAME
ADMIN_PASS = YOUR_ADMIN_PASSWORD
GEOAPIFY_PLACES_API = YOUR_GEOAPIFY_PLACES_API
PHOTO_SIZE = 1024 # leave it as it is
USER_SIZE = 320 # leave it as it is
```
3. Add the Firebase adminsdk.json file to the config/ folder (you can find it in your Firebase Console that you used to setup the client).
4. Start the server with:
```bash
node server.js
```




