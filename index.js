const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//middlewares
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ez5uydg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const gigRapidDB = client.db("GigRapid");
    const jobsCollection = gigRapidDB.collection("jobsCollection");
    const usersCollection = gigRapidDB.collection("usersCollection");
    const bidsCollection = gigRapidDB.collection("bidsCollection");

    app.post("/add-job", async (req, res) => {
      const jobDetails = req.body;
      console.log(jobDetails);
      const result = await jobsCollection.insertOne(jobDetails);
      console.log(`A document was inserted with the _id: ${result.insertedId}`);
      res.send(result);
    });

    app.post("/add-user", async (req, res) => {
      const userDetails = req.body.userDetails;
      console.log(userDetails);
      const result = await usersCollection.insertOne(userDetails);
      console.log(`A user inserted with the _id: ${result.insertedId}`);
    });

    app.get("/getUser", async (req, res) => {
      const email = req.query.email;
      const result = await usersCollection.findOne({ userEmail: email });
      res.send(result);
    });

   

    

    
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
