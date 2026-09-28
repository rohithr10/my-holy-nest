import { store } from '../store';
import { setBookmarks } from '../store/slices/bible.slice';
import { bibleApi } from '../api/bible.api';
import type { Bookmark } from '../types';

/**
 * Bookmarks live in the store (and on the phone) so the reader responds
 * instantly; these helpers mirror every change to the user's account so the
 * list survives a reinstall or a new phone. Server calls are best-effort: a
 * failure leaves the local bookmark in place and the next sync catches up.
 */

const key = (b: Pick<Bookmark, 'verseId' | 'bookId' | 'chapter' | 'verse'>) =>
  b.verseId || `${b.bookId}.${b.chapter}.${b.verse}`;

function toPayload(b: Bookmark) {
  const { _id, userId, createdAt, ...rest } = b;
  void _id;
  void userId;
  void createdAt;
  return { ...rest, verseId: key(b) };
}

/** Merges the account's bookmarks with any saved only on this phone. */
export async function syncBookmarks(): Promise<void> {
  if (!store.getState().auth.token) return;
  try {
    const server = (await bibleApi.getBookmarks()).data.data;
    const onServer = new Set(server.map(key));
    const localOnly = store.getState().bible.bookmarks.filter(b => !onServer.has(key(b)));
    const uploaded = await Promise.all(
      localOnly.map(b =>
        bibleApi
          .addBookmark(toPayload(b))
          .then(r => r.data.data)
          .catch(() => b),
      ),
    );
    const merged = [...uploaded, ...server].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    store.dispatch(setBookmarks(merged));
  } catch {
    /* offline — keep the local list; the next sync merges */
  }
}

/** Mirrors a toggle made in the reader: saved if it's now bookmarked, else removed. */
export function pushBookmarkToggle(b: Bookmark): void {
  if (!store.getState().auth.token) return;
  const nowBookmarked = store.getState().bible.bookmarks.some(x => key(x) === key(b));
  const call = nowBookmarked ? bibleApi.addBookmark(toPayload(b)) : bibleApi.removeBookmark(key(b));
  call.catch(() => undefined);
}

export function pushBookmarkRemoval(b: Bookmark): void {
  if (!store.getState().auth.token) return;
  bibleApi.removeBookmark(key(b)).catch(() => undefined);
}
