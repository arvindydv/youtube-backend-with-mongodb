import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";
import { Video } from "../models/video.model.js";



// publish video
const publishAVideo = asyncHandler(async(req, res)=>{

    const { title, description, ispublished} = req.body;
    // check all fields
    if ([title, description].some((field) =>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "title and description are required");
    }

    const videoFileLocalPath = req.files.videoFile[0].path;
    const thumbnailFileLocalPath = req.files.thumbnail[0].path;

    if(!videoFileLocalPath || !thumbnailFileLocalPath){
        throw new ApiError(400, "video file or thumbnail is missing");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailFileLocalPath);
    if(!videoFile || !thumbnail){
        throw new ApiError(500, "error while uploading video file or thumbnail");
    }

    const videoData = {
        title,
        description,
        ispublished,
        videoFile,
        thumbnail,
        duration:req.files.videoFile[0].size,
        owner: req.user._id,
    }

    const video  = await Video.create(videoData);
    const publishedVideo = await Video.findById(video.id);
    if(!publishedVideo){
        throw new ApiError(500, "error while uploading video");
    }

    return res.status(200).json(
        new ApiResponse(200, publishedVideo, "video published successfully")
    )

});

// get video by id
const getVideoById =asyncHandler(async (req, res) => {

      const {videoId} = req.params;
       if(!videoId){
        throw new ApiError(400, "videoId is missing");
       }

       const video = await Video.findById(videoId);
       if(!video){
        throw new ApiError(400, "invailid video id");
       }

      return res.status(200).json(
        new ApiResponse(200, video, "video got sucessfully")
      )
})

// get all videos
const getAllVideo = asyncHandler(async (req, res) => {
     const videos = await Video.find();
     return res.status(200).json(
        new ApiResponse(200, videos, "all videos got sucessfully")
     );
});

// update video
const updateVideo = asyncHandler(async(req, res)=>{
    
    const {videoId} = req.params;
    
    const videoFileLocalPath = req.file.path;
    if(!videoFileLocalPath){
         throw new ApiError(404, "video file is missing");
    }
    
    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    if(!videoFile.url){
        throw new ApiError(500, "error while uploading video file");
    } 

    const checkVideo = await Video.findById(videoId);
    if(req.user?._id !== checkVideo.owner){
          throw new ApiError(400, "invalid video id");
    }
    
    const video  = await Video.findAndUpdate(
        videoId,
        {
            $set:{videoFile}
        },
        {new: true}
    );
    
    return res.status(200).json(
        new ApiResponse(200, video, "video uploaded successfully")
    );

});

// delete videos
const deleteVideo = asyncHandler(async(req, res)=>{
      
    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400, "video id is required");
    }

    const video = await Video.findById(videoId);
    if(req.user?._id !== video.owner){
          throw new ApiError(400, "invalid video id");
    }

    await Video.deleteOne(videoId);
    return res.status(200).json(
        new ApiResponse(200, {}, "video deleted successfully")
    )
})

// toggle publishing
const togglePublishing = asyncHandler(async(req, res)=>{

    const {videoId} = req.params;
    if(!videoId){
        throw new ApiError(400, "video id is required");
    }

    const video = await Video.findById(videoId);
    if(req.user?._id !== video.owner){
          throw new ApiError(400, "invalid video id");
    }
    const {ispublished} = req.body;
    if(!ispublished){
        throw new ApiError(400, "publish status is required");
    }

    const publishedStatus =  await Video.findAndUpdate(
        videoId,
        {
            $set:{ispublished}
        },
        {new: true}
    );

    return res.status(200).json(
        new ApiResponse(200, publishedStatus, "publish status updated successfully")
    )


})



export {
    publishAVideo,
    getVideoById,
    getAllVideo,
    updateVideo,
    deleteVideo,
    togglePublishing
}