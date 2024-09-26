import mongoose, { InferSchemaType } from "mongoose";

const FriendshipSchema = new mongoose.Schema(
  {
    userId1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userId2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, required: true, enum: ["pending", "accepted", "rejected"] },
  },
  {
    timestamps: true,
  }
);

export type IFriendship = InferSchemaType<typeof FriendshipSchema>;
const FriendshipModel = mongoose.model("Friendship", FriendshipSchema);

// create Friendship
export const db_createFriendship = async (friendship: IFriendship) => {
  return await FriendshipModel.create(friendship);
};

// get Friendship by id
export const db_getFriendshipById = async (id: string) => {
  return await FriendshipModel.findById(id).exec();
};

// get Friendship by userId1 and userId2
export const db_getFriendshipByUsers = async (userId1: string, userId2: string) => {
  return await FriendshipModel.findOne({
    $or: [
      { userId1, userId2 },
      { userId1: userId2, userId2: userId1 }, // inverted combination
    ],
  }).exec();
};

// get friends user data
export const db_getFriendsUserData = async (userId: string) => {
  return await FriendshipModel.find({
    $or: [{ userId1: userId }, { userId2: userId }],
  })
    .populate({
      path: "userId1", // Populate userId1 with email and username
      select: "email username",
    })
    .populate({
      path: "userId2", // Populate userId2 with email and username
      select: "email username",
    })
    .exec();
};
