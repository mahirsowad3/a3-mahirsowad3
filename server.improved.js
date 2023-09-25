require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const app = express();

let currentId = 3;
let tasksData = [
  {
    id: 0,
    taskName: "Clean the garage",
    taskDescription:
      "Throw away old junk in the trash. Reorganize items to clear up more floor space.",
    taskDeadline: "2023-09-22",
    taskPriority: "Medium",
    taskCreated: "2023-09-05",
  },
  {
    id: 1,
    taskName: "Wash the dishes",
    taskDescription:
      "Wash the dishes in the sink. Put them away in the cabinets.",
    taskDeadline: "2023-09-10",
    taskPriority: "High",
    taskCreated: "2023-09-03",
  },
  {
    id: 2,
    taskName: "Do the laundry",
    taskDescription:
      "Wash the clothes in the washing machine. Dry them in the dryer. Fold them and put them away.",
    taskDeadline: "2023-09-20",
    taskPriority: "Low",
    taskCreated: "2023-09-02",
  },
];

// calculate the duration between two dates
function duration(date1, date2) {
  const diffTime = date2 - date1;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// logging middleware
const logger = (req, res, next) => {
  console.log(`${req.method} request for ${req.url}`);
  next();
};

// tasks posts middleware
const add_task_middleware = (req, res, next) => {
  let dataString = "";
  req.on("data", (data) => {
    dataString += data;
  });

  req.on("end", () => {
    console.log(JSON.parse(dataString));
    newTask = JSON.parse(dataString);
    newTask.id = currentId;
    currentId++;
    tasksData.push(newTask);

    // calculating derived fields
    for (let i = 0; i < tasksData.length; i++) {
      tasksData[i].timeRemaining = duration(
        new Date(),
        new Date(tasksData[i].taskDeadline)
      );
      tasksData[i].totalTime = duration(
        new Date(tasksData[i].taskCreated),
        new Date(tasksData[i].taskDeadline)
      );
    }
    // add a 'json' field to our request object
    // this field will be available in any additional
    // routes or middleware.
    req.json = JSON.stringify(tasksData);

    // advance to next middleware or route
    next();
  });
};

app.use(logger);
app.use(express.static("public"));
app.use(express.json());

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log("username: ", username);
  console.log("password: ", password);
  res.send("You successfully logged in!");
});

app.post("/submit", add_task_middleware, (req, res) => {
  // our request object now has a 'json' field in it from our previous middleware
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(req.json);
});

app.get("/getTasks", (req, res) => {
  // calculating derived fields
  for (let i = 0; i < tasksData.length; i++) {
    tasksData[i].timeRemaining = duration(
      new Date(),
      new Date(tasksData[i].taskDeadline)
    );
    tasksData[i].totalTime = duration(
      new Date(tasksData[i].taskCreated),
      new Date(tasksData[i].taskDeadline)
    );
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(tasksData));
});

app.delete("/deleteTask", (req, res) => {
  let dataString = "";
  req.on("data", (data) => {
    dataString += data;
  });

  req.on("end", () => {
    console.log(JSON.parse(dataString));
    const id = JSON.parse(dataString).id;
    // console.log("delete id: ", id);

    // filter out the task with the given id
    tasksData = tasksData.filter((task) => task.id !== id);

    // calculating derived fields
    for (let i = 0; i < tasksData.length; i++) {
      tasksData[i].timeRemaining = duration(
        new Date(),
        new Date(tasksData[i].taskDeadline)
      );
      tasksData[i].totalTime = duration(
        new Date(tasksData[i].taskCreated),
        new Date(tasksData[i].taskDeadline)
      );
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(tasksData));
  });
});

// MongoDB connection setup
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@${process.env.HOST}`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function testDBConnection() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
// testDBConnection().catch(console.dir);

let collection = null;
async function basicConnection() {
  await client.connect();
  collection = await client.db("a3_todo_list_app").collection("tasks");

  // route to get all docs
  app.get("/docs", async (req, res) => {
    if (collection !== null) {
      const docs = await collection.find({}).toArray();
      res.json(docs);
    }
  });
}

basicConnection().catch(console.dir);

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on http://localhost:3000`);
});
