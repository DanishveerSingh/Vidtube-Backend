import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { Tweet } from "../models/tweet.models.js";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;
  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  if (!userId) {
    throw new ApiError(400, "User not found");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if(String(video.owner) === String(userId)) {
    throw new ApiError(400, "You cannot like your own video");
  }
  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: userId,
    comment: { $exists: false },
    tweet: { $exists: false },
  });
  let action = "";
  if (existingLike) {
    await existingLike.deleteOne();
    action = "unliked";
  } else {
    await Like.create({
      video: videoId,
      likedBy: userId,
    });
    action = "liked";
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { action }, `Video successfully ${action}`));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;
  if (!commentId) {
    throw new ApiError(400, "Comment id is required");
  }
  if (!userId) {
    throw new ApiError(400, "User not found");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  if(String(comment.owner) === String(userId)) {
    throw new ApiError(400, "You cannot like your own comment");
  }
  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
    video: { $exists: false },
    tweet: { $exists: false },
  });
  let action = "";
  if (existingLike) {
    await existingLike.deleteOne();
    action = "unliked";
  } else {
    await Like.create({
      comment: commentId,
      likedBy: userId,
    });
    action = "liked";
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { action }, `Comment successfully ${action}`));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;
  if (!tweetId) {
    throw new ApiError(400, "Tweet id is required");
  }
  if (!userId) {
    throw new ApiError(400, "User not found");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  if(String(tweet.owner) === String(userId)) {
    throw new ApiError(400, "You cannot like your own tweet");
  }
  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
    video: { $exists: false },
    comment: { $exists: false },
  });
  let action = "";
  if (existingLike) {
    await existingLike.deleteOne();
    action = "unliked";
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: userId,
    });
    action = "liked";
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { action }, `Tweet successfully ${action}`));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  if (!userId) {
    throw new ApiError(400, "User not found");
  }
  const likedVideos = await Like.find({
    likedBy: userId,
    video: { $exists: true, $ne: null },
    comment: { $exists: false },
    tweet: { $exists: false },
  })
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit))
    .populate({ path: "video", select: "-__v" });
  const totalLikedVideos = await Like.countDocuments({
    likedBy: userId,
    video: { $exists: true, $ne: null },
    comment: { $exists: false },
    tweet: { $exists: false },
  });
  const videos = likedVideos.map((like) => like.video).filter((video) => video);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        pagination: {
          total: totalLikedVideos,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalLikedVideos / limit),
        },
      },
      "Liked videos fetched successfully"
    )
  );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
