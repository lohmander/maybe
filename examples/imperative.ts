import { AsyncMaybe, Maybe } from "../src";
import type { Comment, Post, User } from "./types";

// Mock API
async function fetchCommentStats(
  comments: Comment[],
): Promise<{ count: number }> {
  return { count: comments.length };
}

function getPostSummary(post: Post) {
  return Maybe.fromNullable(post.comments).map((comments) => ({
    id: post.id,
    title: post.title,
    commentCount: comments.length,
  }));
}

function getPostSummaries(user: User) {
  return Maybe.fromNullable(user.posts).filterMap(getPostSummary);
}

function getEnrichment(user: User) {
  return AsyncMaybe.fromNullable(user.posts)
    .map((posts) => posts.flatMap((post) => post.comments ?? []))
    .flatMap((comments) => AsyncMaybe.fromPromise(fetchCommentStats(comments)));
}

function getResult(user?: User | null) {
  return AsyncMaybe.fromNullable(user)
    .extend("postSummaries", getPostSummaries)
    .extend("enrichment", getEnrichment)
    .withDefault({ count: 0 });
}

// Start with a nullable user
const maybeUser: User = {
  id: 1,
  name: "Alice",
  posts: [
    {
      id: 10,
      title: "Hello",
      comments: [
        { id: 3, body: "First!" },
        { id: 4, body: "Nice!" },
      ],
    },
    { id: 11, title: "Draft", comments: null },
  ],
};

(async () => {
  const finalResult = getResult(maybeUser);
  //
  // ✅ finalResult is:
  //
  // AsyncMaybe<
  //   User & {
  //     postSummaries: { id: number; title: string; commentCount: number }[];
  //     enrichment: { count: number };
  //   }
  // >
  //
  console.log("final result -->", await finalResult.value());

  const emptyResult = getResult(null);
  // ✅ emptyResult is: AsyncMaybe<{ count: number }>
  console.log("empty result -->", await emptyResult.value());
})();
