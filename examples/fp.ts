import * as R from "remeda";
import * as M from "../src/functional";
import type { Comment, Post, User } from "./types";

// Mock API
async function fetchCommentStats(
  comments: Comment[],
): Promise<{ count: number }> {
  return { count: comments.length };
}

const getPostSummary = (post: Post) =>
  R.pipe(
    post.comments,
    M.fromNullable,
    M.map((comments) => ({
      id: post.id,
      title: post.title,
      commentCount: comments.length,
    })),
  );

const getPostSummaries = (user: User) =>
  R.pipe(user.posts, M.fromNullable, M.filterMap(getPostSummary));

const getEnrichment = (user: User) =>
  R.pipe(
    user.posts,
    M.fromNullable,
    M.map((posts) => posts.flatMap((post) => post.comments ?? [])),
    M.flatMap(R.piped(fetchCommentStats, M.fromPromise)),
    M.flatMap(
      R.piped(
        R.prop("count"),
        M.fromNullable,
        M.map((x) => x * 4),
      ),
    ),
  );

const x = M.fromPromise(Promise.resolve(123));

const y = M.flatMap<number, number>((n) =>
  M.fromNullable(n > 100 ? n + 1 : null),
)(x);

const getResult = (user?: User | null) =>
  R.pipe(
    user,
    M.fromNullable,
    M.assign({
      enrichment: getEnrichment,
      postSummaries: getPostSummaries,
    }),
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
