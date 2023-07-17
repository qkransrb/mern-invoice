import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";

import User from "../../models/userModel.js";

//  $-title     Get new access token from the refresh token
//  $-path      GET /api/v1/auth/new_access_token
//  $-auth      Public

// we are rotating the refresh tokens, deleting the old ones, creating new ones and detecting token reuse.
const newAccessToken = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    res.sendStatus(401);
  }

  const refreshToken = cookies.jwt;

  const options = {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    sameSite: "None",
  };

  res.clearCookie("jwt", options);

  const user = await User.findOne({ refreshToken });

  if (!user) {
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET_KEY,
      async (error, decoded) => {
        if (error) {
          return res.sendStatus(403);
        }

        const hackedUser = await User.findOne({ _id: decoded.id });
        hackedUser.refreshToken = [];
        await hackedUser.save();
      }
    );

    return res.sendStatus(403);
  }

  const newRefreshTokenArray = user.refreshToken.filter(
    (token) => token !== refreshToken
  );

  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET_KEY,
    async (error, decoded) => {
      if (error) {
        user.refreshToken = [newRefreshTokenArray];
        await user.save();
      }

      if (error || user._id.toString() !== decoded.id) {
        return res.sendStatus(403);
      }

      const accessToken = jwt.sign(
        {
          id: user._id,
          roles: user.roles,
        },
        process.env.JWT_ACCESS_SECRET_KEY,
        { expiresIn: "1h" }
      );

      const newRefreshToken = jwt.sign(
        {
          id: user._id,
          roles: user.roles,
        },
        process.env.JWT_REFRESH_SECRET_KEY,
        { expiresIn: "1d" }
      );

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
    }
  );
});

export default newAccessToken;
