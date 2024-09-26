import axios, { AxiosResponse } from "axios";
import { env } from "../config/env";
import { TwitchApiOauthResponse } from "../types/twitchApiTypes";

let twitchAccessToken = "";

export const initializeTwitchAccessToken = async () => {
  await fetchTwitchAccessToken();
  setInterval(fetchTwitchAccessToken, 1000 * 60 * 60 * 9);
};

async function fetchTwitchAccessToken() {
  const response = await axios.post<unknown, AxiosResponse<TwitchApiOauthResponse>>(
    `https://id.twitch.tv/oauth2/token?client_id=${env.TWITCH_CLIENT_ID}&client_secret=${env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
  );
  if (response.status !== 200) {
    throw new Error(response.statusText);
  }
  setTwitchAccessToken(response.data.access_token);
}

const setTwitchAccessToken = (token: string) => {
  twitchAccessToken = token;
};

export const getTwitchAccessToken = () => {
  return twitchAccessToken;
};
