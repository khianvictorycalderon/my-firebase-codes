import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

// your custom firebase configuration here
export const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
  };

const app = initializeApp(firebaseConfig);
const firestore_db = getFirestore(app);

interface Data {
  [key: string]: any; // Adjust this type to match your document structure
}

// fs functions, fs_ means firestore
// Create / Update Data (Path must be an even number)
export const fs_write = async (path: string, data: Data, isMerge: boolean): Promise<void> => {
  const docRef = doc(firestore_db, path);
  await setDoc(docRef, data, { merge: isMerge });
};

// Read Data On Request only (Specify the field)
export const fs_read = async (path: string, field: string): Promise<any> => {
  const docRef = doc(firestore_db, path);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return data[field] || null;
  }
  return null;
};

// Read Data Always (Specify the field)
export const fs_reading = (path: string, field: string, callback?: (value: any) => void): (() => void) => {
  const docRef = doc(firestore_db, path);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (callback) {
        callback(data[field] || null);
      }
    } else {
      if (callback) {
        callback(null);
      }
    }
  }, (error) => {
    console.error("Error listening to document: ", error);
    if (callback) {
      callback(null);
    }
  });
  return unsubscribe;
};

// Delete Data
export const fs_delete = async (path: string): Promise<void> => {
  try {
    const docRef = doc(firestore_db, path);
    await deleteDoc(docRef);
    console.log(`Document at ${path} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw new Error('Failed to delete document.');
  }
};

// Usages:
export function Usage() {
  // Create Data / Update
  useEffect(() => {
    fs_write("users/user1", { name: "MyName" }, false);
  }, []);
  //---------------------------

  // Read Data (On Request only)
  const [dataOnReq, setDataOnReq] = useState<string>();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userName = await fs_read("users/user1", "name");
        setDataOnReq(userName);
      } catch (error) {
        setDataOnReq('Failed to fetch name.');
      }
    };
    fetchData();
  }, []);
  //---------------------------

  // Read Data (Always listening to state change)
  const [dataListening, setDataListening] = useState<string>();
  const userID = "user1";
  useEffect(() => {
    // Create a real-time listener
    const unsubscribe = fs_reading(`users/${userID}`, 'name', (newData) => {
      if (newData === null) {
        setDataListening('Failed to fetch name.');
      } else {
        setDataListening(newData);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [userID]);
  //---------------------------

  // Delete Data
  const handleDeleteData = async () => {
    try {
      await fs_delete(`users/${userID}`);
    } catch (error) {
      console.log("Data deletion failed: ", error);
    }
  }
  //---------------------------

  return (
    <>
      <h1>Data on Request: {dataOnReq}</h1>
      <h1>Data in Realtime: {dataListening}</h1>
      <button onClick={handleDeleteData}>Delete Data</button>
    </>
  );
}