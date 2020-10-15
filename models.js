const {Sequelize, Model, DataTypes} = require('sequelize')
const path = require('path')
const sequelize = process.env.NODE_ENV === 'test'
    ? new Sequelize('sqlite::memory:', null, null, {dialect: 'sqlite'})
    : new Sequelize({dialect: 'sqlite', storage: path.join(__dirname, 'data.db')})

/*------------------Class/database strutcures-----------------------*/ 
class User extends Model {}
User.init({
    username: DataTypes.STRING,
    avatar: DataTypes.STRING,
}, {sequelize})

class AdminTable extends Model {}
AdminTable.init({
    
}, {sequelize})

class Board extends Model {}
Board.init({
    title: DataTypes.STRING,
    tasks: DataTypes.STRING
}, {sequelize})

class Tasks extends Model {}
Tasks.init({
    text: DataTypes.STRING
}, {sequelize})


/*------------------Relationships-----------------------*/ 

// AdminTable.hasMany(User, {as: 'users'})
// User.belongsTo(AdminTable)

Board.hasMany(AdminTable, {as: 'admins'})
AdminTable.belongsTo(Board)

User.hasMany(AdminTable, {as: 'admins'})
AdminTable.belongsTo(User)


Board.hasMany(Tasks, {as:'tasks'})
Tasks.belongsTo(Board)


User.hasMany(Tasks, {as:'tasks'})
Tasks.belongsTo(User)


module.exports = {
    Board,
    Tasks,
    AdminTable,
    User,
    sequelize
}