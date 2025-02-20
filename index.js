require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vdkyx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = client.db("listable");
    const taskCollection = db.collection("tasks");

    console.log("Connected to MongoDB!");

    // Create a new task
    app.post("/tasks", async (req, res) => {
        try {
          const task = req.body;
          const result = await taskCollection.insertOne(task);
          const newTask = { _id: result.insertedId, ...task };
          res.status(201).json(newTask);
        } catch (error) {
          res.status(500).json({ error: "Failed to add task" });
        }
      });
    
    app.get("/tasks", async (req, res) => {
        try {
          const todo = await taskCollection.find({ category: "todo" }).toArray();
          const inProgress = await taskCollection
            .find({ category: "inProgress" })
            .toArray();
          const done = await taskCollection.find({ category: "done" }).toArray();
          res.json({ todo, inProgress, done });
        } catch (error) {
          res.status(500).json({ error: "Failed to fetch tasks" });
        }
      });
      
    // Update tasks (bulk update for drag-and-drop functionality)
    app.put("/tasks/drag/:id", async (req, res) => {
        try {
          const { id } = req.params;
          const { category, order } = req.body;
          const filter = { _id: new ObjectId(id) };
          const updateDoc = { $set: { category, order } };
          const result = await taskCollection.updateOne(filter, updateDoc);
          if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Task not found" });
          }
          const updatedTask = await taskCollection.findOne(filter);
          res.json(updatedTask);
        } catch (error) {
          res.status(500).json({ error: "Failed to update task order" });
        }
      });

    // Delete a specific task
    app.delete("/tasks/:id", async (req, res) => {
        try {
          const { id } = req.params;
          if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid ObjectId" });
          }
          const result = await taskCollection.deleteOne({
            _id: new ObjectId(id),
          });
          if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Task not found" });
          }
          res.json({ message: "Task deleted" });
        } catch (error) {
          res.status(500).json({ error: "Failed to delete task" });
        }
      });
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from listable Server...");
});

app.get("/", (req, res) => {
    res.send("Listable server is running!");
  });
