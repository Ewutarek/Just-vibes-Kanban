const {Sequelize, Model, DataTypes} = require('sequelize')
const Op = Sequelize.Op
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
    image: DataTypes.STRING
}, {sequelize})

class Task extends Model {}
Task.init({
    text: DataTypes.STRING,
    status: DataTypes.INTEGER,
    priority: DataTypes.INTEGER
}, {sequelize})


/*------------------Relationships-----------------------*/ 


Board.hasMany(AdminTable, {as: 'admintables'})
AdminTable.belongsTo(Board)

User.hasMany(AdminTable, {as: 'admintables'})
AdminTable.belongsTo(User)


Board.hasMany(Task, {as:'tasks'})
Task.belongsTo(Board)


User.hasMany(Task, {as:'tasks'})
Task.belongsTo(User)


module.exports = {
    Board,
    Task,
    AdminTable,
    User,
    sequelize,
    Op
}