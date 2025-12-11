import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, orderBy as orderByClause, query, where as whereClause } from 'firebase/firestore';
import { db } from '../components/firebase';

const buildQuery = (collectionRef, { where = [], orderBy } = {}) => {
  let firestoreQuery = collectionRef;

  where.forEach(([field, operator, value]) => {
    firestoreQuery = query(firestoreQuery, whereClause(field, operator, value));
  });

  if (orderBy?.field) {
    firestoreQuery = query(
      firestoreQuery,
      orderByClause(orderBy.field, orderBy.direction ?? 'asc')
    );
  }

  return firestoreQuery;
};

const normaliseWhere = (clauses = []) =>
  clauses.map(([field, operator, value]) => [field, operator, value]);

export const useFirestoreCollection = (path, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const memoisedOptions = useMemo(
    () => ({
      where: normaliseWhere(options.where),
      orderBy: options.orderBy ?? null,
    }),
    [JSON.stringify(options.where ?? []), options.orderBy?.field, options.orderBy?.direction]
  );

  useEffect(() => {
    if (!path) {
      setData([]);
      setLoading(false);
      return undefined;
    }

    const collectionRef = collection(db, path);
    const firestoreQuery = buildQuery(collectionRef, memoisedOptions);

    setLoading(true);
    const unsubscribe = onSnapshot(
      firestoreQuery,
      (snapshot) => {
        const nextData = snapshot.docs.map((snapshotDoc) => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
        setData(nextData);
        setLoading(false);
      },
      (snapshotError) => {
        console.error(`Failed to subscribe to collection "${path}":`, snapshotError);
        setError(snapshotError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path, memoisedOptions]);

  return { data, loading, error };
};

export const useFirestoreDocument = (path) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onSnapshot(
      doc(db, path),
      (snapshot) => {
        setData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        setLoading(false);
      },
      (snapshotError) => {
        console.error(`Failed to subscribe to document "${path}":`, snapshotError);
        setError(snapshotError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path]);

  return { data, loading, error };
};
