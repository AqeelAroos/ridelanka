import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addPost = (data) =>
    addDoc(collection(db, 'posts'), { ...data, createdAt: serverTimestamp(), likes: [], comments: [] });

  const toggleLike = (postId, userId) => {
    const ref = doc(db, 'posts', postId);
    const post = posts.find((p) => p.id === postId);
    const liked = post?.likes?.includes(userId);
    return updateDoc(ref, { likes: liked ? arrayRemove(userId) : arrayUnion(userId) });
  };

  const addComment = (postId, comment) => {
    const ref = doc(db, 'posts', postId);
    return updateDoc(ref, { comments: arrayUnion(comment) });
  };

  return { posts, loading, addPost, toggleLike, addComment };
}
