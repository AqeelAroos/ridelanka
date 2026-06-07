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

export function useRoutes() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'routes'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRoutes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const addRoute = (data) =>
    addDoc(collection(db, 'routes'), { ...data, createdAt: serverTimestamp(), likes: [] });

  const toggleLike = (routeId, userId) => {
    const ref = doc(db, 'routes', routeId);
    const route = routes.find((r) => r.id === routeId);
    const liked = route?.likes?.includes(userId);
    return updateDoc(ref, { likes: liked ? arrayRemove(userId) : arrayUnion(userId) });
  };

  return { routes, loading, addRoute, toggleLike };
}
