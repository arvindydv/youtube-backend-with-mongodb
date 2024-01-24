import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";


// toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
      
    const {channelId} = req.params;
    if(!channelId){
        throw new ApiError(400, "channel id is missing");
    }
    
    if(channelId == req.user._id){
        throw new ApiError(400, "you cannot subscribe this channel");
    }

    const channel = await User.findById(channelId).select("-password -refreshToken");
    if(!channel){
        throw new ApiError(404, "invalid channel id");
    }

    const subscriptionStatus = await Subscription.find({
        $and: [{channel: channelId}, {subscriber: req.user._id}]
    });

    // if channel is already subscribed
    if(subscriptionStatus.length>0){
        await Subscription.deleteOne({
            $and: [{subscriber: req.user._id}, {channel: channelId}]
        });

        return res.status(200).json(
            new ApiResponse(200, channel, "channel unsubscribed successfully")
        )
    }
     
    await Subscription.create({
        channel: channelId,
        subscriber: req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200, channel, "channel subscribed successfully")
    )
})

// get all subscriber
const getUserChannelSubscribers = asyncHandler (async(req, res) => {

     const {channelId} = req.params;
      if(!channelId){
        throw new ApiError(400, "channel Id is required")
      }

      const subscribers = await User.aggregate([
        {
            $match:{
               _id: new mongoose.Types.ObjectId(channelId)  
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as: "subscribers",
            }
        },
        {
            $addFields:{
                totalSubscriber:{
                    $size:"$subscribers"
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
            $project:{
               username:1,
               isSubscribed:1,
               totalSubscriber:1,
               subscribers: 1
            }
        }
      ])

      if(!subscribers.length){
        throw new ApiError(400, "channel does not exist")
      }

      return res.status(200).json(
        new ApiResponse(200, subscribers, "all subscriber got successfully")
      )

})

// get all subscribed channels
  const getAllSubscribedChannels = asyncHandler(async (req, res) => {
       
    const subscribedChannels = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)  
             }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as: "subscribedChannels",
            }
        },
        {
            $addFields:{
                totalSubscribedChannels:{
                    $size:"$subscribedChannels"
                },
            }
        },
        {
            $project:{
                totalSubscribedChannels:1,
                username:1,
                subscribedChannels:1


            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "get all subscribed channels successfully")
    );

  })

export{
    toggleSubscription,
    getUserChannelSubscribers,
    getAllSubscribedChannels
}