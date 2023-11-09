const express = require("express");
const cors = require("cors");
const cookieparser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
//middlewares
app.use(express.json());
app.use(cookieparser());
app.use(
  cors({
    origin: ["https://gigrapid.web.app", "http://localhost:5173"],
    credentials: true,
  })
);

const logger = (req, res, next) => {
  console.log("log info", req.method, req.url);
  
};

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("token in middleware", token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }
    req.user = decoded;
    next();
  });
};

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

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const gigRapidDB = client.db("GigRapid");
    const jobsCollection = gigRapidDB.collection("jobsCollection");
    const usersCollection = gigRapidDB.collection("usersCollection");
    const bidsCollection = gigRapidDB.collection("bidsCollection");

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log("user token for", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "8h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logged user", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

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
      console.log(bidData);
      const result = await bidsCollection.insertOne(bidData);
      console.log(result);
      res.send(result);
    });

    app.get("/getMyPostedJobs", async (req, res) => {
      const email = req.query.email;
      const result = await jobsCollection
        .find({ JobOwnerEmail: email })
        .toArray();
      res.send(result);
    });

    app.get("/getMyBids", logger,verifyToken, async (req, res) => {
      const email = req.query.email;
      console.log('token owner info', req.user)
      const bids = await bidsCollection
        .find({ Seller: email })
        .sort({ Status: 1 })
        .toArray();

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

    app.delete("/deleteJob", async (req, res) => {
      const id = req.query.jobId;
      const result = jobsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/getBidderList", async (req, res) => {
      const id = req.query.jobId;
      const result = await bidsCollection.find({ JobId: id }).toArray();
      // console.log(id);
      // console.log("line 118", result);
      res.send(result);
    });

    app.post("/bidderAccept", async (req, res) => {
      const id = req.body.id;
      const verdict = req.body.verdict;
      console.log(id, verdict);
      if (verdict === "rejected") {
        const result = await bidsCollection.updateMany(
          { JobId: id },
          { $set: { Status: "canceled" } }
        );
        console.log(result);
        res.send(result);
      } else if (verdict === "accepted") {
        const result = await bidsCollection.updateMany(
          { JobId: id },
          { $set: { Status: "in progress" } }
        );
        console.log(result);
        res.send(result);
      }
    });

    app.post("/taskCompleted", async (req, res) => {
      const id = req.body.jobId;
      const completed = req.body.completed;
      if (completed) {
        const result = await bidsCollection.updateMany(
          { JobId: id },
          { $set: { Status: "Completed" } }
        );
        res.send(result);
      }
    });

    app.get("/getBidRequests", async (req, res) => {
      const email = req.query.email;
      const result = await bidsCollection.find({ Buyer: email }).toArray();
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
