import { pipe } from "remeda";
import * as M from "../src/functional";
import type { User, Post, Comment } from "./types";
import type { Maybe } from "../src";

// Mock API
async function fetchCommentStats(
  comments: Comment[],
): Promise<{ count: number }> {
  return { count: comments.length };
}

const getPostSummary = (post: Post) =>
  pipe(
    M.fromNullable(post.comments),
    M.map((comments) => ({
      id: post.id,
      title: post.title,
      commentCount: comments.length,
    })),
  );

const getPostSummaries = (user: User) =>
  pipe(user.posts, M.fromNullable, M.filterMap(getPostSummary));

const getEnrichment = (user: User) =>
  pipe(
    user.posts,
    M.fromNullable,
    M.map((posts) => posts.flatMap((post) => post.comments ?? [])),
    M.flatMap((comments) => M.fromPromise(fetchCommentStats(comments))),
    M.flatMap(({ count }) => M.fromNullable(count).map((x) => x * 4)),
  );

const x = M.fromPromise(Promise.resolve(123));

const y = M.flatMap<number, number>((n) =>
  M.fromNullable(n > 100 ? n + 1 : null),
)(x);

const getResult = (user?: User | null) =>
  pipe(
    user,
    M.fromNullable,
    M.extend("enrichment", getEnrichment),
    M.extend("postSummaries", getPostSummaries),
    M.withDefault({ count: 0 }),
  );

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
