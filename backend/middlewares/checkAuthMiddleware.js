import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const checkAuth = asyncHandler(async (req, res, next) => {
  let jwt_token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer")) {
    jwt_token = authHeader.substring(7);

    jwt.verify(
      jwt_token,
      process.env.JWT_ACCESS_SECRET_KEY,
      async (error, decoded) => {
        if (error) {
          return res.sendStatus(403);
        }

        const userId = decoded._id;
        req.user = await User.findById(userId).select("-password");
        req.roles = decoded.roles;

        return next();
      }
    );
  } else {
    return res.sendStatus(401);
  }
});

export default checkAuth;
