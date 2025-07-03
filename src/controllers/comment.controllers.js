import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const pipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        "owner._id": 1,
        "owner.username": 1,
        "owner.avatar": 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ];
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };
  const comments = await Comment.aggregatePaginate(
    Comment.aggregate(pipeline),
    options
  );
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { comment } = req.body;
  const { videoId } = req.params;
  if (!comment) {
    throw new ApiError(400, "Comment is required");
  }
  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  const newComment = await Comment.create({
    content: comment,
    video: videoId,
    owner: req.user._id,
    id: comment,
  });
  const createdComment = await Comment.findById(newComment._id);
  if (!createdComment) {
    throw new ApiError(404, "Comment not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(201, createdComment, "Comment added"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { newComment } = req.body;
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }
  if (!newComment) {
    throw new ApiError(400, "New comment is required");
  }
  const comments = await Comment.findById(commentId);
  if (!comments) {
    throw new ApiError(404, "Comment not found");
  }
  if (String(comments.owner) !== String(req.user._id)) {
    throw new ApiError(401, "You are not authorized to update this comment");
  }
  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: newComment,
      },
    },
    { new: true }
  );
  return res.status(200).json(new ApiResponse(200, comment, "Comment updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if (String(comment.owner) !== String(req.user._id)) {
    throw new ApiError(401, "You are not authorized to delete this comment");
  }
  await Comment.findByIdAndDelete(commentId);
  return res.status(200).json(new ApiResponse(200, comment, "Comment deleted"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
