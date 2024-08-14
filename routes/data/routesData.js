const omit = (obj, ...keys) => Object.fromEntries(
    Object.entries(obj)
    .filter(([key]) => !keys.includes(key))
);

const getAccessibleUserData = (user)=>{
    // let d = omit(user['_doc'] ? user['_doc'] : user, '_id', '__v', 'createdAt', 'updatedAt')
    return user
}

const getAdminData = (admin)=>{
    // let d = omit(admin['_doc'] ? admin['_doc'] : admin, '_id', '__v', 'createdAt', 'updatedAt')
    return user
}

module.exports = {
    getAccessibleUserData, getAdminData
}