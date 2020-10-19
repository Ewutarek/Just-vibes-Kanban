const {User, AdminTable, Board, Task, sequelize} = require("./models")

//creating some default users 

const users = [
    {
        "id": 1,
        "username": "Keratuwe",
        "avatar": "https://www.dogtime.com/assets/uploads/2011/03/puppy-development-1280x720.jpg"
    },
    {
        "id": 2,
        "username": "Kaye",
        "avatar": "https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/dog-puppy-on-garden-royalty-free-image-1586966191.jpg"
    },
    {
        "id": 3,
        "username": "Martha",
        "avatar": "https://i.pinimg.com/originals/4a/d6/6e/4ad66eefeeac0da1821837bda5bab703.jpg"
    }
]

//creating default boards

const boards = [
    {
        "id": 1,
        "title": "Just-Vibes",
        "image": "https://static.wixstatic.com/media/b0d56a_6b627e45766d44fa8b2714f5d7860c84~mv2.jpg/v1/fill/w_1440,h_1008,al_c,q_85/b0d56a_6b627e45766d44fa8b2714f5d7860c84~mv2.jpg"
    }
]

//linking users to boards

const admin = [
    {
        "user_id": 1,
        "board_id": 1
    },
    {
        "user_id": 2,
        "board_id": 1
    },
    {
        "user_id": 3,
        "board_id": 1
    }
]

//creating some default tasks 

const tasks = [
    {
        "text": "Make models.js",
        "status": -1, 
        "priority": 0,
        "board_id": 1,
        "user_id": 1
    },
    {
        "text": "Make server.js",
        "status": 0,
        "priority": 0,
        "board_id": 1,
        "user_id": 2
    },
    {
        "text": "Make seed.js",
        "status": 1,
        "priority": 0,
        "board_id": 1,
        "user_id": 3
    } 
]

//creating database then populating it 

sequelize.sync().then( () => {

    const seedUsers = users.map(async (user) => {
        const newUser = await User.create({id: user.id, username: user.username, avatar: user.avatar})
    })

    const seedBoards = boards.map(async (board) => {
        const newBoard = await Board.create({id: board.id, title: board.title, image: board.image})
    })

    const seedAdmin = admin.map(async (admin) => {
        const newAdmin = await AdminTable.create({UserId: admin.user_id, BoardId: admin.board_id})
    })

    const seedTasks = tasks.map(async (task) => {
        const newTask = await Task.create({text: task.text, status: task.status, priority: task.priority, BoardId: task.board_id, UserId: task.user_id})
    })
    
})
