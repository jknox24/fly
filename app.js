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
  job: String,
  userName: String,
  location: String,
  shift: String,
  Date: String,
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
 *  Text NURSE to trigger first message from bot [x]
 *  Send Message to user if message is not NURSE [X]
 *  Ask user what about their discipline [x]
 *  Send message to user if they don't respond with correct discipline [x]
 *  Save response to the database [x]
 *  Ask user about their location preference []
 */
app.post('/inbound', (req, res) => {
  let from = req.body.From
  let to = req.body.To
  let body = req.body.Body
  // console.log(from)
  // console.log(to)
  // console.log(body)
  Message.find({
    phoneNumber: req.body.From
  }, (error, message) => {
    console.log(body.length, 'hi')
    if (message.length !== 0) {
      console.log({
        message
      })
      if (!message[0].job && !message[0].location && !message[0].userName && !message[0].shift && !message[0].date) {
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
            client.messages.create({
              to: `${from}`,
              from: `${to}`,
              body: 'Great, Where would you like to work?'
            }).then((m) => {
              console.log('message send ' + m.body)
            })
          })
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
          client.messages.create({
            to: from,
            from: to,
            body: 'Please type either RN, Allied, Pharmacy, Social, or Therapy'
          }).then((m) => {
            console.log('message send ' + m.body)
          })
        }
      } else if (!message[0].location && !message[0].shift && !message[0].userName && !message[0].date) {
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

      } else if (!message[0].shift && !message[0].userName && !message[0].date) {
        let val = body.toLowerCase();
        if (val.includes('Days') || val.includes('Nights') || val.includes('Evenings') || val.includes('Flexible')) {
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
            body: 'Please enter Days, Nights, Evenings, or Flexible'

          }).then((m) => {
            console.log('message send ' + m.body)
          })
        }
      } else if (!message[0].date && !message[0].userName) {
        Message.findByIdAndUpdate(message[0]._id, {
          "$set": {
            date: body
          }
        }, {
          new: true,
          upsert: true
        }, () => {
          client.messages.create({
            to: from,
            from: to,
            body: 'Thank you. One last question, what is your name?'

          }).then((m) => {
            console.log('message send ' + m.body)

          })
        })
      } else if (!message[0].userName) {
        Message.findByIdAndUpdate(message[0]._id, {
          "$set": {
            userName: body
          }
        }, {
          new: true,
          upsert: true
        }, () => {
          client.messages.create({
            to: from,
            from: to,
            body: 'Thank you. Enter code NURSEFLY to start finding jobs'
          }).then((m) => {
            console.log('message send ' + m.body)
          })
        })

      } else {
        let val = body.toLowerCase()
        if (val.includes('NURSEFLY')) {
          client.messages.create({
            to: from,
            from: to,
            body: 'Here is your link ' + message[0].userName + ':your order Id: ' + message[0]._id + ' and you have ordered ' + message[0].numberofpizza + ' ' + message[0].sizeofpizza + ' ' + message[0].vegpizza + ' ' + message[0].typeofpizza + ' will be deliver at address  : ' + message[0].address + ' with in 30 min Thank You for using our service ',
          }).then((m) => {
            console.log('message send ' + m.body)
          })
        } else if (val.includes('contact') || val.includes('contactus')) {
          client.messages.create({
            to: from,
            from: to,
            body: 'To contact us send mail at hello@nursefly.com or for more information https://nursefly.com'

          }).then((m) => {

            console.log('message send ' + m.body)
          })
        }
      }
    } else {
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