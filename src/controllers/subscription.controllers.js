import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user._id;
  if (!channelId) {
    throw new ApiError(400, "Channel id is required");
  }
  if (!userId) {
    throw new ApiError(400, "User not found");
  }
  if (String(channelId) === String(userId)) {
    throw new ApiError(400, "You cannot subscribe to yourself");
  }
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }
  const existingSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: userId,
  });
  let action = "";
  if (existingSubscription) {
    await existingSubscription.deleteOne();
    action = "unsubscribed";
  } else {
    await Subscription.create({
      channel: channelId,
      subscriber: userId,
    });
    action = "subscribed";
  }
  return res
    .status(200)
    .json(new ApiResponse(200, action, `Channel succesfully ${action}`));
});

const getUserSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId) {
    throw new ApiError(400, "Subscriber id is required");
  }
  const subscriber = await User.findById(subscriberId);
  if (!subscriber) {
    throw new ApiError(404, "Subscriber not found");
  }
  const subscriptions = await Subscription.find({ subscriber: subscriberId });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriptions,
        "Subscribed channels fetched successfully"
      )
    );
});

const getSubscribersToUser = asyncHandler(async (req, res) => {
  const { channelId  } = req.params;
  if (!channelId ) {
    throw new ApiError(400, "Channel id is required");
  }
  const channel = await User.findById(channelId );
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }
  const subscribers = await Subscription.find({ channel: channelId  });
  const channels = subscribers
    .map((sub) => sub.channel)
    .filter((channel) => channel);
  return res
    .status(200)
    .json(new ApiResponse(200, channels, "Subscribers fetched successfully"));
});

export { toggleSubscription, getUserSubscribedChannels, getSubscribersToUser };
