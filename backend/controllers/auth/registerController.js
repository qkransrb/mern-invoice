import asyncHandler from "express-async-handler";

import User from "../../models/userModel.js";
import VerifyResetToken from "../../models/verifyResetTokenModel.js";
import sendEmail from "../../utils/sendEmail.js";

const domainURL = process.env.DOMAIN;

const { randomBytes } = await import("crypto");

//  $-title     Register user and send email verification link
//  $-path      POST /api/v1/auth/register
//  $-auth      Public
const registerUser = asyncHandler(async (req, res) => {
  const { email, username, firstName, lastName, password, passwordConfirm } =
    req.body;

  if (!email) {
    res.status(400);
    throw new Error("An email address is required");
  }

  if (!username) {
    res.status(400);
    throw new Error("A username is required");
  }

  if (!firstName || !lastName) {
    res.status(400);
    throw new Error(
      "You must enter a full name with a first name nad last name"
    );
  }

  if (!password) {
    res.status(400);
    throw new Error("You must enter a password");
  }

  if (!passwordConfirm) {
    res.status(400);
    throw new Error("Confirm password field is required");
  }

  const userExists = await User.exists({ email });

  if (userExists) {
    res.status(400);
    throw new Error(
      "The email address you've entered is already associated with another account"
    );
  }

  const registeredUser = await User.create({
    email,
    username,
    firstName,
    lastName,
    password,
    passwordConfirm,
  });

  if (!registeredUser) {
    res.status(400);
    throw new Error("User could not be registerd");
  }

  if (registeredUser) {
    const verificationToken = randomBytes(32).toString("hex");

    const emailVerificationToken = await VerifyResetToken.create({
      _userId: registeredUser._id,
      token: verificationToken,
    });

    const emailLink = `${domainURL}/api/v1/auth/verify/${emailVerificationToken.token}/${registeredUser._id}`;

    const payload = {
      name: registeredUser.firstName,
      link: emailLink,
    };

    await sendEmail(
      registeredUser.email,
      "Account Verification",
      payload,
      "./emails/templates/accountVerification.handlebars"
    );

    return res.status(201).json({
      success: true,
      message: `A new user ${registeredUser.firstName} has been registered! A verifiation email has been sent to your account. Please verify within 15 minutes.`,
    });
  }
});

export default registerUser;
