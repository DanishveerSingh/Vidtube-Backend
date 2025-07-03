import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const totalVideos = await Video.countDocuments({ owner: userId });
  const videoViews = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: {
          $sum: "$views",
        },
      },
    },
  ]);
  const totalViews = videoViews[0]?.totalViews || 0;
  const totalSubscribers = await Subscription.countDocuments({
    channel: userId,
  });
  const videoIds = await Video.find({ owner: userId }).distinct("_id");
  const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });
  const stats = {
    totalVideos,
    totalViews,
    totalSubscribers,
    totalLikes,
  };
  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Channels Stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  const videos = await Video.find({ owner: userId })
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit))
    .select("-__v");
  const totalVideos = await Video.countDocuments({ owner: userId });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        pagination: {
          total: totalVideos,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalVideos / limit),
        },
      },
      "Channels video fetched successfully"
    )
  );
});

export { getChannelStats, getChannelVideos };
