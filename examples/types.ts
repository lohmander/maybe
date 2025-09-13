export type User = { id: number; name: string | null; posts: Post[] | null };
export type Post = { id: number; title: string; comments: Comment[] | null };
export type Comment = { id: number; body: string };
