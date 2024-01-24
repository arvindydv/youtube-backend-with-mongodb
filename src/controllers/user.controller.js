import {ApiError} from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { request, response } from "express";




// generate accessToken and refreshToken
const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const { fullname, username, email, password } = req.body;
    // check all fields
    if ([fullname, username, email, password].some((field) =>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // check user already exists or not
    const existUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existUser) {
        throw new ApiError(409, "User with email or username is already exists");
    }

    // check imgae file 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImgLocalPath;
    if (req.files && Array.isArray(req.files.coverImg) && req.files.coverImg.length > 0) {
        coverImgLocalPath = req.files.coverImg[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar file is required");
    }
    // upload imgage on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImg = await uploadOnCloudinary(coverImgLocalPath)


    if (!avatar) {
        throw new ApiError(500, "error while uploading avatar");
    }

    // save data in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImg: coverImg?.url || "",  
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while creating a new user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "user registered successfully")
    )

});

// login user
const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required");
    }

    // find userby email or username
    const user = await User.findOne({
        $or: [{ email}, {username }]
    });

    if (!user) {
        throw new ApiError(404, "User not found ");
    }

    // check password
    const isPasswordValid =  await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
     
    // set cookies
    const options = {
      httpOnly:true,
      secure: true,
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options).json(
       new ApiResponse(200, {
            user: loggedInUser, 
            accessToken: accessToken,
            refreshToken: refreshToken
        },
        "user logged in successfully"
        )
    )
});

// logout user
const logoutUser = asyncHandler( async(req, res)=>{
      
    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: {refreshToken: undefined}
           
        },
        { new: true}
    )

    const options = {
        httpOnly:true,
        secure: true,
      }

      return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(
       new ApiResponse(200, {}, "user logged out successfully")
      );

})

// update access token
const refreshAccessToken = asyncHandler(async (req, res) =>{

    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incommingRefreshToken){
        throw new ApiError(401, "unautherized request");
    }

    try {
        const decodeToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodeToken._id);
        if(!user){
            throw new ApiError(401, "token is expired");
        }

        if(user.refreshToken !== incommingRefreshToken ){
            throw new ApiError(401, "invalid refresh token");
        }
       
        const options = {
            httpOnly:true,
            secure: true,
          }

          const {refreshToken, accessToken,} = await generateAccessAndRefereshTokens(user._id);

          return res.status(200).cookie("accessToken", accessToken, options)
          .cookie("refreshToken", refreshToken, options).json(
            new ApiResponse(200, {accessToken: accessToken, refreshToken: refreshToken}, "refresh token updated successfully")
          )

        
    } catch (error) {
        throw new ApiError(401, error.message|| "invalid refresh token");
    }

})

// update password
const updatePassword = asyncHandler(async (req, res) => {

    const {oldPassword, newPassword} = req.body;
    if(!oldPassword || !newPassword) {
        throw new ApiError(400, "all fields are required");
    }

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    user.save({validateBeforeSave: true});
    return res.status(200).json(
        new ApiResponse(200, {}, "password updated successfully")
    )
})

// const get current user
const getUser = asyncHandler (async(req, res)=>{
    return res.status(200).json(
        new ApiResponse(200, req.user, "user got successfully")
    )
})

// update user details
const updateUserDetails = asyncHandler (async(req, res)=>{

    const { fullname, email} = req.body;
    if( !fullname && !email){
        throw new ApiError(400, "Please enter fullname or email");
    }

    const user = await User.findAndUpdate(
        req.user._id,
        {$set:{fullname, email}},
        {new: true}
    ).select("-password, refreshToken");

    return res.status(200).json(
        new ApiResponse(200, user, "user details updated successfully")
    )
});

// update avatar
const updateAvatar = asyncHandler(async(req, res)=>{

    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "avatar file is missing");
    }
   
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(400, "error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, user, "avatar updated successfully")
    );

})

// update cover image
const updateCoverImage = asyncHandler(async(req, res)=>{

    const coverImgLocalPath = req.file.path;
    if(!coverImgLocalPath){
      throw new ApiError(400, "cover image is missing");
    }

    const coverImg = await uploadOnCloudinary(coverImgLocalPath);
    if(!coverImg.url){
        throw new ApiError(400, "error while uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImg: coverImg
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(200, user, "cover image updated successfully")
    )
});

// get user channel profile
const getChannelProfile = asyncHandler(async(req, res)=>{
   
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400, "username is missing");
    }

    const channel = await User.aggregate([
        {
           $match:{
            username: username.toLowerCase(),
           }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as: "subscribedChannel",
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField:"_id",
                foreignField:"channel",
                as: "subscribers"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                subscribedChannelCount: {
                    $size: "subscribedChannel"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
        $project: {
              username: 1,
              fullname: 1,
              isSubscribed: 1,
              subscribedChannelCount: 1,
              subscriberCount: 1,
              coverImg: 1,
              avatar: 1,
        }
    },
    ]);

    if(!channel.length){
        throw new ApiError(400, "channel does not exist");
    }
    
    return res.status(200).json(
        new ApiResponse(200, channel[0], "channel got successfully")
    )
});

// get watch history
const getWatchHistory = asyncHandler( async (req, res) => {
  
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            }
                        }
                    }
                ]
            }
        }
    ])
       
    return res.status(200).json(
        new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully")
    )
});


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    updatePassword,
    getUser,
    updateUserDetails,
    updateAvatar,
    updateCoverImage,
    getChannelProfile,
    getWatchHistory
}