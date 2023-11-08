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
      const result = await jobsCollection.insertOne(jobDetails);

      res.send(result);
    });

    app.post("/add-user", async (req, res) => {
      const userDetails = req.body.userDetails;

      const result = await usersCollection.insertOne(userDetails);
    });

    app.get("/getUser", async (req, res) => {
      const email = req.query.email;
      const result = await usersCollection.findOne({ userEmail: email });
      res.send(result);
    });
    app.get("/getHello", (req, res) => {
      res.send("hello");
    });

    app.get("/getTabData", async (req, res) => {
      const category = req.query.Category;
      const categoryData = await jobsCollection
        .find({ JobCategory: category })
        .toArray();
      res.send(categoryData);
    });

    app.get("/singleJobData", async (req, res) => {
      const id = req.query.id;
      const jobDetails = await jobsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(jobDetails);
    });

    app.post("/storeBidData", async (req, res) => {
      const bidData = req.body;
      const result = await bidsCollection.insertOne(bidData);
      res.send(result);
    });

    app.get("/getMyPostedJobs", async (req, res) => {
      const email = req.query.email;
      const result = await jobsCollection
        .find({ JobOwnerEmail: email })
        .toArray();
      res.send(result);
    });

    app.get("/getMyBids", async (req, res) => {
      const email = req.query.email;
      const bids = await bidsCollection.find({ Seller: email }).toArray();
      console.log(bids);
      res.send(bids);
    });

    app.post("/update-job", async (req, res) => {
      const id = req.body.JobId;
      const jobDetails = req.body.JobDetails;
      const result = await jobsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: jobDetails }
      );
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
