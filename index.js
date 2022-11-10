const express = require('express');
const cors = require('cors');
let jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
//middlewares
app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send('service review server is running');
})
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8ony5u1.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' });
    }
    req.decoded = decoded;
    next();
  })
}
async function run() {
  try {
    const serviceCollection = client.db('servicereview').collection('services');
    const reviews = client.db('servicereview').collection('reviews');
    //jwt
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
      res.send({ token })
      console.log({token})
    })
    //get 3 services
    app.get('/services', async (req, res) => {
      const query = {};
      const limit = 3;
      const cursor = serviceCollection.find(query).limit(limit);
      const services = await cursor.toArray();
      res.send(services);

    })
    //add new service
    app.post('/services', async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    })
    //get all services
    app.get('/all-services', async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    })
    //get single service
    app.get('/service/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.send(result);
    })
    //add review to database
    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviews.insertOne(review);
      res.send(result);
    })
    //show all reviews
    app.get('/reviews', verifyJWT, async (req, res) => {
      const decoded = req.decoded;

      if (decoded.email !== req.query.email) {
        res.status(403).send({ message: 'unauthorized access' })
      }
      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email
        }
      }
      const cursor = reviews.find(query).sort({date: 'desc'});
      const reviewss = await cursor.toArray();
      res.send(reviewss);
    })
    //single service all review
    app.get('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { serviceId: id };
      const cursor = reviews.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })
    //review delete
    app.delete('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviews.deleteOne(query);
      res.send(result);
    })
    //get single review
    app.get('/single-reviews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviews.findOne(query);
      res.send(result);
    })
    // review UPdate
    app.put('/update-review/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const review = req.body;
      const option = { upsert: true };
      const updatedUser = {
        $set: {
          message: review.message,
        }
      }
      const result = await reviews.updateOne(filter, updatedUser, option);
      res.send(result);
    })
  }
  finally {

  }

}
run().catch(err => console.error(err))
app.listen(port, () => {
  console.log(`service review server running on ${port}`)
})