import { Request, Response } from "express";
import { asyncWrapper } from "../middlewares/asyncWrapper";
import {
  db_addGameToUser,
  db_getAllGamesFromUser,
  db_searchUsers,
  IUserGame,
} from "../models/User";
import { db_getFriendsUserData } from "../models/Friendship";
import {
  addGameToUserValidation,
  getUserGamesValidation,
} from "../routes/validationSchema/gamesValidation";
import axios from "axios";
import { getTwitchAccessToken } from "../utils";
import { env } from "../config/env";
import cleanGameData from "../utils/cleanGameData";
import { searchUsersValidation } from "../routes/validationSchema/usersValidation";

//#region User Controller
export const addGameToUser = asyncWrapper(async (req: Request, res: Response) => {
  if (!req.userId) {
    return res.status(400).json({ message: "User ID is missing." });
  }

  const userId = req.userId;
  const { gameId, status } = addGameToUserValidation.parse(req.body);

  const statusActionMap: Record<string, { action: "played" | "liked"; condition: boolean }> = {
    played: { action: "played", condition: true },
    liked: { action: "liked", condition: true },
    disliked: { action: "liked", condition: false },
    "non-played": { action: "played", condition: false },
  };

  const selectedStatus = statusActionMap[status];

  if (!selectedStatus) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const { action, condition } = selectedStatus;

  const user = await db_getAllGamesFromUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const existingGame = user.games?.find((game) => game.gameId === gameId);

  if (existingGame) {
    // Game already exists, check if it's already marked the same way
    if (existingGame[action] === condition) {
      return res.status(200).json({ message: `Game already marked as ${status}` });
    }

    existingGame[action] = condition;

    try {
      await user.save();
    } catch (error) {
      return res.status(500).json({ message: "Failed to update the game status" });
    }

    return res
      .status(200)
      .json({ message: "Game status updated successfully", game: existingGame });
  }

  // If the game does not exist, add a new entry
  const newGame: IUserGame = { gameId, [action]: condition };
  const updatedUser = await db_addGameToUser(userId, newGame);

  if (!updatedUser) {
    return res.status(500).json({ message: "Failed to add the game to the user" });
  }

  return res.status(200).json({ message: "Game added successfully", game: newGame });
});

// get all games from user
export const getAllGamesFromUser = asyncWrapper(async (req: Request, res: Response) => {
  const PAGE_RESULTS = 50;

  const userId = req.userId!;
  const { gamesIds } = getUserGamesValidation.parse(req.query);

  const user = await db_getAllGamesFromUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { games } = user;

  if (!games || games.length === 0) {
    return res.status(200).json({ games: [] });
  }

  // create list with all the ids of the games
  const gameToSerch: number[] = gamesIds ? gamesIds : [];
  const likedGamesIds: number[] = [];
  const playedGamesIds: number[] = [];
  const loadAllGames = gameToSerch.length === 0;

  games.forEach((game) => {
    const gameId = game.gameId;
    if (loadAllGames) gameToSerch.push(gameId);
    if (game.liked) likedGamesIds.push(gameId);
    if (game.played) playedGamesIds.push(gameId);
  });

  // get all games from the database
  let query = `fields artworks.image_id, platforms.*, category, first_release_date, franchise.name, genres.name, keywords.name, name, total_rating, total_rating_count`;
  query += `; where id = (${gameToSerch.join(",")})`;
  query += `; sort total_rating desc; limit ${PAGE_RESULTS};`;

  const twitchAccessToken = getTwitchAccessToken();
  const response = await axios.post(`${env.IGDB_URL}/games`, query, {
    headers: {
      Accept: "application/json",
      "Client-ID": env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${twitchAccessToken}`,
    },
  });

  if (response.status !== 200 || !response.data) {
    return res.status(500).send("Something went wrong.");
  }

  const cleanedData = cleanGameData(response.data);

  return res.status(200).json({ games: cleanedData, likedGamesIds, playedGamesIds });
});

// search users by email or username
export const searchUsers = asyncWrapper(async (req: Request, res: Response) => {
  const { q } = searchUsersValidation.parse(req.query);

  if (!q) {
    return res.status(400).json({ message: "Invalid query" });
  }

  const users = await db_searchUsers(q);

  if (!users) {
    return res.status(404).json({ message: "User not found" });
  }

  // exclude the current user from the search results
  const filteredUsers = users.filter((user) => user._id.toString() !== req.userId);

  return res.status(200).json(filteredUsers);
});

// get all the user friends
export const getFriends = asyncWrapper(async (req: Request, res: Response) => {
  const userId = req.userId!;

  const friendships = await db_getFriendsUserData(userId);

  if (!friendships) {
    return res.status(404).json({ message: "Friendships not found" });
  }

  // map through the friendships and return only the friend data
  const friendshipsData = friendships.map((friendship) => {
    // need to differentiate between userId1 and userId2, to see who sent the friend request
    // userId1 is the user who sent the friend request
    // userId2 is the user who received the friend request

    const { _id, userId1, userId2, createdAt, updatedAt, status } = friendship;
    const friend = userId1._id.toString() === userId ? userId2 : userId1;
    return {
      _id,
      received: userId1._id.toString() !== userId,
      friend,
      createdAt,
      updatedAt,
      status,
    };
  });

  return res.status(200).json(friendshipsData);
});

//#endregion
