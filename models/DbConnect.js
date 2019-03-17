module.exports = () => {
  const mongoose = require("mongoose");

  //db config
  const db = require("../config/keys").mongoURI;
  //connect to db
  mongoose
    .connect(
      db,
      { useNewUrlParser: true }
    )
    .then(() => {
      console.log("mongoDB connected");
    })
    .catch(err => {
      console.log(err);
    });
};
