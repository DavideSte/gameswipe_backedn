export interface Property {
  id: number;
  name: string;
}

export interface Game {
  id: number;
  artworks: {
    id: string;
    image_id: string;
  }[];
  category: number;
  first_release_date: number;
  franchise?: Property;
  genres: Property[];
  keywords?: Property[];
  name: string;
  total_rating: number;
  total_rating_count: number;
  played?: boolean;
  liked?: boolean;
}
