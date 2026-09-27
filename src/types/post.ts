export type PostCategory =
  | "Achievement"
  | "Career Update"
  | "News"
  | "General"
  | "Event"
  | "Job";

/** Every category a post can be filed under, in the order shown in the composer. */
export const POST_CATEGORIES: PostCategory[] = [
  "Achievement",
  "Career Update",
  "News",
  "General",
  "Event",
  "Job",
];

export interface PostComment {
  _id: string;
  userId: string;
  authorName: string;
  authorPhoto?: string;
  authorRole: string;
  text: string;
  createdAt: string;
}

export interface Post {
  _id: string;
  author: {
    _id: string;
    name: string;
    profilePhoto?: string;
    role: string;
    department?: string;
    position?: string;
    graduationYear?: string;
  };
  category: PostCategory;
  text: string;
  imageUrl?: string;
  likes: string[];
  comments: PostComment[];
  createdAt: string;
}

export interface CreatePostInput {
  category: PostCategory;
  text: string;
  imageUrl?: string;
}