// modules
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const twilio = require('twilio');
const accountSid = 'AC9d243462800bb97d44d7408a59724a6d';
const authToken = '3032465ed2eca2971aa852908e113573';
const client = new twilio(accountSid, authToken);

mongoose.connect('mongodb+srv://jordan:Quality1st@cluster0.bmgjn.mongodb.net/<dbname>?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('db connected');
})
let MessageSchema = new mongoose.Schema({

  phoneNumber: String,
  userName: String,
  location: String,
  job: String,

  shift: String,
  Date: String,
  url: String
})

// Name of the model is 'Message' value is MessageSchema
let Message = mongoose.model('Message', MessageSchema);

app.use(bodyParser.urlencoded({
  extended: false
}));

app.get('/', (req, res) => {
  res.end();
});

/**
 * Take to, from, and body from the request body
 * Check to see if the service sent a URL
 * If the service has not sent the URL, 
 */



app.post('/inbound', (req, res) => {
  // the Nurse's phone number
  let from = req.body.From;
  // NurseFly's phone number
  let to = req.body.To;
  // Message from the Nurse
  let body = req.body.Body;
  Message.find({
    phoneNumber: req.body.From
  }, (err, message) => {

    if (message.length !== 0) {

      if (!message[0].job && !message[0].location && !message[0].pay && !message[0].shift) {
        let val = body.toLowerCase();
        if (val.includes('RN') && !val.includes('Therapy') && !val.includes('Allied') && !val.includes('Social')) {
          message.findByIdAndUpdate(message[0]._id, {
            "$set": {
              job: 'RN'
            }
          }, {
            new: true,
            upsert: true
          }, () => {
            client.messages.create({
              body: 'Where would you like to work?',
              to: `${from}`,
              from: `${to}`
            }).then((m) => {
              console.log(m.body)
            })
          })
        } else if (val.includes('Therapy') && !val.includes('RN') && !val.includes('Allied') && !val.includes('Social')) {
          message.findByIdAndUpdate(message[0]._id, {
            "$set": {
              job: 'Therapy'
            }
          }, {
            new: true,
            upsert: true
          }, () => {
            client.messages.create({
              body: 'Where would you like to work?',
              to: `${from}`,
              from: `${to}`
            }).then((m) => {
              console.log(m.body)
            })
          })
        } else if (val.includes('Allied') & !val.includes('RN') & !val.includes('Allied') & !val.includes('Social')) {
          message.findByIdAndUpdate(message[0]._id, {
            "$set": {
              job: 'Allied'
            }
          }, {
            new: true,
            upsert: true
          }, () => {
            client.messages.create({
              body: 'Where would you like to work?',
              to: `${from}`,
              from: `${to}`
            }).then((m) => {
              console.log(m.body)
            })
          })
        } else if (val.includes('Social') && !val.includes('RN') && !val.includes('Allied') && !val.includes('Social')) {
          message.findByIdAndUpdate(message[0]._id, {
            "$set": {
              job: 'Social'
            }
          }, {
            new: true,
            upsert: true
          }, () => {
            client.messages.create({
              body: 'Where would you like to work?',
              to: `${from}`,
              from: `${to}`
            }).then((m) => {
              console.log(m.body)
            })
          })
        } else {
          client.messages.create({
            body: 'Please enter either RN, Allied, Social, or Therapy',
            to: `${from}`,
            from: `${to}`
          })
        }

      }
    } else {
      // if there's no number in the database && if message equals Body
      if (body === 'NURSE') {
        // create a new instance of the message model
        let newMessage = new Message();
        newMessage.phoneNumber = from;
        // saving phone number
        newMessage.save(() => {
          client.messages.create({
            body: 'Hi there! What is your discipline?',
            to: `${from}`,
            from: `${to}`
          }).
          then((m) => {
            console.log('message sent' + m.body)
          })
        })
      }
    }
    res.end();
  })
})

app.listen(3000, () => {
  console.log('server connected');
})