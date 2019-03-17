const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys").secretOrKey;
const passport = require("passport");

//load Input Validation
const validationRegisterInput = require("../../validation/register");
const validationLoginInput = require("../../validation/login");

//load user model
const User = require("../../models/User");

// @Route GET api/users/register
// @desc  Register user
// access Public
router.post("/register", (req, res) => {
  const { errors, isValid } = validationRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      errors.email = "Email alredy exist";
      return res.status(400).json(errors);
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200", //size,
        r: "pg", //rating
        d: "mm" //default
      });
      // @Kada kreiramo nov model sa mongooseom zove new User
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar: avatar,
        password: req.body.password
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => {
              console.log(err);
            });
        });
      });
    }
  });
});

// @Route GET api/users/login
// @desc  Login User / Returning JWT Token (JSON WEB TOKEN)
// access Public

router.post("/login", (req, res) => {
  const { errors, isValid } = validationLoginInput(req.body);

  const email = req.body.email;
  const password = req.body.password;

  //find user buy email
  User.findOne({ email }).then(user => {
    //chack for user
    if (!user) {
      errors.email = "User not found";
      return res.status(404).json(errors);
    }

    //chack for password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        //user match
        const payload = {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        }; //Create JWT Payload
        //Sign Token
        jwt.sign(payload, keys, { expiresIn: 3600 }, (err, token) => {
          res.json({
            success: true,
            token: "Bearer " + token
          });
        });
      } else {
        errors.password = "Password is incorrect";
        return res.status(400).json(errors);
      }
    });
  });
});

// @Route GET api/users/current
// @desc  Return current user
// access private
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email
    });
  }
);

module.exports = router;
