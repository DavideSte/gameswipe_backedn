import { Request, Response } from "express";
import { asyncWrapper } from "../middlewares/asyncWrapper";
import {
  friendIdValidation,
  updateFriendshipValidation,
} from "../routes/validationSchema/friendsValidation";
import { db_getAllGamesFromUser, db_getUserById, IUserGame } from "../models/User";
import {
  db_createFriendship,
  db_getFriendshipById,
  db_getFriendshipByUsers,
  IFriendship,
} from "../models/Friendship";
import mongoose from "mongoose";
import axios from "axios";
import { env } from "../config/env";
import cleanGameData from "../utils/cleanGameData";
import { intersection, difference, getTwitchAccessToken } from "../utils";

//#region Friends Controllers
// create friendship
export const createFriendship = asyncWrapper(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const { friendId } = friendIdValidation.parse(req.body);
  if (userId === friendId) {
    return res.status(400).json({ message: "You cannot be friends with yourself." });
  }

  // check if friend exists
  const friend = await db_getUserById(friendId);
  if (!friend) {
    return res.status(404).json({ message: "Friend not found." });
  }

  // check if friendship already exists
  const friendship = await db_getFriendshipByUsers(userId, friendId);
  if (friendship) {
    return res.status(400).json({ message: "Friendship already exists." });
  }

  // create friendship
  const userIdObject = new mongoose.Types.ObjectId(userId);
  const friendIdObject = new mongoose.Types.ObjectId(friendId);
  const newFriendshipObj: IFriendship = {
    userId1: userIdObject,
    userId2: friendIdObject,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const newFriendship = await db_createFriendship(newFriendshipObj);

  return res.status(201).json(newFriendship);
});

// accept friendship from "/:id/accept"
export const acceptFriendship = asyncWrapper(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const { friendshipId } = updateFriendshipValidation.parse(req.params);
  if (!friendshipId) {
    return res.status(400).json({ message: "Friendship ID is missing." });
  }

  const friendship = await db_getFriendshipById(friendshipId);
  if (!friendship) {
    return res.status(404).json({ message: "Friendship not found." });
  }

  if (friendship.userId2.toString() !== userId) {
    return res.status(403).json({ message: "You are not authorized to accept this friendship." });
  }

  if (friendship.status === "accepted") {
    return res.status(400).json({ message: "Friendship already accepted." });
  }

  friendship.status = "accepted";
  friendship.updatedAt = new Date();
  await friendship.save();

  return res.status(200).json(friendship);
});

// get friend games data
export const getFriendGamesData = asyncWrapper(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const { friendId } = friendIdValidation.parse(req.params);

  // load friend data
  const friend = await db_getUserById(friendId);
  if (!friend) {
    return res.status(404).json({ message: "Friend not found." });
  }

  // check if frienship exists and is accepted
  const friendship = await db_getFriendshipByUsers(userId, friendId);
  if (!friendship) {
    return res.status(404).json({ message: "Friendship not found." });
  }
  if (friendship.status !== "accepted") {
    return res.status(400).json({ message: "Friendship not accepted." });
  }

  // load friend game data
  const friendGameData = await db_getAllGamesFromUser(friendId);
  if (!friendGameData) {
    return res.status(404).json({ message: "Friend not found." });
  }

  // load every gamesId from the user and the friend
  const friendGames = friendGameData.games || [];

  const gamesPlayedByFriend = extractGameIds(friendGames, "played");
  const gamesLikedByFriend = extractGameIds(friendGames, "liked");

  // then gather all the ids and load data from api
  const allGamesIds = [...gamesPlayedByFriend, ...gamesLikedByFriend];

  const gamesData = await getGamesByIds(allGamesIds);

  const games = {
    gamesLikedByFriend: Array.from(gamesPlayedByFriend),
    gamesPlayedByFriend: Array.from(gamesLikedByFriend),
    games: gamesData,
    friend: {
      _id: friend._id,
      username: friend.username,
      email: friend.email,
    },
  };

  return res.status(200).json(games);
});

//#endregion

//#region helper functions
function extractGameIds(games: IUserGame[], key: "played" | "liked"): Set<number> {
  return new Set(games.filter((game) => game[key]).map((game) => game.gameId));
}

async function getGamesByIds(gameIds: number[]) {
  if (gameIds.length === 0) {
    return [];
  }

  const twitchAccessToken = getTwitchAccessToken();

  let query = `fields artworks.image_id, platforms.*, category, first_release_date, franchise.name, genres.name, keywords.name, name, total_rating, total_rating_count;`;
  query += ` where id = (${gameIds.join(",")});`;
  query += ` sort total_rating desc; limit 500;`;

  const response = await axios.post(`${env.IGDB_URL}/games`, query, {
    headers: {
      Accept: "application/json",
      "Client-ID": env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${twitchAccessToken}`,
    },
  });

  if (!response.data || response.status !== 200) {
    throw new Error("Something went wrong.");
  }

  return cleanGameData(response.data);
}

//#endregion
