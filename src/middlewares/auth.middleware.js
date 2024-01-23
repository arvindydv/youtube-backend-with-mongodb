import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyJwt = asyncHandler( async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "");
    
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
    
        const decodeToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodeToken?._id).select("-password -refreshToken");
    
         if(!user){
            throw new ApiError(401, 'Invalid accessToken');
         }
    
         req.user = user;
         next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token" );
    }
});

export {
    verifyJwt
}