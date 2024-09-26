import { Request, Response } from "express";
import axios from "axios";
import { env } from "../config/env";
import { getTwitchAccessToken, yearToUnixTimestamp } from "../utils";
import { gamesValidation } from "../routes/validationSchema/gamesValidation";
import cleanGameData from "../utils/cleanGameData";
import { db_getAllGamesFromUser } from "../models/User";

export const getGames = async (req: Request, res: Response) => {
  const PAGE_RESULTS = 10;

  const userId = req.userId!;
  const user = await db_getAllGamesFromUser(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // create a list of gameIds
  const gameIds = user.games?.map((game) => game.gameId) || [];

  let { page = 1, console, company, endYear, startYear, genre } = gamesValidation.parse(req.query);

  let offset = 0;
  if (page === 1) {
    offset = 5;
  } else {
    offset = 10;
  }

  const fields = [
    "artworks.image_id",
    "platforms.*",
    "category",
    "first_release_date",
    "franchise.name",
    "genres.name",
    "keywords.name",
    "name",
    "total_rating",
    "total_rating_count",
  ];

  let query = `fields ${fields.join(",")}; where artworks != null & total_rating_count >= 30`;
  // Add additional filters if they exist
  if (console) {
    query += ` & platforms = (${console})`;
  }
  if (company) {
    query += ` & franchise = (${company})`;
  }
  if (genre) {
    query += ` & genres = (${genre})`;
  }
  if (startYear) {
    query += ` & first_release_date >= ${yearToUnixTimestamp(startYear)}`;
  }
  if (endYear) {
    query += ` & first_release_date <= ${yearToUnixTimestamp(endYear)}`;
  }
  if (gameIds.length > 0) {
    query += ` & id != (${gameIds.join(",")})`;
  }
  // Append sorting, limit, and offset
  query += `; sort total_rating desc; limit ${PAGE_RESULTS}; offset ${offset};`;

  const twitchAccessToken = getTwitchAccessToken();
  const response = await axios.post(`${env.IGDB_URL}/games`, query, {
    headers: {
      Accept: "application/json",
      "Client-ID": env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${twitchAccessToken}`,
    },
  });

  if (!response.data || response.status !== 200) {
    return res.status(500).send("Something went wrong.");
  }

  const cleanedData = cleanGameData(response.data);

  return res.status(200).json(cleanedData).end();
};
