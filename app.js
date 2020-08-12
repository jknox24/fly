// modules
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const file_dir = path.join(__dirname, '/config/dev.env')
dotenv.config({path: file_dir});
console.log(__dirname);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const twilio = require('twilio');
const client = new twilio(process.env.accountSid, process.env.authToken);

// Establishes connection to DB
mongoose.connect('mongodb+srv://jordan:'+process.env.password+'@cluster0.bmgjn.mongodb.net/<dbname>?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('db connected');
})

// Creating a new DB Schema. We want to 
// persist and capture a users search preferences
let MessageSchema = new mongoose.Schema({
  phoneNumber: String,
  job: String,
  location: String,
  shift: String,
  Date: String,
})

// Name of the model is 'Message'. 
let Message = mongoose.model('Message', MessageSchema);

app.use(bodyParser.urlencoded({
  extended: false
}));

app.get('/', (req, res) => {
  res.end();
});

// POST /inbound gets hit whenever a user
// texts twilio's number. We're grabbing the 
// users message and phone number from the body
app.post('/inbound', (req, res) => {
  let from = req.body.From
  let to = req.body.To
  let body = req.body.Body
 
  Message.find({
    /**
     * If any of the given database fields don't
     * have a value, and if the message includes 'rn',
     * update the job field in the database.
     */
    phoneNumber: req.body.From
  }, (error, message) => {
    console.log(body.length, 'hi')
    if (message.length !== 0) {
    
      if (!message[0].job && !message[0].location && !message[0].shift && !message[0].Date) {
        let val = body.toLowerCase();
        console.log(body)
        if (val.includes('rn')) {
          console.log('yo')
          Message.findByIdAndUpdate(message[0]._id, {
            "$set": {
              job: 'RN'
            }
          }, {
            new: true,
            upsert: true
          }, () => {

            /**If the update is successful, send the next 
             * message in the queue. 
             */
            client.messages.create({
              to: `${from}`,
              from: `${to}`,
              body: 'Great, Where would you like to work?'
            }).then((m) => {
              console.log('message send ' + m.body)
            })
          })
          /** 
           * If the users message includes therapy, social, allied, or pharmacy,  
           * update the job field in the database. 
           * 
           */
        } else if (val.includes('therapy') || val.includes('social') || val.includes('allied') || val.includes('pharmacy')) {
          Message.findByIdAndUpdate(message[0]._id, {
            "$set": {
              job: body
            }
          }, {
            new: true,
            upsert: true
          }, () => {
            client.messages.create({
              to: from,
              from: to,
              body: 'Great, what state would you prefer to work in?'
            }).then((m) => {
              console.log('message send ' + m.body)
            })
          })
        } else {

          /** If the user enters otherwise, send the following 
           * message. 
           */
          client.messages.create({
            to: from,
            from: to,
            body: 'Please type either RN, Allied, Pharmacy, Social, or Therapy'
          }).then((m) => {
            console.log('message send ' + m.body)
          })
        }
      } else if (!message[0].location && !message[0].shift && !message[0].Date) {
        Message.findByIdAndUpdate(message[0]._id, {
          "$set": {
            location: body
          }
        }, {
          new: true,
          upsert: true
        }, () => {
          client.messages.create({
            to: from,
            from: to,
            body: 'What is your preferred shift?'

          }).then((m) => {
            console.log('message send ' + m.body)

          })
        })
      } else if (!message[0].shift && !message[0].Date) {
       
        let val = body.toLowerCase();
        if (val.includes('days') || val.includes('nights') || val.includes('evenings') || val.includes('flexible')) {
          Message.findByIdAndUpdate(message[0]._id, {
            "$set": {
              shift: body
            }
          }, {
            new: true,
            upsert: true
          }, () => {
            client.messages.create({
              to: from,
              from: to,
              body: 'What is your expected start date?'
            }).then((m) => {
              console.log('message send ' + m.body)
            })
          })
        } else {
          client.messages.create({
            to: from,
            from: to,
            body: 'Please enter Days, Nights, Evenings, or Flexible.'

          }).then((m) => {
            console.log('message send ' + m.body)
          })
        }
      } else if (!message[0].Date) {
        Message.findByIdAndUpdate(message[0]._id, {
          "$set": {
            Date: body
          }
        }, {
          new: true,
          upsert: true
        }, () => {
          client.messages.create({
            to: from,
            from: to,
            body: 'We are all set to go. Please enter code NURSEFLY to start finding jobs'
          }).then((m) => {
            console.log('message send ' + m.body)
          })
        })
      } else {
        let val = body.toLowerCase()
        if (val.includes('nursefly')) {
          client.messages.create({
            to: from,
            from: to,
            body: 'We found the best healthcare jobs for you here 😃:'+ 'https://www.nursefly.com/browse-jobs/?refinementList%5BnurseflyDiscipline%5D%5B0%5D='+message[0].jobs+'&refinementList%5Blocation%5D%5B0%5D='+message[0].location+'&refinementList%5BshiftFilter%5D%5B0%5D='+message[0].shift+'&refinementList%5BstartMonth%5D%5B0%5D='+message[0].Date+'&page=1&configure%5BhitsPerPage%5D=25&configure%5BfacetingAfterDistinct%5D=true&configure%5Bfilters%5D=sites%3Anursefly',
          }).then((m) => {
            console.log('message send ' + m.body)
          })
        } else if (val.includes('contact') || val.includes('contactus')) {
          client.messages.create({
            to: from,
            from: to,
            body: 'To contact us send an mail at hello@nursefly.com or for more information go to https://nursefly.com' 
            
          }).then((m) => {

            console.log('message send ' + m.body)
          })
        }
      }
    } else {
      // If new user types NURSE && number is
      // not in DB, send message
      if (body === 'NURSE') {
        let newMessage = new Message();
        newMessage.phoneNumber = from
        newMessage.save(() => {
          client.messages.create({
            to: from,
            from: to,
            body: 'Hi there. What is your discipline?'
          }).then((m) => {
            console.log('message send ' + m.body)
          })
        })
      } else {
        // If new user types does not type NURSE && 
        // not in DB, send message
        client.messages.create({
          to: from,
          from: to,
          body: 'Type NURSE to start'
        }).then((m) => {
          console.log('message send ' + m.body)
        })

      }
    }
    res.end();
  })
})

app.listen(3000, () => {
  console.log('server connected');
})