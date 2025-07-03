import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  const pipeline = [
    {
      $match: {
        isPublished: true,
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
        videoFile: 1,
        thubmnail: 1,
        title: 1,
        description: 1,
        views: 1,
        duration: 1,
        isPublished: 1,
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
  const videos = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  );
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, duration } = req.body;
  const userId = req.user._id;
  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  if (!title || !description || !duration) {
    throw new ApiError(400, "All fields are required");
  }
  if (!userId) {
    throw new ApiError(400, "User not found");
  }
  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }
  let videoFile;
  try {
    videoFile = await uploadOnCloudinary(videoFileLocalPath);
    if (!videoFile || !videoFile.url) {
      throw new ApiError(500, "Video file upload failed");
    }
    console.log("Uploaded Video File", videoFile);
  } catch (error) {
    console.log("Error uploading Video File", error);
    throw new ApiError(500, "Failed to upload video");
  }
  let thumbnail;
  try {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail || !thumbnail.url) {
      throw new ApiError(500, "Thumbnail upload failed");
    }
    console.log("Uploaded Thumbnail", thumbnail);
  } catch (error) {
    console.log("Error uploading Thumbnail", error);
    throw new ApiError(500, "Failed to upload Thumbnail");
  }
  try {
    const newVideo = await Video.create({
      videoFile: videoFile.url,
      thumbnail: thumbnail.url,
      title,
      description,
      duration,
      owner: userId,
    });
    const createdVideo = await Video.findById(newVideo._id);
    if (!createdVideo) {
      throw new ApiError(500, "Failed to create video");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, createdVideo, "Video published successfully"));
  } catch (error) {
    console.log("Video uploading failed", error);
    if (videoFile) {
      await deleteFromCloudinary(videoFile.public_id);
    }
    if (thumbnail) {
      await deleteFromCloudinary(thumbnail.public_id);
    }
    throw new ApiError(500, "Something went wrong while uploading the video");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (!video.isPublished) {
    throw new ApiError(400, "Video is not published");
  }
  if (String(video.owner._id) !== String(req.user._id)) {
    video.views += 1;
    await video.save();
  }
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, duration } = req.body;
  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  if (!title || !description || !duration) {
    throw new ApiError(400, "All fields are required");
  }
  let thumbnail;
  if (req.file) {
    thumbnail = req.file.path;
  }
  const videos = await Video.findById(videoId);
  if (!videos) {
    throw new ApiError(404, "Video not found");
  }
  if(String(videos.owner) !== String(req.user._id)){
    throw new ApiError(400, "You cannot update this video");
  }
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title: title,
        description: description,
        duration: duration,
        thumbnail: thumbnail,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (String(video.owner) !== String(req.user._id)) {
    throw new ApiError(400, "You cannot delete this video");
  }
  await Video.findOneAndDelete(videoId);
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Video id is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (String(video.owner) !== String(req.user._id)) {
    throw new ApiError(400, "You cannot update publish status of this video");
  }
  video.isPublished = !video.isPublished;
  await video.save();
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video is now ${video.isPublished ? "published" : "unpublished"}`
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
