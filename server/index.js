// Importuoja reikiamus modulius: Express serveriui, MongoDB duomenų bazės klientui, 
// CORS (Cross-Origin Resource Sharing) užklausų tvarkymui, unikalių ID generavimui ir slaptažodžių šifravimui.
import express from "express";
import { MongoClient } from "mongodb";
import cors from 'cors';
import { v4 as generateID } from 'uuid';
import bcrypt from 'bcrypt';
import "dotenv/config";

// Inicializuoja „Express“ programą ir nustato serverio prievadą ir duomenų bazės prisijungimo nuorodą iš aplinkos kintamųjų.
const app = express();
const PORT = process.env.SERVER_PORT;
const DB_CONNECTION = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.${process.env.CLUSTER_ID}.mongodb.net/`;

// Nustato CORS konfigūraciją, kad užklausos būtų leidžiamos iš nurodyto prievado.
const corsOptions = {
  origin: `http://localhost:${process.env.FRONT_PORT}`
};

// Naudoja „Express“ JSON formato palaikymą ir leidžia CORS užklausas.
app.use(express.json());
app.use(cors(corsOptions));

// Paleidžia serverį ir išveda pranešimą su serverio prievadu.
app.listen(PORT, () => console.log(`Server is running on PORT: ${PORT}.`));

// ********** Naudotojų tvarkymo maršrutai **********

// GET užklausa, kuri grąžina visus naudotojus iš „chat_palace“ duomenų bazės.
app.get('/users', async (req, res) => {
  const client = await MongoClient.connect(DB_CONNECTION);
  try {
    const data = await client.db('chat_palace').collection('users').find().toArray();
    res.send(data);
  } catch(err) {
    res.status(500).send({ error: err })
  } finally {
     client?.close();
  }
});

// Tarpinis tikrinimo metodas registruojant naudotoją, kuris patikrina, ar naudotojo vardas yra unikalus.
const checkUniqueUser = async (req, res, next) => {
  const client = await MongoClient.connect(DB_CONNECTION);
  try {
    const sameUsername = await client.db('chat_palace').collection('users').findOne({ username: req.body.username });
    if(sameUsername){
      res.status(409).send({ errorMessage: 'Username already exists' });
    } else {
      next();
    }
  } catch(err) {
    console.error(err);
    res.status(500).send({ error: err });
  } finally {
    client?.close();
  }
};

// POST užklausa, kuri registruoja naują naudotoją, užkoduodama jo slaptažodį.
app.post('/users', checkUniqueUser, async (req, res) => {
  const client = await MongoClient.connect(DB_CONNECTION);
  try {
    const { password, ...otherUserData } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const userToInsert = {
      ...otherUserData,
      password: hashedPassword,
      _id: generateID()
    };
    await client.db('chat_palace').collection('users').insertOne(userToInsert);
    res.send(userToInsert);
  } catch(err) {
    console.error(err);
    res.status(500).send({ error: "Failed to register user due to a server error." })
  } finally {
    client?.close();
  }
});

// POST užklausa, kuri leidžia naudotojui prisijungti, tikrinant slaptažodį.
app.post('/users/login', async (req, res) => {
  const client = await MongoClient.connect(DB_CONNECTION);
  try {
    const { username, password} = (req.body);
    const user = await client.db('chat_palace').collection('users').findOne({ username });
    if(!user){
      res.status(401).send({ error: 'User does not exist with such username or password.' });
    } 
    const passCheck = bcrypt.compareSync(password, user.password);
    if(!passCheck){
      return res.status(401).send({ error: 'User does not exist with such username or password.' });
    }
    res.status(200).json(user); 
  } catch(err) {
    console.error(err);
    res.status(500).send({ error: err });
  } finally {
    client?.close();
  }
});

// PATCH užklausa, leidžianti redaguoti naudotojo informaciją, įskaitant slaptažodžio keitimą, jei nurodytas naujas slaptažodis.
app.patch('/edit-user/:id', async (req, res) => {
  const client = await MongoClient.connect(DB_CONNECTION);
  try {
    const { username, profileImage, password } = req.body;
    const id = req.params.id;
    const currentUser = await client.db('chat_palace').collection('users').findOne({ _id: id });
    let updateFields = { username, profileImage };
    if (password && password.trim()) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      updateFields.password = hashedPassword;
    }
    const editResponse = await client.db('chat_palace').collection('users').updateOne({ _id: id }, { $set: updateFields });
    if (editResponse.modifiedCount === 0) {
      return res.status(500).send({ error: "Failed to update user." });
    }
    res.send({ success: "User updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Server error. Please try again later." });
  } finally {
    client?.close();
  }
});

// GET užklausa, kuri grąžina naudotoją pagal jo ID.
app.get('/users/:id', async (req, res) => {
  const client = await MongoClient.connect(DB_CONNECTION);
  try {
    const { id } = req.params;
    const user = await client.db('chat_palace').collection('users').findOne({ _id: id });
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.send(user);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to fetch user data due to a server error." });
  } finally {
    client?.close();
  }
});

// ********** Pokalbių tvarkymo maršrutai **********

// Tarpinis autentifikacijos metodas, tikrinantis naudotojo ID.
const authMiddleware = (req, res, next) => {
  const userId = req.headers['_id'];
  if (!userId) {
    return res.status(401).send({ error: "Unauthorized: _id not provided" });
  }
  req._id = userId;
  next();
};

// GET užklausa, kuri grąžina visus naudotojo pokalbius.
app.get('/conversations', authMiddleware, async (req, res) => {
  const client = await MongoClient.connect(DB_CONNECTION);
  try {
    const data = await client.db('chat_palace').collection('conversations').find({
      $or: [{ user1: req._id }, { user2: req._id }]
    }).toArray();
    res.send(data);
  } catch (err) {
    res.status(500).send({ error: err });
  } finally {
    client?.close();
  }
});

// GET užklausa, kuri grąžina konkretų pokalbį pagal jo ID.
app.get('/conversations/:id', authMiddleware, async (req, res) => {
  const client = await MongoClient.connect(DB_CONNECTION);
  try {
    const conversationId = req.params.id;
    const conversation = await client.db('chat_palace').collection('conversations').findOne({
      _id: conversationId,
      $or: [{ user1: req._id }, { user2: req._id }]
    });
    if (!conversation) {
      return res.status(404).send({ error: "Conversation not found or unauthorized access" });
    }
    res.send(conversation);
  } catch (err) {
    res.status(500).send({ error: err });
  } finally {
    client?.close();
  }
});

// POST užklausa, kuri sukuria naują pokalbį tarp dviejų naudotojų.
app.post('/conversations', authMiddleware, async (req, res) => {
  const client = await MongoClient.connect(DB_CONNECTION);
  try {
    const { user2 } = req.body;
    const newConversation = {
      _id: generateID(),
      user1: req._id,
      user2: user2,
      hasUnreadMessages: false
    };
    await client.db('chat_palace').collection('conversations').insertOne(newConversation);
    res.status(201).send(newConversation);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to create conversation due to a server error." });
  } finally {
    client?.close();
  }
});

// ********** Žinučių tvarkymo maršrutai **********

// GET užklausa, kuri grąžina visas konkretaus pokalbio žinutes su siuntėjo informacija.
app.get('/conversations/:id/messages', authMiddleware, async (req, res) => {
  const client = await MongoClient.connect(DB_CONNECTION);
  try {
    const conversationId = req.params.id;
    const userId = req._id;
    const messages = await client.db('chat_palace').collection('messages').aggregate([
      { $match: { conversationId: conversationId } },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      { $unwind: '$senderInfo' },
      { $sort: { timestamp: 1 } }
    ]).toArray();
    await client.db('chat_palace').collection('conversations').updateOne(
      { _id: conversationId, user2: userId },
      { $set: { hasUnreadMessages: false } }
    );
    res.status(200).send(messages);
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    res.status(500).send({ error: "Failed to fetch messages due to a server error." });
  } finally {
    client?.close();
  }
});

// POST užklausa, kuri prideda naują žinutę prie konkretaus pokalbio.
app.post('/conversations/:id/messages', authMiddleware, async (req, res) => {
  const client = await MongoClient.connect(DB_CONNECTION);
  try {
    const conversationId = req.params.id;
    const senderId = req._id;
    const { content } = req.body;
    const newMessage = {
      _id: generateID(),
      conversationId,
      senderId,
      content,
      timestamp: new Date().toISOString(),
      likes: []
    };
    await client.db('chat_palace').collection('messages').insertOne(newMessage);
    await client.db('chat_palace').collection('conversations').updateOne(
      { _id: conversationId, user2: { $ne: senderId } },
      { $set: { hasUnreadMessages: true } }
    );
    res.status(201).send(newMessage);
  } catch (err) {
    console.error("Failed to add message:", err);
    res.status(500).send({ error: "Failed to add message due to a server error." });
  } finally {
    client?.close();
  }
});

// DELETE užklausa, kuri pašalina pokalbį ir su juo susijusias žinutes.
app.delete('/conversations/:id', authMiddleware, async (req, res) => {
  const client = new MongoClient(DB_CONNECTION);
  try {
    const conversationId = req.params.id;
    const userId = req._id;
    await client.connect();
    const db = client.db('chat_palace');
    const conversation = await db.collection('conversations').findOne({
      _id: conversationId,
      $or: [{ user1: userId }, { user2: userId }]
    });
    if (!conversation) {
      return res.status(403).json({ message: "Forbidden: You are not a participant in this conversation" });
    }
    const deleteConversationResult = await db.collection('conversations').deleteOne({ _id: conversationId });
    if (deleteConversationResult.deletedCount === 1) {
      const deleteMessagesResult = await db.collection('messages').deleteMany({ conversationId: conversationId });
      res.status(200).json({
        message: "Conversation and associated messages deleted successfully",
        deletedConversationCount: deleteConversationResult.deletedCount,
        deletedMessagesCount: deleteMessagesResult.deletedCount
      });
    } else {
      res.status(404).json({ message: "Conversation not found or already deleted" });
    }
  } catch (err) {
    console.error("Error deleting conversation and messages:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.close();
  }
});
