import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user._id;
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  if (!userId) {
    throw new ApiError(400, "User not found");
  }
  const tweet = await Tweet.create({
    content,
    owner: userId,
  });
  return res.status(201).json(
    new ApiResponse(
      201,
      {
        tweet,
      },
      "Tweet created successfully"
    )
  );
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "User id is required");
  }
  const tweets = await Tweet.find({ owner: userId })
  if (!tweets) {
    throw new ApiError(404, "Tweets not found");
  }
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tweets,
      },
      "User tweets fetched successfully"
    )
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { newTweet } = req.body;
  const userId = req.user._id;
  if (!tweetId) {
    throw new ApiError(400, "Tweet id is required");
  }
  if (!userId) {
    throw new ApiError(400, "User not found");
  }
  if (!newTweet) {
    throw new ApiError(400, "New tweet is required");
  }
  const tweets = await Tweet.findById(tweetId);
  if (String(tweets.owner) !== String(userId)) {
    throw new ApiError(400, "You cannot update this tweet");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: newTweet,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, { updateTweet }, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;
  if (!tweetId) {
    throw new ApiError(400, "Tweet id is required");
  }
  if (!userId) {
    throw new ApiError(400, "User not found");
  }
  const tweets = await Tweet.findById(tweetId);
  if (String(tweets.owner) !== String(userId)) {
    throw new ApiError(400, "You cannot delete this tweet");  
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  await Tweet.findByIdAndDelete(tweetId);
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
