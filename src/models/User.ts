import mongoose, { InferSchemaType } from "mongoose";

const UserGameSchema = new mongoose.Schema({
  gameId: { type: Number, required: true },
  liked: { type: Boolean, default: undefined },
  played: { type: Boolean, default: undefined },
  rating: { type: Number },
  platform: { type: String },
});

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  sessionId: { type: String, required: true },
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, unique: true },
  authentication: {
    password: { type: String, required: false, select: false },
    salt: { type: String, required: false, select: false },
  },
  username: { type: String, required: true, trim: true },
  verificationToken: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  refreshTokens: {
    required: false,
    type: [refreshTokenSchema],
    default: [],
    select: false,
  },
  games: {
    required: false,
    type: [UserGameSchema],
    default: [],
    select: false,
  },
});

export type IUser = InferSchemaType<typeof UserSchema>;
export type IUserGame = InferSchemaType<typeof UserGameSchema>;
export type IRefreshToken = InferSchemaType<typeof refreshTokenSchema>;

const UserModel = mongoose.model("User", UserSchema);

// create User
export const db_createUser = async (user: IUser) => {
  return await UserModel.create(user);
};

// get User by email
export const db_getUserByEmail = async (email: string) => {
  return await UserModel.findOne({ email })
    .select("+authentication.password +authentication.salt")
    .exec();
};

// get user by verification token
export const db_getUserByVerificationToken = async (verificationToken: string) => {
  return await UserModel.findOne({ verificationToken }).exec();
};

// get User by username
export const db_getUserByUsername = async (username: string) => {
  return await UserModel.findOne({ username })
    .select("+authentication.password +authentication.salt")
    .exec();
};

// get user refreshTokens by Id
export const db_getUserRefreshTokensById = async (id: string) => {
  return await UserModel.findById(id).select("+refreshTokens").exec();
};

// get User by id
export const db_getUserById = async (id: string) => {
  return await UserModel.findById(id).exec();
};

// add game to User
export const db_addGameToUser = async (userId: string, game: IUserGame) => {
  return await UserModel.findByIdAndUpdate(
    userId,
    { $push: { games: game } },
    { new: true }
  ).exec();
};

// get all games from User
export const db_getAllGamesFromUser = async (userId: string) => {
  return await UserModel.findById(userId, { games: 1 }).exec();
};

// given a q params, search for users by email or username that contains the q
export const db_searchUsers = async (q: string) => {
  return await UserModel.find({
    $or: [{ email: { $regex: q, $options: "i" } }, { username: { $regex: q, $options: "i" } }],
  })
    .select("email username _id") // Specify the fields you want
    .exec();
};
