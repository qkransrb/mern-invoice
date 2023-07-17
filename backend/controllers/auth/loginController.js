import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";

import User from "../../models/userModel.js";
import { systemLogs } from "../../utils/Logger.js";

//  $-title     Login user, get access token and refresh token
//  $-path      POST /api/v1/auth/login
//  $-auth      Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide an email and password");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    res.status(400);
    throw new Error("Invalid credentials");
  }

  if (!(await user.comparePassword(password))) {
    res.status(400);
    systemLogs.error("Invalid credentials");
    throw new Error("Invalid credentials");
  }

  if (!user.isEmailVerified) {
    res.status(400);
    throw new Error(
      "You are not verified. Check your email, a verification email link was sent when you registered."
    );
  }

  if (!user.active) {
    res.status(400);
    throw new Error(
      "You have been deactivated by the admin and login is impossible. Contact us for enquiries."
    );
  }

  const accessToken = jwt.sign(
    { id: user._id, roles: user.roles },
    process.env.JWT_ACCESS_SECRET_KEY,
    { expiresIn: "1h" }
  );

  const newRefreshToken = jwt.sign(
    { id: user._id, roles: user.roles },
    process.env.JWT_REFRESH_SECRET_KEY,
    { expiresIn: "1d" }
  );

  const cookies = req.cookies;

  let newRefreshTokenArray = !cookies?.jwt
    ? user.refreshToken
    : user.refreshToken.filter((token) => token !== cookies.jwt);

  if (cookies?.jwt) {
    const refreshToken = cookies.jwt;
    const availableRefreshToken = await User.findOne({ refreshToken });

    if (!availableRefreshToken) {
      newRefreshTokenArray = [];
    }

    const options = {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: true,
      sameSite: "None",
    };

    res.clearCookie("jwt", options);
  }

  user.refreshToken = [...newRefreshTokenArray, newRefreshToken];
  await user.save();

  res.cookie("jwt", newRefreshToken, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    sameSite: "None",
  });

  return res.status(200).json({
    success: true,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    provider: user.provider,
    avatar: user.avatar,
    accessToken,
  });
});

export default loginUser;
