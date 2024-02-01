import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js";

// add comment to the video
const addComment = asyncHandler(async (req, res) => {

    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "video Id is missing");
    }

    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "content is missing");
    }

    const comment = await Comment.create({
        content,
        userId: req.user._id,
        videoId: videoId
    });

    if (!comment) {
        throw new ApiError(400, "invalid video id");
    }

    return res.status(201).json(
        new ApiResponse(201, comment, "comment added successfully")
    )

});

// get all comments
const getAllComments = asyncHandler(async (req, res) => {

    const { videoId } = req.params;
    if (!videoId) {
        throw new ApiError(400, "video id missing");
    }

    const comments = await Comment.find(videoId);

    return res.status(200).json(
        new ApiResponse(200, comments, "all comments got successfully")
    )
});

// update comment
const updateComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;
    const { content } = req.body;
    if (!commentId) {
        throw new ApiError(400, "comment id is missing");
    }

    if (!content) {
        throw new ApiError(400, "content is required");
    }

    const findComment = await Comment.findOne({
        $and: [{ _id: commentId }, { userId: req.user._id }]
    });
    if (!findComment) {
        throw new ApiError(400, "invalid comment id");
    }

    const comment = await findByIdAndUpdate(
        commentId,
        {
            $set: { content }
        },
        { new: true }
    )

    return res.status(200).json(
        new ApiResponse(200, comment, "comment updated successfully")
    );
})

// delete a comment
const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;
    if (!commentId) {
        throw new ApiError(400, "comment id is missing");
    }

    const findComment = await Comment.findOne({
        $and: [{ _id: commentId }, { userId: req.user._id }]
    })

    if (!findComment) {
        throw new ApiError(400, "invailid comment id");
    }

    await Comment.deleteOne({ _id: commentId });

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    )

});

export {
    addComment,
    getAllComments,
    updateComment,
    deleteComment
}