import asyncHandler from "express-async-handler";

import User from "../../models/userModel.js";
import VerifyResetToken from "../../models/verifyResetTokenModel.js";
import sendEmail from "../../utils/sendEmail.js";

const domainURL = process.env.DOMAIN;

//  $-title     Verify user email
//  $-path      POST /api/v1/auth/verify/:emailToken/:userId
//  $-auth      Public

const verifyUserEmail = asyncHandler(async (req, res) => {
  const { emailToken, userId } = req.params;

  const user = await User.findById(userId).select("-passwordConfirm");

  if (!user) {
    res.status(400);
    throw new Error("We were unable to find a user for this token");
  }

  if (user.isEmailVerified) {
    res.status(400);
    throw new Error("This user has already been verified. Please login");
  }

  const userToken = await VerifyResetToken.findOne({
    _userId: user._id,
    token: emailToken,
  });

  if (!userToken) {
    res.status(400);
    throw new Error("Token invalid! Your token may have expired.");
  }

  user.isEmailVerified = true;
  const updatedUser = await user.save();

  if (updatedUser.isEmailVerified) {
    const emailLink = `${domainURL}/login`;

    const payload = {
      name: user.firstName,
      link: emailLink,
    };

    await sendEmail(
      user.email,
      "Welcome - Account Verified",
      payload,
      "./emails/templates/welcome.handlebars"
    );

    return res.redirect("/auth/verify");
  }
});

export default verifyUserEmail;
