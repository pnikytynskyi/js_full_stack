const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const graphqlHttp = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const Event = require('./models/events')

app.use(bodyParser.json());
app.use(
  "/graphql",
  graphqlHttp({
    schema: buildSchema(`
      type Event {
        id: ID!
        title: String!
        description: String!
        price: Float!
        date: String!
      }
    
      input EventInput {
        title: String!
        description: String!
        date: String!
        price: Float!
      }
      
      type RootQuery {
        events: [Event!]!
      }
      
      type RootMutation {
        createEvent(eventInput: EventInput): Event
      }
      
      schema {
        query: RootQuery
        mutation: RootMutation
      }
    `),
    rootValue: {
      events: () => {
        return Event
          .find()
          .then(events => {
            return events.map(event => {
              return { ...event._doc, id: event.id };
            });
          })
          .catch(err => {
          console.log(err);
          throw err;
        });
      },
      createEvent: (args) => {
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date)
        })
        return event
          .save()
          .then(res => {
            console.log(res)

            return { ...res._doc, id: event.id }
          })
          .catch(err => {
            console.log(err);
            throw err;
          });
      },
    },
    graphiql: true,
  })
);

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-bw4xm.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen("3000");
  })
  .catch((err) => {
    console.log(err);
  });
